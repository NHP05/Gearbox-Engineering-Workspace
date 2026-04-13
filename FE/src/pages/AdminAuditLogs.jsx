import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const AdminAuditLogs = () => {
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const { language, t } = useLanguage();

    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState('');
    const [error, setError] = useState('');

    const loadLogs = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await axiosClient.get('/admin/action-logs?limit=1000');
            const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
            setLogs(rows);
        } catch (fetchError) {
            setLogs([]);
            setError(fetchError?.response?.data?.message || t('admin_action_failed'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, []);

    const sortedLogs = useMemo(() => {
        return [...logs].sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime());
    }, [logs]);

    const unreadCount = useMemo(() => sortedLogs.filter((item) => !item?.is_read).length, [sortedLogs]);

    const markRead = async (logId) => {
        if (!logId) return;

        setBusyId(`read-${logId}`);
        try {
            await axiosClient.put(`/admin/action-logs/${logId}/read`);
            setLogs((prev) => prev.map((item) => (
                Number(item.id) === Number(logId)
                    ? {
                        ...item,
                        is_read: true,
                        read_at: new Date().toISOString(),
                    }
                    : item
            )));
            setError('');
        } catch (actionError) {
            setError(actionError?.response?.data?.message || t('admin_action_failed'));
        } finally {
            setBusyId('');
        }
    };

    const markAllRead = async () => {
        setBusyId('read-all');
        try {
            await axiosClient.put('/admin/action-logs/read-all');
            setLogs((prev) => prev.map((item) => ({
                ...item,
                is_read: true,
                read_at: item?.read_at || new Date().toISOString(),
            })));
            setError('');
        } catch (actionError) {
            setError(actionError?.response?.data?.message || t('admin_action_failed'));
        } finally {
            setBusyId('');
        }
    };

    return (
        <div className={`min-h-screen ${isDark ? 'bg-[#070f23] text-slate-100' : 'bg-[#f8f9fa] text-[#191c1d]'}`}>
            <header className={`h-14 px-6 border-b backdrop-blur-xl flex items-center justify-between sticky top-0 z-40 ${isDark ? 'border-slate-700/70 bg-[#0f172a]/95' : 'border-slate-200/70 bg-white/90'}`}>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className={`text-sm font-semibold ${isDark ? 'text-slate-300 hover:text-blue-300' : 'text-slate-600 hover:text-blue-700'}`}
                    >
                        {t('dashboard_overview')}
                    </button>
                    <span className={`${isDark ? 'text-slate-600' : 'text-slate-300'}`}>/</span>
                    <h1 className="text-lg font-bold tracking-tight">{t('admin_audit_logs_title')}</h1>
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
                        {t('admin_logs_mark_all_read')}
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6">
                {error ? (
                    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        {error}
                    </div>
                ) : null}

                <section className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-900/70' : 'border-slate-200 bg-white'}`}>
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-bold">{t('admin_audit_logs_title')}</h2>
                        <span className="text-xs font-semibold text-blue-600">{unreadCount} {t('admin_logs_unread')}</span>
                    </div>

                    {loading ? (
                        <p className={`px-2 py-4 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('loading')}</p>
                    ) : sortedLogs.length === 0 ? (
                        <p className={`px-2 py-4 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('admin_logs_empty')}</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[980px] text-left">
                                <thead className={`${isDark ? 'bg-slate-800/80' : 'bg-slate-50'}`}>
                                    <tr>
                                        <th className="px-3 py-2 text-[11px] uppercase tracking-wider text-slate-500">{t('admin_audit_logs_col_action_type')}</th>
                                        <th className="px-3 py-2 text-[11px] uppercase tracking-wider text-slate-500">{t('admin_log_actor')}</th>
                                        <th className="px-3 py-2 text-[11px] uppercase tracking-wider text-slate-500">{t('admin_log_target')}</th>
                                        <th className="px-3 py-2 text-[11px] uppercase tracking-wider text-slate-500">{t('admin_log_reason')}</th>
                                        <th className="px-3 py-2 text-[11px] uppercase tracking-wider text-slate-500">{t('admin_created_at')}</th>
                                        <th className="px-3 py-2 text-[11px] uppercase tracking-wider text-slate-500">{t('admin_audit_logs_col_status')}</th>
                                        <th className="px-3 py-2 text-[11px] uppercase tracking-wider text-slate-500">{t('dashboard_col_action')}</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-100'}`}>
                                    {sortedLogs.map((log) => {
                                        const createdLabel = log?.createdAt ? new Date(log.createdAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') : '-';
                                        const rowBusy = busyId === `read-${log.id}`;
                                        const isRead = Boolean(log?.is_read);

                                        return (
                                            <tr key={log.id} className={isRead ? '' : (isDark ? 'bg-blue-950/20' : 'bg-blue-50/60')}>
                                                <td className="px-3 py-3 text-xs font-semibold align-top">{log.action_type || '-'}</td>
                                                <td className="px-3 py-3 text-xs align-top">{log.admin_username || '-'}</td>
                                                <td className="px-3 py-3 text-xs align-top">{log.target_username || log.target_project_name || '-'}</td>
                                                <td className="px-3 py-3 text-xs align-top">{log.reason || '-'}</td>
                                                <td className="px-3 py-3 text-xs text-slate-500 align-top">{createdLabel}</td>
                                                <td className="px-3 py-3 align-top">
                                                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${isRead ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'}`}>
                                                        {isRead ? t('admin_audit_logs_status_read') : t('admin_audit_logs_status_unread')}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 align-top">
                                                    {isRead ? (
                                                        <span className="text-xs text-slate-400">-</span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            disabled={rowBusy}
                                                            onClick={() => markRead(log.id)}
                                                            className="rounded-md px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 disabled:opacity-60"
                                                        >
                                                            {t('admin_logs_mark_read')}
                                                        </button>
                                                    )}
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

export default AdminAuditLogs;
