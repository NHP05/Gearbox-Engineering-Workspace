import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const Notifications = () => {
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const { language, t } = useLanguage();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState('');
    const [error, setError] = useState('');

    const loadNotifications = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await axiosClient.get('/notification/my?limit=500');
            const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
            setItems(rows);
        } catch (fetchError) {
            setItems([]);
            setError(fetchError?.response?.data?.message || t('dashboard_notifications_load_failed'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    const sortedItems = useMemo(() => {
        return [...items].sort((a, b) => {
            const aPinned = a?.is_pinned ? 1 : 0;
            const bPinned = b?.is_pinned ? 1 : 0;
            if (aPinned !== bPinned) {
                return bPinned - aPinned;
            }

            const aTime = new Date(a?.createdAt || 0).getTime();
            const bTime = new Date(b?.createdAt || 0).getTime();
            return bTime - aTime;
        });
    }, [items]);

    const unreadCount = sortedItems.filter((item) => !item?.is_read).length;

    const resolveNotificationRoute = (item) => {
        const metadata = item?.metadata;
        if (!metadata || typeof metadata !== 'object') return '';

        const directRoute = String(metadata.route || metadata.targetRoute || '').trim();
        if (directRoute.startsWith('/')) {
            return directRoute;
        }

        const ticketCode = String(metadata.ticketCode || metadata.ticketId || '').trim();
        if (ticketCode) {
            return `/support?ticket=${encodeURIComponent(ticketCode)}`;
        }

        return '';
    };

    const markRead = async (notificationId) => {
        if (!notificationId) return;

        setBusyId(`read-${notificationId}`);
        try {
            await axiosClient.put(`/notification/${notificationId}/read`);
            setItems((prev) => prev.map((item) => (
                Number(item.id) === Number(notificationId)
                    ? { ...item, is_read: true }
                    : item
            )));
            setError('');
        } catch (actionError) {
            setError(actionError?.response?.data?.message || t('dashboard_action_failed_generic'));
        } finally {
            setBusyId('');
        }
    };

    const markAllRead = async () => {
        setBusyId('read-all');
        try {
            await axiosClient.put('/notification/read-all');
            setItems((prev) => prev.map((item) => ({ ...item, is_read: true })));
            setError('');
        } catch (actionError) {
            setError(actionError?.response?.data?.message || t('dashboard_action_failed_generic'));
        } finally {
            setBusyId('');
        }
    };

    const togglePin = async (notification) => {
        if (!notification?.id) return;

        const nextPinned = !Boolean(notification?.is_pinned);
        setBusyId(`pin-${notification.id}`);
        try {
            await axiosClient.put(`/notification/${notification.id}/pin`, { pinned: nextPinned });
            setItems((prev) => prev.map((item) => (
                Number(item.id) === Number(notification.id)
                    ? {
                        ...item,
                        is_pinned: nextPinned,
                        pinned_at: nextPinned ? new Date().toISOString() : null,
                    }
                    : item
            )));
            setError('');
        } catch (actionError) {
            setError(actionError?.response?.data?.message || t('dashboard_action_failed_generic'));
        } finally {
            setBusyId('');
        }
    };

    const removeNotice = async (notificationId) => {
        if (!notificationId) return;

        setBusyId(`del-${notificationId}`);
        try {
            await axiosClient.delete(`/notification/${notificationId}`);
            setItems((prev) => prev.filter((item) => Number(item.id) !== Number(notificationId)));
            setError('');
        } catch (actionError) {
            setError(actionError?.response?.data?.message || t('dashboard_action_failed_generic'));
        } finally {
            setBusyId('');
        }
    };

    const openNotificationTarget = async (item) => {
        const route = resolveNotificationRoute(item);
        if (!route) return;

        if (!item?.is_read && item?.id) {
            await markRead(item.id);
        }

        navigate(route);
    };

    return (
        <div className={`min-h-screen ${isDark ? 'bg-[#070f23] text-slate-100' : 'bg-[#f8f9fa] text-[#191c1d]'}`}>
            <header className={`h-14 px-6 border-b backdrop-blur-xl flex items-center justify-between sticky top-0 z-40 ${isDark ? 'border-slate-700/70 bg-[#0f172a]/95' : 'border-slate-200/70 bg-white/90'}`}>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => navigate('/dashboard')} className={`text-sm font-semibold ${isDark ? 'text-slate-300 hover:text-blue-300' : 'text-slate-600 hover:text-blue-700'}`}>{t('dashboard_overview')}</button>
                    <span className={`${isDark ? 'text-slate-600' : 'text-slate-300'}`}>/</span>
                    <h1 className="text-lg font-bold tracking-tight">{t('dashboard_notifications')}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
                        <span className="material-symbols-outlined text-[18px]">{isDark ? 'light_mode' : 'dark_mode'}</span>
                    </button>
                    <button
                        type="button"
                        disabled={busyId === 'read-all' || unreadCount === 0}
                        onClick={markAllRead}
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
                    >
                        {t('dashboard_mark_all_read')}
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-6">
                {error ? (
                    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        {error}
                    </div>
                ) : null}

                <section className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-900/70' : 'border-slate-200 bg-white'}`}>
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-bold">{t('dashboard_notifications')}</h2>
                        {unreadCount > 0 ? <span className="text-xs font-semibold text-red-500">{unreadCount} {t('dashboard_unread')}</span> : null}
                    </div>

                    {loading ? (
                        <p className={`px-2 py-4 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('loading')}</p>
                    ) : sortedItems.length === 0 ? (
                        <p className={`px-2 py-4 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('dashboard_notifications_empty')}</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[860px] text-left">
                                <thead className={`${isDark ? 'bg-slate-800/80' : 'bg-slate-50'}`}>
                                    <tr>
                                        <th className="px-3 py-2 text-[11px] uppercase tracking-wider text-slate-500">{t('dashboard_notifications')}</th>
                                        <th className="px-3 py-2 text-[11px] uppercase tracking-wider text-slate-500">{t('dashboard_unread')}</th>
                                        <th className="px-3 py-2 text-[11px] uppercase tracking-wider text-slate-500">{t('admin_created_at')}</th>
                                        <th className="px-3 py-2 text-[11px] uppercase tracking-wider text-slate-500">{t('dashboard_col_action')}</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-100'}`}>
                                    {sortedItems.map((item) => {
                                        const createdLabel = item?.createdAt ? new Date(item.createdAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') : '';
                                        const notificationRoute = resolveNotificationRoute(item);
                                        const rowBusy = (
                                            busyId === `read-${item.id}`
                                            || busyId === `pin-${item.id}`
                                            || busyId === `del-${item.id}`
                                        );

                                        return (
                                            <tr key={item.id} className={item?.is_read ? '' : (isDark ? 'bg-blue-950/20' : 'bg-blue-50/60')}>
                                                <td className="px-3 py-3 align-top">
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            {item?.is_pinned ? <span className="material-symbols-outlined text-[14px] text-amber-500">keep</span> : null}
                                                            <p className="text-sm font-semibold truncate">{item.title}</p>
                                                        </div>
                                                        <p className="mt-1 whitespace-pre-wrap break-words text-xs opacity-90">{item.message}</p>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 align-top">
                                                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${item?.is_read ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'}`}>
                                                        {item?.is_read ? t('dashboard_mark_read') : t('dashboard_unread')}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 align-top text-xs text-slate-500">{createdLabel || '-'}</td>
                                                <td className="px-3 py-3 align-top">
                                                    <div className="flex flex-wrap items-center gap-1">
                                                        {!item?.is_read ? (
                                                            <button
                                                                type="button"
                                                                disabled={rowBusy}
                                                                onClick={() => markRead(item.id)}
                                                                className="rounded-md px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 disabled:opacity-60"
                                                            >
                                                                {t('dashboard_mark_read')}
                                                            </button>
                                                        ) : null}
                                                        {notificationRoute ? (
                                                            <button
                                                                type="button"
                                                                disabled={rowBusy}
                                                                onClick={() => openNotificationTarget(item)}
                                                                className="rounded-md px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 disabled:opacity-60"
                                                            >
                                                                {t('dashboard_open_notification_target')}
                                                            </button>
                                                        ) : null}
                                                        <button
                                                            type="button"
                                                            disabled={rowBusy}
                                                            onClick={() => togglePin(item)}
                                                            className={`rounded-md px-2 py-1 text-xs font-semibold disabled:opacity-60 ${item?.is_pinned ? 'text-amber-700 hover:bg-amber-100' : 'text-slate-600 hover:bg-slate-100'}`}
                                                        >
                                                            {item?.is_pinned ? t('dashboard_unpin') : t('dashboard_pin')}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={rowBusy}
                                                            onClick={() => removeNotice(item.id)}
                                                            className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60"
                                                        >
                                                            {t('dashboard_delete_notification')}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default Notifications;
