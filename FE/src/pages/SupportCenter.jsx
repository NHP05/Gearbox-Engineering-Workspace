import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const parseStoredJson = (key, fallback = {}) => {
    try {
        const parsed = JSON.parse(localStorage.getItem(key) || '');
        return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch (error) {
        return fallback;
    }
};

const toRole = (value) => String(value || 'USER').toUpperCase();
const normalizeTicketStatus = (value) => String(value || 'open').toLowerCase();
const isTicketBanned = (ticket) => normalizeTicketStatus(ticket?.status) === 'banned';
const isTicketDeletedByAdmin = (ticket) => normalizeTicketStatus(ticket?.status) === 'deleted_by_admin';
const isTicketDeletedByUser = (ticket) => normalizeTicketStatus(ticket?.status) === 'deleted_by_user';
const isTicketClosed = (ticket) => isTicketBanned(ticket) || isTicketDeletedByAdmin(ticket) || isTicketDeletedByUser(ticket);

const resolveTicketStatusLabel = (ticket, t) => {
    if (isTicketBanned(ticket)) return t('support_status_banned');
    if (isTicketDeletedByAdmin(ticket)) return t('support_status_deleted_admin');
    if (isTicketDeletedByUser(ticket)) return t('support_status_deleted_user');
    return t('support_status_open');
};

const resolveTicketStatusClass = (ticket) => {
    if (isTicketBanned(ticket)) return 'bg-amber-100 text-amber-700';
    if (isTicketDeletedByAdmin(ticket)) return 'bg-red-100 text-red-700';
    if (isTicketDeletedByUser(ticket)) return 'bg-slate-200 text-slate-700';
    return 'bg-emerald-100 text-emerald-700';
};

const formatDateLabel = (value, language) => {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleString(language === 'en' ? 'en-US' : 'vi-VN');
};

const sortTickets = (rows = []) => {
    return [...rows].sort((a, b) => {
        const aTime = new Date(a?.lastMessageAt || a?.updatedAt || a?.createdAt || 0).getTime();
        const bTime = new Date(b?.lastMessageAt || b?.updatedAt || b?.createdAt || 0).getTime();
        return bTime - aTime;
    });
};

const resolveTicketCode = (ticket) => String(ticket?.ticketCode || ticket?.ticketId || ticket?.id || '').trim();

const findTicketByQuery = (tickets = [], query = '') => {
    const normalized = String(query || '').trim();
    if (!normalized) return null;

    return tickets.find((item) => {
        const code = resolveTicketCode(item);
        return code === normalized || String(item?.id || '') === normalized;
    }) || null;
};

const SupportCenter = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { isDark, toggleTheme } = useTheme();
    const { t, language } = useLanguage();
    const user = parseStoredJson('gearbox_user', {});
    const focusedTicketRef = useRef(null);
    const userRole = toRole(user?.role);
    const isAdmin = userRole === 'ADMIN';
    const ticketQuery = String(searchParams.get('ticket') || '').trim();

    const [form, setForm] = useState({
        name: user?.full_name || user?.name || user?.username || '',
        email: user?.email || '',
        subject: t('support_page_title'),
        message: '',
        priority: 'normal',
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [ticketsLoading, setTicketsLoading] = useState(false);
    const [ticketsError, setTicketsError] = useState('');
    const [activeTicketId, setActiveTicketId] = useState(null);
    const [expandedTicketById, setExpandedTicketById] = useState({});
    const [replyDraft, setReplyDraft] = useState('');
    const [replyLoading, setReplyLoading] = useState(false);
    const [adminNotice, setAdminNotice] = useState('');
    const [adminActionBusy, setAdminActionBusy] = useState('');
    const [userReplyDraftByTicketId, setUserReplyDraftByTicketId] = useState({});
    const [userReplyNoticeByTicketId, setUserReplyNoticeByTicketId] = useState({});
    const [userReplyBusyTicketId, setUserReplyBusyTicketId] = useState(null);

    const orderedTickets = useMemo(() => sortTickets(tickets), [tickets]);
    const activeTicket = useMemo(() => {
        if (!activeTicketId) return null;
        return orderedTickets.find((item) => Number(item.id) === Number(activeTicketId)) || null;
    }, [orderedTickets, activeTicketId]);

    const patchTicketInList = (ticket) => {
        if (!ticket?.id) return;

        setTickets((prev) => {
            const existed = prev.some((item) => Number(item.id) === Number(ticket.id));
            const next = existed
                ? prev.map((item) => (Number(item.id) === Number(ticket.id) ? ticket : item))
                : [ticket, ...prev];
            return sortTickets(next);
        });
    };

    const loadTickets = useCallback(async () => {
        setTicketsLoading(true);
        setTicketsError('');

        try {
            const endpoint = isAdmin ? '/support/tickets' : '/support/my-tickets';
            const response = await axiosClient.get(endpoint);
            const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
            setTickets(sortTickets(rows));
        } catch (error) {
            setTickets([]);
            setTicketsError(error?.response?.data?.message || t('support_ticket_list_failed'));
        } finally {
            setTicketsLoading(false);
        }
    }, [isAdmin, t]);

    useEffect(() => {
        if (isAdmin) return;

        let mounted = true;

        const syncProfile = async () => {
            try {
                const response = await axiosClient.get('/auth/me');
                const profile = response?.data?.data || {};

                if (!mounted) return;

                setForm((prev) => ({
                    ...prev,
                    name: profile?.full_name || profile?.name || profile?.username || prev.name,
                    email: profile?.email || prev.email,
                }));
            } catch (error) {
                // Keep local user fallback on error.
            }
        };

        syncProfile();

        return () => {
            mounted = false;
        };
    }, [isAdmin]);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    useEffect(() => {
        if (!orderedTickets.length) {
            setActiveTicketId(null);
            setExpandedTicketById({});
            return;
        }

        const matchedByQuery = findTicketByQuery(orderedTickets, ticketQuery);
        if (matchedByQuery) {
            if (Number(activeTicketId) !== Number(matchedByQuery.id)) {
                setActiveTicketId(matchedByQuery.id);
            }

            if (isAdmin) {
                setExpandedTicketById((prev) => ({
                    ...prev,
                    [matchedByQuery.id]: true,
                }));
            } else {
                setExpandedTicketById({
                    [matchedByQuery.id]: true,
                });
            }
            return;
        }

        if (!activeTicketId && isAdmin) {
            setActiveTicketId(orderedTickets[0].id);
        }
    }, [orderedTickets, ticketQuery, activeTicketId, isAdmin]);

    useEffect(() => {
        if (!activeTicketId || !focusedTicketRef.current) return;
        if (!ticketQuery) return;

        focusedTicketRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    }, [activeTicketId, ticketQuery]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setResult(null);

        try {
            const response = await axiosClient.post('/support/contact', {
                ...form,
                language,
            });
            setResult({
                ok: true,
                message: response?.data?.message || t('wizard_ticket_sent'),
                ticketId: response?.data?.data?.ticketCode || response?.data?.data?.ticketId,
            });
            setForm((prev) => ({ ...prev, message: '' }));

            if (response?.data?.data) {
                patchTicketInList(response.data.data);

                const createdCode = resolveTicketCode(response.data.data);
                if (createdCode) {
                    setSearchParams((prev) => {
                        const next = new URLSearchParams(prev);
                        next.set('ticket', createdCode);
                        return next;
                    });
                }

                setActiveTicketId(response.data.data.id || null);
                if (response.data.data.id) {
                    setExpandedTicketById({
                        [response.data.data.id]: true,
                    });
                }
            }

            await loadTickets();
        } catch (error) {
            const message = error?.response?.data?.message || t('wizard_ticket_failed');
            setResult({ ok: false, message });
        } finally {
            setLoading(false);
        }
    };

    const clearTicketQuery = () => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.delete('ticket');
            return next;
        });
    };

    const syncTicketQuery = (ticket) => {
        const code = resolveTicketCode(ticket);
        if (!code) return;

        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set('ticket', code);
            return next;
        });
    };

    const requestAdminPassword = () => {
        if (!isAdmin) return null;

        const value = window.prompt(t('admin_password_confirm_prompt'), '');
        if (value === null) return null;

        const clean = String(value || '').trim();
        if (!clean) {
            setAdminNotice(t('admin_password_required'));
            return '';
        }

        return clean;
    };

    const requestModerationReason = (mode) => {
        const promptText = mode === 'ban'
            ? t('support_ban_reason_prompt')
            : t('support_delete_reason_prompt');
        const defaultValue = mode === 'ban'
            ? t('support_ban_reason_default')
            : t('support_delete_reason_default');

        const value = window.prompt(promptText, defaultValue);
        if (value === null) return null;

        const clean = String(value || '').trim();
        if (!clean) {
            setAdminNotice(t('admin_reason_required'));
            return '';
        }

        return clean;
    };

    const toggleUserTicketExpand = (ticket) => {
        if (!ticket?.id) return;

        const isCurrentlyExpanded = Boolean(expandedTicketById[ticket.id]);

        if (isCurrentlyExpanded) {
            setExpandedTicketById({});
            setActiveTicketId(null);
            clearTicketQuery();
            return;
        }

        setExpandedTicketById({
            [ticket.id]: true,
        });
        setActiveTicketId(ticket.id);
        syncTicketQuery(ticket);
    };

    const handleUserReplyDraftChange = (ticketId, value) => {
        if (!ticketId) return;

        setUserReplyDraftByTicketId((prev) => ({
            ...prev,
            [ticketId]: value,
        }));
    };

    const handleUserReply = async (event, ticket) => {
        event.preventDefault();
        if (!ticket?.id) return;
        if (!ticket?.canUserReply) return;

        const cleanMessage = String(userReplyDraftByTicketId[ticket.id] || '').trim();
        if (!cleanMessage) return;

        setUserReplyBusyTicketId(ticket.id);
        setUserReplyNoticeByTicketId((prev) => ({
            ...prev,
            [ticket.id]: null,
        }));

        try {
            const response = await axiosClient.post(`/support/tickets/${ticket.id}/message`, {
                message: cleanMessage,
                language,
            });

            const updatedTicket = response?.data?.data;
            if (updatedTicket) {
                patchTicketInList(updatedTicket);
                setActiveTicketId(updatedTicket.id);
                setExpandedTicketById({ [updatedTicket.id]: true });
                syncTicketQuery(updatedTicket);
            }

            setUserReplyDraftByTicketId((prev) => ({
                ...prev,
                [ticket.id]: '',
            }));
            setUserReplyNoticeByTicketId((prev) => ({
                ...prev,
                [ticket.id]: {
                    isError: false,
                    message: response?.data?.message || t('support_reply_sent'),
                },
            }));

            await loadTickets();
        } catch (error) {
            setUserReplyNoticeByTicketId((prev) => ({
                ...prev,
                [ticket.id]: {
                    isError: true,
                    message: error?.response?.data?.message || t('support_reply_failed'),
                },
            }));
        } finally {
            setUserReplyBusyTicketId(null);
        }
    };

    const handleUserEditTicket = async (ticket) => {
        if (!ticket?.id) return;

        const nextSubject = window.prompt(t('support_edit_subject_prompt'), ticket.subject || '');
        if (nextSubject === null) return;

        const currentUserMessage = Array.isArray(ticket?.messages)
            ? ticket.messages.find((item) => toRole(item?.senderRole) === 'USER')
            : null;

        const nextMessage = window.prompt(
            t('support_edit_message_prompt'),
            currentUserMessage?.message || ''
        );
        if (nextMessage === null) return;

        const cleanSubject = String(nextSubject || '').trim();
        const cleanMessage = String(nextMessage || '').trim();

        if (!cleanSubject || !cleanMessage) {
            setUserReplyNoticeByTicketId((prev) => ({
                ...prev,
                [ticket.id]: {
                    isError: true,
                    message: t('support_edit_required'),
                },
            }));
            return;
        }

        setUserReplyBusyTicketId(ticket.id);
        setUserReplyNoticeByTicketId((prev) => ({
            ...prev,
            [ticket.id]: null,
        }));

        try {
            const response = await axiosClient.put(`/support/tickets/${ticket.id}`, {
                subject: cleanSubject,
                message: cleanMessage,
                priority: ticket?.priority || 'normal',
                language,
            });

            const updatedTicket = response?.data?.data;
            if (updatedTicket) {
                patchTicketInList(updatedTicket);
                setActiveTicketId(updatedTicket.id);
                setExpandedTicketById({ [updatedTicket.id]: true });
                syncTicketQuery(updatedTicket);
            }

            setUserReplyNoticeByTicketId((prev) => ({
                ...prev,
                [ticket.id]: {
                    isError: false,
                    message: response?.data?.message || t('support_edit_success'),
                },
            }));

            await loadTickets();
        } catch (error) {
            setUserReplyNoticeByTicketId((prev) => ({
                ...prev,
                [ticket.id]: {
                    isError: true,
                    message: error?.response?.data?.message || t('support_edit_failed'),
                },
            }));
        } finally {
            setUserReplyBusyTicketId(null);
        }
    };

    const handleUserDeleteTicket = async (ticket) => {
        if (!ticket?.id) return;

        if (!window.confirm(t('support_delete_confirm'))) {
            return;
        }

        setUserReplyBusyTicketId(ticket.id);
        setUserReplyNoticeByTicketId((prev) => ({
            ...prev,
            [ticket.id]: null,
        }));

        try {
            const response = await axiosClient.delete(`/support/tickets/${ticket.id}`, {
                data: { language },
            });

            setUserReplyNoticeByTicketId((prev) => ({
                ...prev,
                [ticket.id]: {
                    isError: false,
                    message: response?.data?.message || t('support_delete_success'),
                },
            }));

            setExpandedTicketById({});
            setActiveTicketId(null);
            clearTicketQuery();
            await loadTickets();
        } catch (error) {
            setUserReplyNoticeByTicketId((prev) => ({
                ...prev,
                [ticket.id]: {
                    isError: true,
                    message: error?.response?.data?.message || t('support_delete_failed'),
                },
            }));
        } finally {
            setUserReplyBusyTicketId(null);
        }
    };

    const handleAdminSelectTicket = (ticket) => {
        if (!ticket?.id) return;
        setActiveTicketId(ticket.id);
        syncTicketQuery(ticket);
        setAdminNotice('');
    };

    const handleAdminBanTicket = async () => {
        if (!activeTicket?.id) return;

        const reason = requestModerationReason('ban');
        if (reason === null || !reason) return;

        const adminPassword = requestAdminPassword();
        if (adminPassword === null || !adminPassword) return;

        setAdminActionBusy('ban');
        setAdminNotice('');

        try {
            const response = await axiosClient.put(`/support/tickets/${activeTicket.id}/ban`, {
                reason,
                admin_password: adminPassword,
                language,
            });

            const updatedTicket = response?.data?.data;
            if (updatedTicket) {
                patchTicketInList(updatedTicket);
                setActiveTicketId(updatedTicket.id);
                syncTicketQuery(updatedTicket);
            }

            setAdminNotice(response?.data?.message || t('support_ban_success'));
            await loadTickets();
        } catch (error) {
            setAdminNotice(error?.response?.data?.message || t('support_ban_failed'));
        } finally {
            setAdminActionBusy('');
        }
    };

    const handleAdminDeleteTicket = async () => {
        if (!activeTicket?.id) return;

        const reason = requestModerationReason('delete');
        if (reason === null || !reason) return;

        const adminPassword = requestAdminPassword();
        if (adminPassword === null || !adminPassword) return;

        setAdminActionBusy('delete');
        setAdminNotice('');

        try {
            const response = await axiosClient.delete(`/support/tickets/${activeTicket.id}/admin-delete`, {
                data: {
                    reason,
                    admin_password: adminPassword,
                    language,
                },
            });

            const updatedTicket = response?.data?.data;
            if (updatedTicket) {
                patchTicketInList(updatedTicket);
                setActiveTicketId(updatedTicket.id);
                syncTicketQuery(updatedTicket);
            }

            setAdminNotice(response?.data?.message || t('support_delete_success'));
            await loadTickets();
        } catch (error) {
            setAdminNotice(error?.response?.data?.message || t('support_delete_failed'));
        } finally {
            setAdminActionBusy('');
        }
    };

    const handleAdminReply = async (event) => {
        event.preventDefault();

        if (!activeTicket?.id) return;
        if (!activeTicket?.canAdminReply) return;

        const cleanMessage = String(replyDraft || '').trim();
        if (!cleanMessage) return;

        setReplyLoading(true);
        setAdminNotice('');

        try {
            const response = await axiosClient.post(`/support/tickets/${activeTicket.id}/reply`, {
                message: cleanMessage,
                language,
            });

            const updatedTicket = response?.data?.data;
            if (updatedTicket) {
                patchTicketInList(updatedTicket);
                setActiveTicketId(updatedTicket.id);
                syncTicketQuery(updatedTicket);
            }

            setReplyDraft('');
            setAdminNotice(response?.data?.message || t('support_reply_sent'));
            await loadTickets();
        } catch (error) {
            setAdminNotice(error?.response?.data?.message || t('support_reply_failed'));
        } finally {
            setReplyLoading(false);
        }
    };

    const renderTicketMessages = (ticket, { compact = false } = {}) => {
        const messages = Array.isArray(ticket?.messages) ? ticket.messages : [];

        if (!messages.length) {
            return (
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('support_no_messages')}</p>
            );
        }

        return (
            <div className={`space-y-2 ${compact ? 'max-h-[420px] overflow-y-auto pr-1' : ''}`}>
                {messages.map((item) => {
                    const senderRole = toRole(item?.senderRole);
                    const isAdminReply = senderRole === 'ADMIN';

                    return (
                        <article
                            key={`${ticket.id}-${item.id}`}
                            className={`rounded-xl border px-3 py-2 ${isAdminReply ? (isDark ? 'border-emerald-700/60 bg-emerald-900/25' : 'border-emerald-200 bg-emerald-50') : (isDark ? 'border-slate-700 bg-slate-900/60' : 'border-slate-200 bg-slate-50')}`}
                        >
                            <div className="flex items-center justify-between gap-2 text-[11px]">
                                <p className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                                    {item?.senderName || '#'}
                                    <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] ${isAdminReply ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {isAdminReply ? t('support_role_admin') : t('support_role_user')}
                                    </span>
                                    {item?.isEdited ? (
                                        <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">
                                            {t('support_edited_badge')}
                                        </span>
                                    ) : null}
                                </p>
                                <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {formatDateLabel(item?.createdAt, language)}
                                </span>
                            </div>
                            <p className={`mt-1 whitespace-pre-wrap text-sm ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>{item?.message}</p>
                        </article>
                    );
                })}
            </div>
        );
    };

    return (
        <div className={`min-h-screen ${isDark ? 'bg-[#070f23] text-slate-100' : 'bg-[#f8f9fa] text-[#191c1d]'}`}>
            <header className={`h-14 px-6 border-b backdrop-blur-xl flex items-center justify-between sticky top-0 z-40 ${isDark ? 'border-slate-700/70 bg-[#0f172a]/95' : 'border-slate-200/70 bg-white/90'}`}>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => navigate('/dashboard')} className={`text-sm font-semibold ${isDark ? 'text-slate-300 hover:text-blue-300' : 'text-slate-600 hover:text-blue-700'}`}>Dashboard</button>
                    <span className={`${isDark ? 'text-slate-600' : 'text-slate-300'}`}>/</span>
                    <h1 className="text-lg font-bold tracking-tight">{isAdmin ? t('support_admin_page_title') : t('support_page_title')}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
                        <span className="material-symbols-outlined text-[18px]">{isDark ? 'light_mode' : 'dark_mode'}</span>
                    </button>
                    <button type="button" onClick={() => navigate('/assistant')} className="gradient-button px-4 py-2 text-sm">AI Assistant</button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-6 space-y-6">
                {!isAdmin ? (
                    <section className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <h2 className="text-xl font-bold tracking-tight mb-2">{t('support_send_ticket')}</h2>
                        <p className="text-sm text-slate-500 mb-5">{t('support_page_subtitle')}</p>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="support-name" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{t('support_name')}</label>
                                <input id="support-name" name="name" value={form.name} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" required />
                            </div>
                            <div>
                                <label htmlFor="support-email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{t('support_email')}</label>
                                <input id="support-email" name="email" value={form.email} onChange={handleChange} type="email" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" required />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="support-subject" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{t('support_subject')}</label>
                                <input id="support-subject" name="subject" value={form.subject} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" required />
                            </div>
                            <div>
                                <label htmlFor="support-priority" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{t('support_priority')}</label>
                                <select id="support-priority" name="priority" value={form.priority} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
                                    <option value="low">{t('support_priority_low')}</option>
                                    <option value="normal">{t('support_priority_normal')}</option>
                                    <option value="high">{t('support_priority_high')}</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="support-message" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{t('support_message')}</label>
                                <textarea id="support-message" name="message" value={form.message} onChange={handleChange} rows={6} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder={t('support_message')} required />
                            </div>
                            <div className="md:col-span-2 flex items-center gap-3">
                                <button type="submit" disabled={loading} className="gradient-button px-5 py-2.5 text-sm disabled:opacity-60">{loading ? t('loading') : t('support_send_ticket')}</button>
                            </div>
                        </form>
                    </section>
                ) : (
                    <section className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <h2 className="text-xl font-bold tracking-tight mb-2">{t('support_admin_page_title')}</h2>
                        <p className="text-sm text-slate-500">{t('support_admin_subtitle')}</p>
                    </section>
                )}

                {result ? (
                    <section className={`rounded-2xl border px-4 py-3 text-sm ${result.ok ? 'border-green-200 bg-green-50 text-green-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                        <p className="font-bold">{result.ok ? t('support_ticket_ok') : t('support_ticket_notice')}</p>
                        <p>{result.message}</p>
                        {result.ticketId ? <p>{t('support_ticket_code')}: <strong>{result.ticketId}</strong></p> : null}
                    </section>
                ) : null}

                {ticketsError ? (
                    <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        {ticketsError}
                    </section>
                ) : null}

                {isAdmin ? (
                    <section className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-5">
                        <div className={`rounded-2xl border p-4 space-y-2 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">{t('support_admin_inbox')}</h3>

                            {ticketsLoading ? (
                                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('loading')}</p>
                            ) : orderedTickets.length === 0 ? (
                                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('support_no_tickets')}</p>
                            ) : orderedTickets.map((ticket) => {
                                const active = Number(activeTicketId) === Number(ticket.id);
                                const messageCount = Array.isArray(ticket?.messages) ? ticket.messages.length : 0;

                                return (
                                    <button
                                        key={ticket.id}
                                        type="button"
                                        onClick={() => handleAdminSelectTicket(ticket)}
                                        className={`w-full text-left rounded-xl border px-3 py-3 transition-colors ${active ? (isDark ? 'border-blue-500 bg-blue-900/30' : 'border-blue-300 bg-blue-50') : (isDark ? 'border-slate-700 hover:bg-slate-800/60' : 'border-slate-200 hover:bg-slate-50')}`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-semibold truncate">
                                                {ticket.subject}
                                                {ticket?.isEdited ? <span className="ml-2 text-[11px] text-amber-500">✎</span> : null}
                                            </p>
                                            <div className="flex items-center gap-1">
                                                <span className={`text-[10px] rounded-full px-1.5 py-0.5 uppercase ${resolveTicketStatusClass(ticket)}`}>
                                                    {resolveTicketStatusLabel(ticket, t)}
                                                </span>
                                                <span className={`text-[10px] rounded-full px-1.5 py-0.5 uppercase ${ticket.priority === 'high' ? 'bg-red-100 text-red-700' : ticket.priority === 'low' ? 'bg-slate-200 text-slate-600' : 'bg-blue-100 text-blue-700'}`}>
                                                    {ticket.priority || 'normal'}
                                                </span>
                                            </div>
                                        </div>
                                        <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{ticket?.owner?.username || t('dashboard_owner_unknown')}</p>
                                        <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{resolveTicketCode(ticket)} • {messageCount} {t('support_messages_count')}</p>
                                        <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatDateLabel(ticket?.lastMessageAt || ticket?.updatedAt, language)}</p>
                                    </button>
                                );
                            })}
                        </div>

                        <div ref={focusedTicketRef} className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                            {!activeTicket ? (
                                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('support_choose_ticket')}</p>
                            ) : (
                                <>
                                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold tracking-tight">
                                                {activeTicket.subject}
                                                {activeTicket?.isEdited ? <span className="ml-2 text-sm font-semibold text-amber-500">({t('support_edited_badge')}: {activeTicket.userEditCount}/{activeTicket.maxUserEdits || 3})</span> : null}
                                            </h3>
                                            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                {t('support_ticket_code')}: {resolveTicketCode(activeTicket)}
                                            </p>
                                            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                {t('support_ticket_owner')}: {activeTicket?.owner?.username || '#'} • {activeTicket?.owner?.email || 'n/a'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs rounded-full px-2 py-1 uppercase ${resolveTicketStatusClass(activeTicket)}`}>
                                                {resolveTicketStatusLabel(activeTicket, t)}
                                            </span>
                                            <span className={`text-xs rounded-full px-2 py-1 uppercase ${activeTicket.priority === 'high' ? 'bg-red-100 text-red-700' : activeTicket.priority === 'low' ? 'bg-slate-200 text-slate-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {activeTicket.priority || 'normal'}
                                            </span>
                                        </div>
                                    </div>

                                    {activeTicket?.blockedReasonForAdmin ? (
                                        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                            {activeTicket.blockedReasonForAdmin}
                                        </div>
                                    ) : null}

                                    <div className="mb-4 flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={Boolean(adminActionBusy) || isTicketClosed(activeTicket)}
                                            onClick={handleAdminBanTicket}
                                            className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 disabled:opacity-60"
                                        >
                                            {adminActionBusy === 'ban' ? t('loading') : t('support_ban_ticket')}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={Boolean(adminActionBusy) || isTicketDeletedByAdmin(activeTicket)}
                                            onClick={handleAdminDeleteTicket}
                                            className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-60"
                                        >
                                            {adminActionBusy === 'delete' ? t('loading') : t('support_delete_ticket')}
                                        </button>
                                    </div>

                                    {renderTicketMessages(activeTicket, { compact: true })}

                                    <form onSubmit={handleAdminReply} className="mt-4 space-y-3 border-t border-slate-200 pt-4">
                                        <label htmlFor="admin-reply" className="block text-xs font-bold uppercase tracking-wider text-slate-500">{t('support_send_reply')}</label>
                                        <textarea
                                            id="admin-reply"
                                            rows={4}
                                            value={replyDraft}
                                            onChange={(event) => setReplyDraft(event.target.value)}
                                            placeholder={t('support_reply_placeholder')}
                                            className={`w-full rounded-xl border px-3 py-2 text-sm ${isDark ? 'border-slate-600 bg-slate-800 text-slate-100' : 'border-slate-300 bg-white text-slate-700'}`}
                                            required
                                            disabled={!activeTicket?.canAdminReply || Boolean(adminActionBusy)}
                                        />
                                        <div className="flex items-center gap-3">
                                            <button type="submit" disabled={replyLoading || !activeTicket?.canAdminReply || Boolean(adminActionBusy)} className="gradient-button px-5 py-2.5 text-sm disabled:opacity-60">{replyLoading ? t('loading') : t('support_send_reply')}</button>
                                            {adminNotice ? <p className={`text-sm ${adminNotice.includes('failed') || adminNotice.includes('khong') ? 'text-amber-600' : 'text-emerald-600'}`}>{adminNotice}</p> : null}
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    </section>
                ) : (
                    <section className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <h3 className="text-lg font-bold tracking-tight mb-1">{t('support_my_tickets_title')}</h3>
                        <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('support_my_tickets_subtitle')}</p>

                        {ticketsLoading ? (
                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('loading')}</p>
                        ) : orderedTickets.length === 0 ? (
                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('support_my_tickets_empty')}</p>
                        ) : (
                            <div className="space-y-3">
                                {orderedTickets.map((ticket) => {
                                    const expanded = Boolean(expandedTicketById[ticket.id]);
                                    const isFocusedTicket = Number(activeTicketId) === Number(ticket.id);
                                    const userReplyNotice = userReplyNoticeByTicketId[ticket.id];
                                    const userReplyDraft = userReplyDraftByTicketId[ticket.id] || '';
                                    const userReplyBusy = Number(userReplyBusyTicketId) === Number(ticket.id);
                                    const canEditTicket = !isTicketClosed(ticket) && Number(ticket?.userEditCount || 0) < Number(ticket?.maxUserEdits || 3);
                                    const canDeleteTicket = !isTicketDeletedByAdmin(ticket) && !isTicketDeletedByUser(ticket);

                                    return (
                                        <article
                                            key={ticket.id}
                                            ref={isFocusedTicket ? focusedTicketRef : null}
                                            className={`rounded-2xl border ${isFocusedTicket ? (isDark ? 'border-blue-500 bg-blue-950/20' : 'border-blue-300 bg-blue-50/60') : (isDark ? 'border-slate-700 bg-slate-900/70' : 'border-slate-200 bg-slate-50')}`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => toggleUserTicketExpand(ticket)}
                                                className="w-full px-4 py-3 text-left"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="font-semibold">
                                                            {ticket.subject}
                                                            {ticket?.isEdited ? <span className="ml-2 text-[11px] font-semibold text-amber-500">✎ {ticket.userEditCount}/{ticket.maxUserEdits || 3}</span> : null}
                                                        </p>
                                                        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                            {t('support_ticket_code')}: {resolveTicketCode(ticket)}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatDateLabel(ticket?.lastMessageAt || ticket?.updatedAt, language)}</p>
                                                        <div className="mt-1 flex items-center justify-end gap-1">
                                                            <span className={`inline-flex text-[10px] rounded-full px-1.5 py-0.5 uppercase ${resolveTicketStatusClass(ticket)}`}>
                                                                {resolveTicketStatusLabel(ticket, t)}
                                                            </span>
                                                            <span className={`inline-flex text-[10px] rounded-full px-1.5 py-0.5 uppercase ${ticket.priority === 'high' ? 'bg-red-100 text-red-700' : ticket.priority === 'low' ? 'bg-slate-200 text-slate-700' : 'bg-blue-100 text-blue-700'}`}>
                                                                {ticket.priority || 'normal'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>

                                            {expanded ? (
                                                <div className="px-4 pb-4 border-t border-slate-200/60 pt-3 space-y-3">
                                                    {ticket?.blockedReasonForUser ? (
                                                        <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                                            {ticket.blockedReasonForUser}
                                                        </div>
                                                    ) : null}

                                                    {renderTicketMessages(ticket)}

                                                    <div className="flex flex-wrap items-center gap-2 border-t border-slate-200/60 pt-3">
                                                        <button
                                                            type="button"
                                                            disabled={userReplyBusy || !canEditTicket}
                                                            onClick={() => handleUserEditTicket(ticket)}
                                                            className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 disabled:opacity-60"
                                                        >
                                                            {t('support_edit_ticket')}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={userReplyBusy || !canDeleteTicket}
                                                            onClick={() => handleUserDeleteTicket(ticket)}
                                                            className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-60"
                                                        >
                                                            {t('support_delete_ticket')}
                                                        </button>
                                                    </div>

                                                    <form onSubmit={(event) => handleUserReply(event, ticket)} className="space-y-3 border-t border-slate-200/60 pt-3">
                                                        <label htmlFor={`user-ticket-reply-${ticket.id}`} className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                                                            {t('support_send_reply')}
                                                        </label>
                                                        <textarea
                                                            id={`user-ticket-reply-${ticket.id}`}
                                                            rows={3}
                                                            value={userReplyDraft}
                                                            onChange={(event) => handleUserReplyDraftChange(ticket.id, event.target.value)}
                                                            placeholder={t('support_reply_placeholder')}
                                                            className={`w-full rounded-xl border px-3 py-2 text-sm ${isDark ? 'border-slate-600 bg-slate-800 text-slate-100' : 'border-slate-300 bg-white text-slate-700'}`}
                                                            required
                                                            disabled={!ticket?.canUserReply || userReplyBusy}
                                                        />
                                                        <div className="flex items-center gap-3">
                                                            <button type="submit" disabled={userReplyBusy || !ticket?.canUserReply} className="gradient-button px-5 py-2.5 text-sm disabled:opacity-60">
                                                                {userReplyBusy ? t('loading') : t('support_send_reply')}
                                                            </button>
                                                            {userReplyNotice?.message ? (
                                                                <p className={`text-sm ${userReplyNotice?.isError ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                                    {userReplyNotice.message}
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    </form>
                                                </div>
                                            ) : null}
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}
            </main>
        </div>
    );
};

export default SupportCenter;
