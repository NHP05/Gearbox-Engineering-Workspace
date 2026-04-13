import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import '../styles/auth.css';

const Register = () => {
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const { language, setLanguage } = useLanguage();
    const [form, setForm] = useState({ username: '', password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [errors, setErrors] = useState({ username: '', password: '', confirmPassword: '' });
    const [availableLanguages, setAvailableLanguages] = useState([
        { code: 'vi', label: 'Tiếng Việt' },
        { code: 'en', label: 'English' },
    ]);
    const isEn = language === 'en';
    const txt = (vi, en) => (isEn ? en : vi);

    React.useEffect(() => {
        let mounted = true;

        const loadOptions = async () => {
            try {
                const response = await axiosClient.get('/auth/public-options', { timeout: 4000 });
                const payload = response?.data?.data || {};
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
            } catch (error) {
                // Keep fallback language options.
            }
        };

        loadOptions();

        return () => {
            mounted = false;
        };
    }, [setLanguage]);

    // Password strength calculator
    const passwordStrength = useMemo(() => {
        if (!form.password) return { score: 0, label: '', color: 'bg-gray-300' };
        let score = 0;
        if (form.password.length >= 6) score++;
        if (form.password.length >= 8) score++;
        if (/[a-z]/.test(form.password) && /[A-Z]/.test(form.password)) score++;
        if (/\d/.test(form.password)) score++;
        if (/[^a-zA-Z\d]/.test(form.password)) score++;
        
        const labels = isEn
            ? ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong']
            : ['', 'Yếu', 'Trung bình', 'Khá', 'Mạnh', 'Rất mạnh'];
        const colors = ['bg-gray-300', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];
        
        return { score, label: labels[score], color: colors[score] };
    }, [form.password, isEn]);

    // Validation function
    const validateForm = () => {
        const newErrors = { username: '', password: '', confirmPassword: '' };
        let isValid = true;

        if (!form.username.trim()) {
            newErrors.username = txt('Tên đăng nhập không được để trống', 'Username is required.');
            isValid = false;
        } else if (form.username.length < 3) {
            newErrors.username = txt('Tên đăng nhập phải có ít nhất 3 ký tự', 'Username must be at least 3 characters.');
            isValid = false;
        } else if (form.username.length > 20) {
            newErrors.username = txt('Tên đăng nhập không được vượt quá 20 ký tự', 'Username cannot exceed 20 characters.');
            isValid = false;
        } else if (!/^[a-zA-Z0-9_]/.test(form.username)) {
            newErrors.username = txt('Tên đăng nhập chỉ chứa chữ, số và dấu gạch dưới', 'Username can only contain letters, numbers, and underscores.');
            isValid = false;
        }

        if (!form.password) {
            newErrors.password = txt('Mật khẩu không được để trống', 'Password is required.');
            isValid = false;
        } else if (form.password.length < 6) {
            newErrors.password = txt('Mật khẩu phải có ít nhất 6 ký tự', 'Password must be at least 6 characters.');
            isValid = false;
        } else if (form.password.length > 50) {
            newErrors.password = txt('Mật khẩu không được vượt quá 50 ký tự', 'Password cannot exceed 50 characters.');
            isValid = false;
        }

        if (!form.confirmPassword) {
            newErrors.confirmPassword = txt('Vui lòng xác nhận mật khẩu', 'Please confirm your password.');
            isValid = false;
        } else if (form.password !== form.confirmPassword) {
            newErrors.confirmPassword = txt('Mật khẩu xác nhận không khớp', 'Passwords do not match.');
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
        setSuccess('');

        try {
            await axiosClient.post('/auth/register', {
                username: form.username,
                password: form.password,
                language,
            });
            setSuccess(txt('Đăng ký thành công. Bạn có thể đăng nhập ngay bây giờ.', 'Registration successful. You can sign in now.'));
            setTimeout(() => navigate('/login', { replace: true }), 900);
        } catch (err) {
            const message = err?.response?.data?.message || txt('Không thể đăng ký. Vui lòng thử lại.', 'Unable to register. Please try again.');
            setError(message);
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
                <div className="relative p-10 lg:p-14 bg-gradient-to-br from-[#924700] to-[#0058be] text-white">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 0, transparent 28%), radial-gradient(circle at 80% 10%, white 0, transparent 18%), radial-gradient(circle at 70% 80%, white 0, transparent 24%)' }} />
                    <div className="relative z-10 flex h-full flex-col justify-between">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80">Gearbox Engineer</span>
                            <h1 className="mt-4 text-4xl font-black leading-tight">{txt('Tạo tài khoản khách hàng để bắt đầu thiết kế', 'Create an account to start designing')}</h1>
                            <p className="mt-4 max-w-md text-sm text-white/80 leading-6">
                                {txt(
                                    'Đăng ký để lưu dự án, tiếp tục wizard và xuất báo cáo theo đúng luồng làm việc của hệ thống.',
                                    'Register to save projects, continue the wizard, and export reports in the standard workflow.'
                                )}
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mt-10">
                            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">{txt('Bảo mật', 'Secure')}</p>
                                <p className="mt-2 text-2xl font-black">JWT</p>
                            </div>
                            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">{txt('Nhanh', 'Fast')}</p>
                                <p className="mt-2 text-2xl font-black">{txt('1 bước', '1 Step')}</p>
                            </div>
                            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">{txt('Sẵn sàng', 'Ready')}</p>
                                <p className="mt-2 text-2xl font-black">24h</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-10 lg:p-14">
                    <div className="max-w-md mx-auto">
                        <div className="mb-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#924700]">{txt('Truy cập khách hàng', 'Customer Access')}</span>
                            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#191c1d]">{txt('Tạo tài khoản', 'Create account')}</h2>
                            <p className="mt-3 text-sm leading-6 text-slate-500">
                                {txt('Tạo tài khoản để sử dụng đầy đủ chức năng thiết kế hộp giảm tốc.', 'Create an account to use all gearbox design features.')}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
                            <div className="space-y-2">
                                <label htmlFor="register-username" className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">{txt('Tên đăng nhập', 'Username')}</label>
                                <input
                                    id="register-username"
                                    name="username"
                                    value={form.username}
                                    onChange={handleChange}
                                    disabled={loading}
                                    autoComplete="username"
                                    maxLength="20"
                                    className={`w-full rounded-xl bg-[#f8f9fa] border px-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-2 ${
                                        errors.username ? 'border-red-500 focus:ring-red-500/25' : 'border-[#c2c6d6]/40 focus:ring-[#0058be]/25'
                                    } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    placeholder={txt('Chọn tên đăng nhập', 'Choose a username')}
                                />
                                <div className="flex justify-between items-end">
                                    {errors.username && <p className="text-xs text-red-500 animate-pulse">{errors.username}</p>}
                                    <p className="text-xs text-gray-400 ml-auto">{form.username.length}/20</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="register-password" className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">{txt('Mật khẩu', 'Password')}</label>
                                <input
                                    id="register-password"
                                    name="password"
                                    type="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    disabled={loading}
                                    autoComplete="new-password"
                                    maxLength="50"
                                    className={`w-full rounded-xl bg-[#f8f9fa] border px-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-2 ${
                                        errors.password ? 'border-red-500 focus:ring-red-500/25' : 'border-[#c2c6d6]/40 focus:ring-[#0058be]/25'
                                    } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    placeholder={txt('Tạo mật khẩu (ít nhất 6 ký tự)', 'Create a password (at least 6 characters)')}
                                />
                                {errors.password && <p className="text-xs text-red-500 animate-pulse">{errors.password}</p>}
                                {form.password && !errors.password && (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                                                <div className={`h-full ${passwordStrength.color} transition-all duration-300`} style={{ width: `${passwordStrength.score * 20}%` }} />
                                            </div>
                                            <span className="text-xs font-semibold text-gray-600">{passwordStrength.label}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="register-confirm" className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">{txt('Xác nhận mật khẩu', 'Confirm Password')}</label>
                                <input
                                    id="register-confirm"
                                    name="confirmPassword"
                                    type="password"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    disabled={loading}
                                    autoComplete="new-password"
                                    maxLength="50"
                                    className={`w-full rounded-xl bg-[#f8f9fa] border px-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-2 ${
                                        errors.confirmPassword ? 'border-red-500 focus:ring-red-500/25' : 'border-[#c2c6d6]/40 focus:ring-[#0058be]/25'
                                    } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    placeholder={txt('Nhập lại mật khẩu', 'Re-enter password')}
                                />
                                {errors.confirmPassword && <p className="text-xs text-red-500 animate-pulse">{errors.confirmPassword}</p>}
                                {form.confirmPassword && form.password === form.confirmPassword && !errors.confirmPassword && (
                                    <p className="text-xs text-green-600 flex items-center gap-1">{txt('✓ Mật khẩu khớp', '✓ Passwords match')}</p>
                                )}
                            </div>

                            {error ? (
                                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 animate-shake">
                                    <p className="font-bold">{txt('❌ Lỗi đăng ký', '❌ Registration error')}</p>
                                    <p className="mt-1">{error}</p>
                                </div>
                            ) : null}

                            {success ? (
                                <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 animate-fade-in">
                                    <p className="font-bold">✓ {success}</p>
                                </div>
                            ) : null}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl bg-gradient-to-r from-[#924700] to-[#0058be] px-4 py-3.5 font-bold text-white shadow-lg shadow-[#0058be]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[#0058be]/30 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:brightness-100 relative overflow-hidden"
                            >
                                <span className={loading ? 'opacity-0' : 'opacity-100 transition-opacity duration-200'}>
                                    {txt('Tạo tài khoản', 'Create account')}
                                </span>
                                {loading && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                                    </div>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 rounded-2xl bg-[#f8f9fa] p-5 text-sm text-slate-600">
                            <p className="font-bold text-[#191c1d]">{txt('Lưu ý', 'Note')}</p>
                            <p className="mt-2 leading-6">
                                {language === 'en'
                                    ? 'After account creation, the system will redirect you to the login page.'
                                    : 'Sau khi tạo tài khoản xong, hệ thống sẽ chuyển về trang đăng nhập.'}
                            </p>
                        </div>

                        <div className="mt-6 text-center text-sm text-slate-500">
                            {txt('Đã có tài khoản?', 'Already have an account?')}{' '}
                            <Link to="/login" className="font-bold text-[#0058be] hover:underline">
                                {txt('Đăng nhập', 'Sign in')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
