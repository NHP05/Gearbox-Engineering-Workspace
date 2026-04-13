import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import '../styles/auth.css';

const Login = () => {
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const { language, setLanguage } = useLanguage();
    const defaultStats = useMemo(() => ({
        projects: Number(import.meta.env.VITE_LOGIN_STATS_PROJECTS || 0),
        analyses: Number(import.meta.env.VITE_LOGIN_STATS_ANALYSES || 0),
        exports: Number(import.meta.env.VITE_LOGIN_STATS_EXPORTS || 0),
    }), []);

    const [form, setForm] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({ username: '', password: '' });
    const [stats, setStats] = useState(defaultStats);
    const [backendStatus, setBackendStatus] = useState('checking');
    const [availableLanguages, setAvailableLanguages] = useState([
        { code: 'vi', label: 'Tiếng Việt' },
        { code: 'en', label: 'English' },
    ]);
    const isEn = language === 'en';
    const txt = (vi, en) => (isEn ? en : vi);

    useEffect(() => {
        let mounted = true;

        const hydrateLoginData = async () => {
            try {
                const cached = JSON.parse(localStorage.getItem('gearbox_dashboard_metrics') || '{}');
                if (mounted && cached && Object.keys(cached).length > 0) {
                    setStats((prev) => ({
                        projects: Number(cached.projects ?? prev.projects ?? 0),
                        analyses: Number(cached.analyses ?? prev.analyses ?? 0),
                        exports: Number(cached.exports ?? prev.exports ?? 0),
                    }));
                }
            } catch (cacheError) {
                // Ignore cache parse error
            }

            try {
                const [healthRes, publicStatsRes] = await Promise.all([
                    axiosClient.get('/test', { timeout: 4000 }),
                    axiosClient.get('/public/stats', { timeout: 4000 }),
                ]);

                if (mounted && healthRes?.data?.success) {
                    setBackendStatus('online');
                }

                if (mounted && publicStatsRes?.data?.success) {
                    const incoming = publicStatsRes?.data?.data || {};
                    setStats((prev) => ({
                        projects: Number(incoming.projects ?? prev.projects ?? 0),
                        analyses: Number(incoming.analyses ?? prev.analyses ?? 0),
                        exports: Number(incoming.exports ?? prev.exports ?? 0),
                    }));
                }
            } catch (healthError) {
                if (mounted) {
                    setBackendStatus('offline');
                }
            }

            try {
                const optionsResponse = await axiosClient.get('/auth/public-options', { timeout: 4000 });
                const payload = optionsResponse?.data?.data || {};
                const incoming = Array.isArray(payload?.supported_languages) ? payload.supported_languages : [];

                if (mounted && incoming.length) {
                    const normalized = incoming
                        .map((item) => ({
                            code: String(item?.code || '').toLowerCase(),
                            label: String(item?.label || '').trim(),
                        }))
                        .filter((item) => item.code === 'vi' || item.code === 'en');

                    if (normalized.length) {
                        setAvailableLanguages(normalized);
                    }
                }

                if (mounted && !localStorage.getItem('gearbox_language')) {
                    const fallbackLanguage = payload?.default_language === 'en' ? 'en' : 'vi';
                    setLanguage(fallbackLanguage);
                }
            } catch (optionsError) {
                // Keep local fallback languages on error.
            }
        };

        hydrateLoginData();

        return () => {
            mounted = false;
        };
    }, [setLanguage]);

    // Validation function
    const validateForm = () => {
        const newErrors = { username: '', password: '' };
        let isValid = true;

        if (!form.username.trim()) {
            newErrors.username = txt('Tên đăng nhập không được để trống', 'Username is required.');
            isValid = false;
        } else if (form.username.length < 3) {
            newErrors.username = txt('Tên đăng nhập phải có ít nhất 3 ký tự', 'Username must be at least 3 characters.');
            isValid = false;
        }

        if (!form.password) {
            newErrors.password = txt('Mật khẩu không được để trống', 'Password is required.');
            isValid = false;
        } else if (form.password.length < 6) {
            newErrors.password = txt('Mật khẩu phải có ít nhất 6 ký tự', 'Password must be at least 6 characters.');
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axiosClient.post('/auth/login', form, {
                timeout: 10000, // 10 secondes timeout
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.data.success && response.data.token) {
                localStorage.setItem('jwt_token', response.data.token);
                localStorage.setItem('gearbox_user', JSON.stringify(response.data.user || { username: form.username }));

                navigate('/dashboard', { replace: true });
            } else {
                setError(response.data.message || 'Lỗi đăng nhập: Server không trả về token');
            }
        } catch (err) {
            // Network error / CORS error
            if (!err.response) {
                setError(`❌ Không kết nối được Backend!\n\nKiểm tra:\n1. Chạy: cd BE && npm run dev\n2. Backend URL: ${axiosClient.defaults.baseURL}\n3. Error: ${err.message}`);
            }
            // API error with response
            else {
                const message = err.response.data?.message || `HTTP ${err.response.status}: ${err.response.statusText}`;
                setError(message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center px-4 py-12 relative">
            <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
                <div className="rounded-xl border border-slate-300 bg-white/90 px-1 py-1 shadow-sm backdrop-blur">
                    {availableLanguages.map((item) => {
                        const active = language === item.code;
                        return (
                            <button
                                key={item.code}
                                type="button"
                                onClick={() => setLanguage(item.code)}
                                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${active ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                {String(item.code || '').toUpperCase()}
                            </button>
                        );
                    })}
                </div>
                <button type="button" onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
                    <span className="material-symbols-outlined text-[18px]">{isDark ? 'light_mode' : 'dark_mode'}</span>
                </button>
            </div>
            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 rounded-[28px] overflow-hidden shadow-[0_24px_80px_rgba(25,28,29,0.12)] bg-white">
                <div className="relative p-10 lg:p-14 bg-gradient-to-br from-[#0058be] to-[#2170e4] text-white">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 0, transparent 28%), radial-gradient(circle at 80% 10%, white 0, transparent 18%), radial-gradient(circle at 70% 80%, white 0, transparent 24%)' }} />
                    <div className="relative z-10 flex h-full flex-col justify-between">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80">Gearbox Engineer</span>
                            <h1 className="mt-4 text-4xl font-black leading-tight">{txt('Đăng nhập để tiếp tục thiết kế hộp giảm tốc', 'Sign in to continue gearbox design')}</h1>
                            <p className="mt-4 max-w-md text-sm text-white/80 leading-6">
                                {txt(
                                    'Truy cập các bước tính toán, lưu dự án và xuất báo cáo kỹ thuật từ một tài khoản duy nhất.',
                                    'Access calculations, save projects, and export engineering reports from one account.'
                                )}
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mt-10">
                            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">{txt('Đồ án', 'Projects')}</p>
                                <p className="mt-2 text-2xl font-black">{stats.projects}</p>
                            </div>
                            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">{txt('Phân tích', 'Analyses')}</p>
                                <p className="mt-2 text-2xl font-black">{stats.analyses}</p>
                            </div>
                            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">{txt('Xuất báo cáo', 'Exports')}</p>
                                <p className="mt-2 text-2xl font-black">{stats.exports}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-10 lg:p-14">
                    <div className="max-w-md mx-auto">
                        <div className="mb-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0058be]">{txt('Truy cập khách hàng', 'Customer Access')}</span>
                            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#191c1d]">{txt('Đăng nhập', 'Sign in')}</h2>
                            <p className="mt-3 text-sm leading-6 text-slate-500">
                                {txt('Dùng tài khoản khách hàng để tiếp tục vào wizard thiết kế.', 'Use your account to continue to the design wizard.')}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
                            <div className="space-y-2">
                                <label htmlFor="username" className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">{txt('Tên đăng nhập', 'Username')}</label>
                                <input
                                    id="username"
                                    name="username"
                                    value={form.username}
                                    onChange={handleChange}
                                    disabled={loading}
                                    autoComplete="username"
                                    className={`w-full rounded-xl bg-[#f8f9fa] border px-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-2 ${
                                        errors.username ? 'border-red-500 focus:ring-red-500/25' : 'border-[#c2c6d6]/40 focus:ring-[#0058be]/25'
                                    } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    placeholder={txt('Nhập tên đăng nhập', 'Enter username')}
                                />
                                {errors.username && <p className="text-xs text-red-500 animate-pulse">{errors.username}</p>}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">{txt('Mật khẩu', 'Password')}</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    disabled={loading}
                                    autoComplete="current-password"
                                    className={`w-full rounded-xl bg-[#f8f9fa] border px-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-2 ${
                                        errors.password ? 'border-red-500 focus:ring-red-500/25' : 'border-[#c2c6d6]/40 focus:ring-[#0058be]/25'
                                    } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    placeholder={txt('Nhập mật khẩu', 'Enter password')}
                                />
                                {errors.password && <p className="text-xs text-red-500 animate-pulse">{errors.password}</p>}
                            </div>

                            {error ? (
                                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 animate-shake">
                                    <p className="font-bold">{txt('❌ Lỗi đăng nhập', '❌ Login error')}</p>
                                    <p className="mt-1">{error}</p>
                                </div>
                            ) : null}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl bg-gradient-to-r from-[#0058be] to-[#2170e4] px-4 py-3.5 font-bold text-white shadow-lg shadow-[#0058be]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[#0058be]/30 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:brightness-100 relative overflow-hidden"
                            >
                                <span className={loading ? 'opacity-0' : 'opacity-100 transition-opacity duration-200'}>
                                    {txt('Đăng nhập để tiếp tục', 'Sign in to continue')}
                                </span>
                                {loading && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                                    </div>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 rounded-2xl bg-[#f8f9fa] p-5 text-sm text-slate-600">
                            <p className="font-bold text-[#191c1d]">{txt('Gợi ý', 'Hint')}</p>
                            <p className="mt-2 leading-6">
                                {backendStatus === 'online'
                                    ? (language === 'en' ? 'Backend is online.' : 'Backend đang online.')
                                    : backendStatus === 'offline'
                                        ? (language === 'en' ? 'Backend is offline. Please run BE before signing in.' : 'Backend chưa kết nối, vui lòng bật BE trước khi đăng nhập.')
                                        : (language === 'en' ? 'Checking backend status...' : 'Đang kiểm tra trạng thái backend...')}
                            </p>
                        </div>

                        <div className="mt-6 text-center text-sm text-slate-500">
                            {txt('Chưa có tài khoản?', "Don't have an account?")}{' '}
                            <Link to="/register" className="font-bold text-[#0058be] hover:underline">
                                {txt('Đăng ký ngay', 'Register now')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
