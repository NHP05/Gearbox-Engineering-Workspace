import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const SETTINGS_KEY = 'gearbox_user_settings';

const Settings = () => {
    const navigate = useNavigate();
    const { isDark, setTheme } = useTheme();
    const { language, setLanguage, t } = useLanguage();

    const [form, setForm] = useState({
        language,
        theme: isDark ? 'dark' : 'light',
        autoSave: true,
        compactMode: false,
        emailNotify: true,
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const cached = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
        setForm((prev) => ({
            ...prev,
            autoSave: typeof cached.autoSave === 'boolean' ? cached.autoSave : prev.autoSave,
            compactMode: typeof cached.compactMode === 'boolean' ? cached.compactMode : prev.compactMode,
            emailNotify: typeof cached.emailNotify === 'boolean' ? cached.emailNotify : prev.emailNotify,
            language,
            theme: isDark ? 'dark' : 'light',
        }));
    }, [isDark, language]);

    const handleSave = async () => {
        setLoading(true);
        setMessage('');

        try {
            setLanguage(form.language);
            setTheme(form.theme);

            await axiosClient.put('/auth/me', {
                language: form.language,
                theme: form.theme,
            });

            localStorage.setItem(SETTINGS_KEY, JSON.stringify({
                autoSave: form.autoSave,
                compactMode: form.compactMode,
                emailNotify: form.emailNotify,
            }));

            const user = JSON.parse(localStorage.getItem('gearbox_user') || '{}');
            localStorage.setItem('gearbox_user', JSON.stringify({
                ...user,
                language: form.language,
                theme: form.theme,
            }));

            setMessage(t('save_success'));
        } catch (error) {
            setMessage(error?.response?.data?.message || t('settings_save_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen p-6 ${isDark ? 'bg-[#070f23] text-slate-100' : 'bg-[#f8f9fa]'}`}>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('settings_title')}</h1>
                        <p className="text-sm text-slate-500 mt-1">{t('settings_subtitle')}</p>
                    </div>
                    <button type="button" onClick={() => navigate(-1)} className={`px-4 py-2 rounded-lg border text-sm font-semibold ${isDark ? 'border-slate-600 text-slate-200' : 'border-slate-300'}`}>
                        {t('back')}
                    </button>
                </div>

                <section className={`rounded-2xl border p-6 space-y-5 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div>
                        <label htmlFor="lang" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{t('language')}</label>
                        <select
                            id="lang"
                            value={form.language}
                            onChange={(event) => setForm((prev) => ({ ...prev, language: event.target.value }))}
                            className={`w-full rounded-xl border px-3 py-2 text-sm ${isDark ? 'border-slate-600 bg-slate-800 text-slate-100' : 'border-slate-300'}`}
                        >
                            <option value="vi">{t('language_vi')}</option>
                            <option value="en">{t('language_en')}</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="theme" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{t('theme')}</label>
                        <select
                            id="theme"
                            value={form.theme}
                            onChange={(event) => setForm((prev) => ({ ...prev, theme: event.target.value }))}
                            className={`w-full rounded-xl border px-3 py-2 text-sm ${isDark ? 'border-slate-600 bg-slate-800 text-slate-100' : 'border-slate-300'}`}
                        >
                            <option value="light">{t('theme_light')}</option>
                            <option value="dark">{t('theme_dark')}</option>
                        </select>
                    </div>

                    <div className="space-y-3">
                        <label className="flex items-center gap-3 text-sm">
                            <input
                                type="checkbox"
                                checked={form.autoSave}
                                onChange={(event) => setForm((prev) => ({ ...prev, autoSave: event.target.checked }))}
                            />
                            {t('settings_auto_save')}
                        </label>
                        <label className="flex items-center gap-3 text-sm">
                            <input
                                type="checkbox"
                                checked={form.compactMode}
                                onChange={(event) => setForm((prev) => ({ ...prev, compactMode: event.target.checked }))}
                            />
                            {t('settings_compact_mode')}
                        </label>
                        <label className="flex items-center gap-3 text-sm">
                            <input
                                type="checkbox"
                                checked={form.emailNotify}
                                onChange={(event) => setForm((prev) => ({ ...prev, emailNotify: event.target.checked }))}
                            />
                            {t('settings_email_notify')}
                        </label>
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={loading}
                            className="gradient-button px-5 py-2.5 text-sm disabled:opacity-60"
                        >
                            {loading ? t('saving') : t('save')}
                        </button>
                        {message ? <span className="text-sm text-slate-600">{message}</span> : null}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Settings;
