import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const ProfileInfo = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { isDark } = useTheme();

    const [profile, setProfile] = useState({
        username: '',
        email: '',
        role: 'USER',
    });
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [profileMessage, setProfileMessage] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axiosClient.get('/auth/me');
                const data = response?.data?.data || {};
                setProfile({
                    username: data.username || '',
                    email: data.email || '',
                    role: String(data.role || 'USER').toUpperCase(),
                });
            } catch (error) {
                let cachedUser = {};
                try {
                    cachedUser = JSON.parse(localStorage.getItem('gearbox_user') || '{}');
                } catch (parseError) {
                    cachedUser = {};
                }

                if (cachedUser && typeof cachedUser === 'object') {
                    setProfile((prev) => ({
                        username: String(cachedUser.username || prev.username || ''),
                        email: String(cachedUser.email || prev.email || ''),
                        role: String(cachedUser.role || prev.role || 'USER').toUpperCase(),
                    }));
                }

                setProfileMessage(t('info_update_error'));
            } finally {
                setLoadingProfile(false);
            }
        };

        fetchProfile();
    }, []);

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        setProfileMessage('');

        try {
            const response = await axiosClient.put('/auth/me', {
                username: profile.username,
                email: profile.email,
            });
            const updated = response?.data?.data || profile;

            localStorage.setItem('gearbox_user', JSON.stringify({
                ...updated,
                role: String(updated?.role || profile.role || 'USER').toUpperCase(),
            }));
            setProfileMessage(t('info_update_success'));
        } catch (error) {
            setProfileMessage(error?.response?.data?.message || t('info_update_error'));
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async () => {
        setPasswordMessage('');

        if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
            setPasswordMessage(t('password_new_min_error'));
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordMessage(t('password_confirm_error'));
            return;
        }

        setSavingPassword(true);
        try {
            const response = await axiosClient.put('/auth/change-password', {
                oldPassword: passwordForm.oldPassword,
                newPassword: passwordForm.newPassword,
            });
            setPasswordMessage(response?.data?.message || t('password_change_success'));
            setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            setPasswordMessage(error?.response?.data?.message || t('password_change_error'));
        } finally {
            setSavingPassword(false);
        }
    };

    if (loadingProfile) {
        return (
            <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center text-slate-500">
                {t('info_loading')}
            </div>
        );
    }

    return (
        <div className={`min-h-screen p-6 ${isDark ? 'bg-[#070f23] text-slate-100' : 'bg-[#f8f9fa]'}`}>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('info_title')}</h1>
                        <p className="text-sm text-slate-500 mt-1">{t('info_subtitle')}</p>
                    </div>
                    <button type="button" onClick={() => navigate(-1)} className={`px-4 py-2 rounded-lg border text-sm font-semibold ${isDark ? 'border-slate-600 text-slate-200' : 'border-slate-300'}`}>
                        {t('back')}
                    </button>
                </div>

                <section className={`rounded-2xl border p-6 space-y-4 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <h2 className="text-lg font-bold">{t('info_basic')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="username" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{t('info_username')}</label>
                            <input id="username" value={profile.username} onChange={(event) => setProfile((prev) => ({ ...prev, username: event.target.value }))} className={`w-full rounded-xl border px-3 py-2 text-sm ${isDark ? 'border-slate-600 bg-slate-800 text-slate-100' : 'border-slate-300'}`} />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{t('info_email')}</label>
                            <input id="email" type="email" value={profile.email} onChange={(event) => setProfile((prev) => ({ ...prev, email: event.target.value }))} className={`w-full rounded-xl border px-3 py-2 text-sm ${isDark ? 'border-slate-600 bg-slate-800 text-slate-100' : 'border-slate-300'}`} />
                        </div>
                        <div>
                            <label htmlFor="role" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{t('info_role')}</label>
                            <input id="role" value={profile.role} disabled className={`w-full rounded-xl border px-3 py-2 text-sm ${isDark ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-slate-300 bg-slate-50'}`} />
                        </div>
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                        <button type="button" onClick={handleSaveProfile} disabled={savingProfile} className="gradient-button px-5 py-2.5 text-sm disabled:opacity-60">
                            {savingProfile ? t('saving') : t('profile_save')}
                        </button>
                        {profileMessage ? <span className="text-sm text-slate-600">{profileMessage}</span> : null}
                    </div>
                </section>

                <section className={`rounded-2xl border p-6 space-y-4 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <h2 className="text-lg font-bold">{t('password_section')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="old-password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{t('password_old')}</label>
                            <input id="old-password" type="password" value={passwordForm.oldPassword} onChange={(event) => setPasswordForm((prev) => ({ ...prev, oldPassword: event.target.value }))} className={`w-full rounded-xl border px-3 py-2 text-sm ${isDark ? 'border-slate-600 bg-slate-800 text-slate-100' : 'border-slate-300'}`} />
                        </div>
                        <div>
                            <label htmlFor="new-password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{t('password_new')}</label>
                            <input id="new-password" type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))} className={`w-full rounded-xl border px-3 py-2 text-sm ${isDark ? 'border-slate-600 bg-slate-800 text-slate-100' : 'border-slate-300'}`} />
                        </div>
                        <div>
                            <label htmlFor="confirm-password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{t('password_confirm')}</label>
                            <input id="confirm-password" type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))} className={`w-full rounded-xl border px-3 py-2 text-sm ${isDark ? 'border-slate-600 bg-slate-800 text-slate-100' : 'border-slate-300'}`} />
                        </div>
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                        <button type="button" onClick={handleChangePassword} disabled={savingPassword} className="gradient-button px-5 py-2.5 text-sm disabled:opacity-60">
                            {savingPassword ? t('saving') : t('password_save')}
                        </button>
                        {passwordMessage ? <span className="text-sm text-slate-600">{passwordMessage}</span> : null}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ProfileInfo;
