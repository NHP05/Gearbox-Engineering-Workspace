import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import axiosClient from '../../api/axiosClient';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import UserMenu from '../../components/UserMenu';

const TOP_LINKS = [
    { key: 'projects', labelKey: 'nav_projects', path: '/dashboard' },
    { key: 'calculations', labelKey: 'nav_calculations', path: null },
    { key: 'simulation', labelKey: 'nav_simulation', path: '/wizard/validation-analysis' },
];

const SIDE_LINKS = [
    { key: 'parameters', icon: 'settings_input_component', labelKey: 'side_step1', path: '/wizard/motor' },
    { key: 'motor', icon: 'electric_bolt', labelKey: 'side_step2', path: '/wizard/motor-selection' },
    { key: 'transmission', icon: 'settings', labelKey: 'side_step3', path: '/wizard/transmission-design' },
    { key: 'shaft', icon: 'account_tree', labelKey: 'side_step4', path: '/wizard/shaft-bearing' },
    { key: 'validation', icon: 'verified', labelKey: 'side_step5', path: '/wizard/validation-analysis' },
];

const DOC_ITEMS = [
    { vi: 'Buoc 1 - Thong so dau vao', en: 'Step 1 - Input Parameters', path: '/wizard/motor' },
    { vi: 'Buoc 2 - Chon dong co', en: 'Step 2 - Motor Selection', path: '/wizard/motor-selection' },
    { vi: 'Buoc 3 - Thiet ke truyen dong', en: 'Step 3 - Transmission Design', path: '/wizard/transmission-design' },
    { vi: 'Buoc 4 - Truc va o lan', en: 'Step 4 - Shaft & Bearing', path: '/wizard/shaft-bearing' },
    { vi: 'Buoc 5 - Danh gia va kiem tra', en: 'Step 5 - Validation Analysis', path: '/wizard/validation-analysis' },
];

const Icon = ({ name, className = '' }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

Icon.propTypes = {
    name: PropTypes.string.isRequired,
    className: PropTypes.string,
};

const WizardScaffold = ({
    activeKey,
    projectTitle,
    projectSubtitle,
    headerBrand,
    children,
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isDark, toggleTheme } = useTheme();
    const { language, t } = useLanguage();
    const user = JSON.parse(localStorage.getItem('gearbox_user') || '{}');
    const [helpPanel, setHelpPanel] = useState(null);
    const [supportForm, setSupportForm] = useState({
        name: user?.full_name || user?.name || user?.username || '',
        email: user?.email || '',
        subject: t('wizard_support_panel_title'),
        message: '',
        priority: 'normal',
    });
    const [supportLoading, setSupportLoading] = useState(false);
    const [supportResult, setSupportResult] = useState(null);

    useEffect(() => {
        let mounted = true;

        const syncProfile = async () => {
            try {
                const response = await axiosClient.get('/auth/me');
                const profile = response?.data?.data || {};

                if (!mounted) return;

                setSupportForm((prev) => ({
                    ...prev,
                    name: profile?.full_name || profile?.name || profile?.username || prev.name,
                    email: profile?.email || prev.email,
                }));
            } catch (error) {
                // Keep local fallback values when profile API fails.
            }
        };

        syncProfile();

        return () => {
            mounted = false;
        };
    }, []);

    const handleNavigate = (path) => {
        if (!path) return;
        navigate(path);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const openHelpPanel = (panelName) => {
        setHelpPanel(panelName);
    };

    const closeHelpPanel = () => {
        setHelpPanel(null);
        setSupportResult(null);
    };

    const handleSupportChange = (event) => {
        const { name, value } = event.target;
        setSupportForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmitSupport = async (event) => {
        event.preventDefault();
        setSupportLoading(true);
        setSupportResult(null);

        try {
            const response = await axiosClient.post('/support/contact', {
                ...supportForm,
                language,
            });
            setSupportResult({
                ok: true,
                message: response?.data?.message || t('wizard_ticket_sent'),
                ticketId: response?.data?.data?.ticketCode || response?.data?.data?.ticketId,
            });
            setSupportForm((prev) => ({ ...prev, message: '' }));
        } catch (error) {
            setSupportResult({
                ok: false,
                message: error?.response?.data?.message || t('wizard_ticket_failed'),
            });
        } finally {
            setSupportLoading(false);
        }
    };

    const isTopLinkActive = (key) => {
        if (key === 'projects') return location.pathname.startsWith('/dashboard');
        if (key === 'calculations') return location.pathname.startsWith('/wizard');
        if (key === 'simulation') return location.pathname === '/wizard/validation-analysis';
        return false;
    };

    const handleLogout = () => {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('gearbox_user');
        navigate('/login', { replace: true });
    };

    return (
        <div className={`${isDark ? 'bg-[#070f23] text-slate-100' : 'bg-[#f8f9fa] text-[#191c1d]'} min-h-screen antialiased`}>
            <header className={`fixed top-0 z-50 w-full h-14 px-6 flex items-center justify-between backdrop-blur-xl border-b ${isDark ? 'bg-[#0f172a]/95 border-slate-700/80' : 'bg-white/90 border-slate-200/60'}`}>
                <div className="flex items-center gap-8">
                    <button type="button" onClick={() => handleNavigate('/dashboard')} className={`text-lg font-bold tracking-tight transition-colors ${isDark ? 'text-slate-100 hover:text-blue-300' : 'text-slate-900 hover:text-blue-700'}`}>{headerBrand}</button>
                    <nav className="hidden md:flex items-center gap-6" aria-label="Top navigation">
                        {TOP_LINKS.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => handleNavigate(item.path)}
                                className={`text-sm font-medium tracking-tight px-2 py-1 rounded ${isTopLinkActive(item.key) ? 'text-blue-700 border-b-2 border-blue-600' : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
                            >
                                {t(item.labelKey)}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => handleNavigate('/assistant')} className={`hidden md:inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold ${isDark ? 'border-slate-600 bg-slate-900 text-slate-200 hover:bg-slate-800' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'}`}>
                        <Icon name="smart_toy" className="text-[18px]" />
                        {t('action_ai')}
                    </button>
                    <button type="button" onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
                        <Icon name={isDark ? 'light_mode' : 'dark_mode'} className="text-[18px]" />
                    </button>
                    <button type="button" className={`p-2 rounded-full ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}><Icon name="notifications" className={`${isDark ? 'text-slate-300' : 'text-slate-500'}`} /></button>
                    <button type="button" onClick={() => openHelpPanel('documentation')} className={`p-2 rounded-full ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}><Icon name="help_outline" className={`${isDark ? 'text-slate-300' : 'text-slate-500'}`} /></button>
                    <div className="hidden md:block">
                        <UserMenu user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-200 md:hidden" />
                </div>
            </header>

            <aside className={`hidden md:flex fixed top-14 bottom-0 left-0 w-64 border-r flex-col p-4 z-40 ${isDark ? 'bg-slate-900 border-slate-700/70' : 'bg-slate-50 border-slate-200/40'}`}>
                <div className="px-2 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-[#2170e4] flex items-center justify-center">
                            <Icon name="precision_manufacturing" className="text-white text-[18px]" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-blue-700">{projectTitle}</p>
                            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{projectSubtitle}</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 space-y-1">
                    {SIDE_LINKS.map((item) => {
                        const active = item.key === activeKey;
                        return (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => handleNavigate(item.path)}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${active ? 'bg-blue-50 text-blue-700 translate-x-1' : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200/60'}`}
                            >
                                <Icon name={item.icon} className="text-[20px]" />
                                <span>{t(item.labelKey)}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className={`pt-4 border-t space-y-1 ${isDark ? 'border-slate-700/70' : 'border-slate-200/60'}`}>
                    <button type="button" onClick={() => openHelpPanel('documentation')} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200/60'}`}>
                        <Icon name="menu_book" className="text-[20px]" />
                        <span>{t('side_docs')}</span>
                    </button>
                    <button type="button" onClick={() => openHelpPanel('support')} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200/60'}`}>
                        <Icon name="contact_support" className="text-[20px]" />
                        <span>{t('side_support')}</span>
                    </button>
                </div>
            </aside>

            <main className="pt-14 md:ml-64 min-h-screen">
                {children}
            </main>

            {helpPanel ? (
                <div className="fixed inset-0 z-[90] bg-slate-900/45 flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    <div className={`w-full max-w-xl rounded-2xl shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                            <h2 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                                {helpPanel === 'documentation' ? t('wizard_doc_title') : t('wizard_support_panel_title')}
                            </h2>
                            <button type="button" onClick={closeHelpPanel} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
                                <Icon name="close" className={isDark ? 'text-slate-300' : 'text-slate-500'} />
                            </button>
                        </div>

                        {helpPanel === 'documentation' ? (
                            <div className="p-6 space-y-3">
                                <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('wizard_doc_desc')}</p>
                                {DOC_ITEMS.map((item) => (
                                    <button
                                        key={item.path}
                                        type="button"
                                        onClick={() => {
                                            handleNavigate(item.path);
                                            closeHelpPanel();
                                        }}
                                        className={`w-full text-left rounded-xl border px-4 py-3 text-sm font-semibold hover:bg-blue-50 hover:border-blue-200 ${isDark ? 'border-slate-700 text-slate-200 bg-slate-800/50' : 'border-slate-200 text-slate-700'}`}
                                    >
                                        {language === 'en' ? item.en : item.vi}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 space-y-4">
                                <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('wizard_support_hint')}</p>

                                <form onSubmit={handleSubmitSupport} className="space-y-3">
                                    <div>
                                        <label htmlFor="wizard-support-name" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{t('support_name')}</label>
                                        <input id="wizard-support-name" name="name" value={supportForm.name} onChange={handleSupportChange} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
                                    </div>
                                    <div>
                                        <label htmlFor="wizard-support-email" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{t('support_email')}</label>
                                        <input id="wizard-support-email" name="email" type="email" value={supportForm.email} onChange={handleSupportChange} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
                                    </div>
                                    <div>
                                        <label htmlFor="wizard-support-priority" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{t('support_priority')}</label>
                                        <select id="wizard-support-priority" name="priority" value={supportForm.priority} onChange={handleSupportChange} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                                            <option value="low">{t('support_priority_low')}</option>
                                            <option value="normal">{t('support_priority_normal')}</option>
                                            <option value="high">{t('support_priority_high')}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="wizard-support-subject" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{t('support_subject')}</label>
                                        <input id="wizard-support-subject" name="subject" value={supportForm.subject} onChange={handleSupportChange} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
                                    </div>
                                    <div>
                                        <label htmlFor="wizard-support-message" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{t('support_message')}</label>
                                        <textarea id="wizard-support-message" name="message" value={supportForm.message} onChange={handleSupportChange} rows={4} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button type="submit" disabled={supportLoading} className="rounded-xl bg-[#0058be] text-white px-4 py-2 text-sm font-bold disabled:opacity-60">
                                            {supportLoading ? t('loading') : t('wizard_send_ticket')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleNavigate('/assistant');
                                                closeHelpPanel();
                                            }}
                                            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            AI Assistant
                                        </button>
                                    </div>
                                </form>

                                {supportResult ? (
                                    <div className={`rounded-xl border px-3 py-2 text-xs ${supportResult.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                                        <p>{supportResult.message}</p>
                                        {supportResult.ticketId ? <p>Ticket: <strong>{supportResult.ticketId}</strong></p> : null}
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

WizardScaffold.propTypes = {
    activeKey: PropTypes.oneOf(['parameters', 'motor', 'transmission', 'shaft', 'validation']).isRequired,
    projectTitle: PropTypes.string,
    projectSubtitle: PropTypes.string,
    headerBrand: PropTypes.string,
    children: PropTypes.node.isRequired,
};

WizardScaffold.defaultProps = {
    projectTitle: 'Project Alpha',
    projectSubtitle: 'Gearbox Design v2.1',
    headerBrand: 'Gearbox Engineer',
};

export default WizardScaffold;
