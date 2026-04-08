import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import '../styles/auth.css';

const Register = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [errors, setErrors] = useState({ username: '', password: '', confirmPassword: '' });

    // Password strength calculator
    const passwordStrength = useMemo(() => {
        if (!form.password) return { score: 0, label: '', color: 'bg-gray-300' };
        let score = 0;
        if (form.password.length >= 6) score++;
        if (form.password.length >= 8) score++;
        if (/[a-z]/.test(form.password) && /[A-Z]/.test(form.password)) score++;
        if (/\d/.test(form.password)) score++;
        if (/[^a-zA-Z\d]/.test(form.password)) score++;
        
        const labels = ['', 'Yếu', 'Trung bình', 'Khá', 'Mạnh', 'Rất mạnh'];
        const colors = ['bg-gray-300', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];
        
        return { score, label: labels[score], color: colors[score] };
    }, [form.password]);

    // Validation function
    const validateForm = () => {
        const newErrors = { username: '', password: '', confirmPassword: '' };
        let isValid = true;

        if (!form.username.trim()) {
            newErrors.username = 'Tên đăng nhập không được để trống';
            isValid = false;
        } else if (form.username.length < 3) {
            newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
            isValid = false;
        } else if (form.username.length > 20) {
            newErrors.username = 'Tên đăng nhập không được vượt quá 20 ký tự';
            isValid = false;
        } else if (!/^[a-zA-Z0-9_]/.test(form.username)) {
            newErrors.username = 'Tên đăng nhập chỉ chứa chữ, số và dấu gạch dưới';
            isValid = false;
        }

        if (!form.password) {
            newErrors.password = 'Mật khẩu không được để trống';
            isValid = false;
        } else if (form.password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
            isValid = false;
        } else if (form.password.length > 50) {
            newErrors.password = 'Mật khẩu không được vượt quá 50 ký tự';
            isValid = false;
        }

        if (!form.confirmPassword) {
            newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
            isValid = false;
        } else if (form.password !== form.confirmPassword) {
            newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
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
            });
            setSuccess('Đăng ký thành công. Bạn có thể đăng nhập ngay bây giờ.');
            setTimeout(() => navigate('/login', { replace: true }), 900);
        } catch (err) {
            const message = err?.response?.data?.message || 'Không thể đăng ký. Vui lòng thử lại.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 rounded-[28px] overflow-hidden shadow-[0_24px_80px_rgba(25,28,29,0.12)] bg-white">
                <div className="relative p-10 lg:p-14 bg-gradient-to-br from-[#924700] to-[#0058be] text-white">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 0, transparent 28%), radial-gradient(circle at 80% 10%, white 0, transparent 18%), radial-gradient(circle at 70% 80%, white 0, transparent 24%)' }} />
                    <div className="relative z-10 flex h-full flex-col justify-between">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80">Gearbox Engineer</span>
                            <h1 className="mt-4 text-4xl font-black leading-tight">Tạo tài khoản khách hàng để bắt đầu thiết kế</h1>
                            <p className="mt-4 max-w-md text-sm text-white/80 leading-6">
                                Đăng ký để lưu dự án, tiếp tục wizard và xuất báo cáo theo đúng luồng làm việc của hệ thống.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mt-10">
                            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Secure</p>
                                <p className="mt-2 text-2xl font-black">JWT</p>
                            </div>
                            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Fast</p>
                                <p className="mt-2 text-2xl font-black">1 Step</p>
                            </div>
                            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Ready</p>
                                <p className="mt-2 text-2xl font-black">24h</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-10 lg:p-14">
                    <div className="max-w-md mx-auto">
                        <div className="mb-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#924700]">Customer Access</span>
                            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#191c1d]">Create account</h2>
                            <p className="mt-3 text-sm leading-6 text-slate-500">
                                Tạo tài khoản để sử dụng đầy đủ chức năng thiết kế hộp giảm tốc.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
                            <div className="space-y-2">
                                <label htmlFor="register-username" className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Username</label>
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
                                    placeholder="Chọn tên đăng nhập"
                                />
                                <div className="flex justify-between items-end">
                                    {errors.username && <p className="text-xs text-red-500 animate-pulse">{errors.username}</p>}
                                    <p className="text-xs text-gray-400 ml-auto">{form.username.length}/20</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="register-password" className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Password</label>
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
                                    placeholder="Tạo mật khẩu (ít nhất 6 ký tự)"
                                />
                                {errors.password && <p className="text-xs text-red-500 animate-pulse">{errors.password}</p>}
                                {form.password && !errors.password && (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                                                <div className={`h-full ${passwordStrength.color} transition-all duration-300 w-[${passwordStrength.score * 20}%]`} />
                                            </div>
                                            <span className="text-xs font-semibold text-gray-600">{passwordStrength.label}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="register-confirm" className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Confirm Password</label>
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
                                    placeholder="Nhập lại mật khẩu"
                                />
                                {errors.confirmPassword && <p className="text-xs text-red-500 animate-pulse">{errors.confirmPassword}</p>}
                                {form.confirmPassword && form.password === form.confirmPassword && !errors.confirmPassword && (
                                    <p className="text-xs text-green-600 flex items-center gap-1">✓ Mật khẩu khớp</p>
                                )}
                            </div>

                            {error ? (
                                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 animate-shake">
                                    <p className="font-bold">❌ Lỗi đăng ký</p>
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
                                    Create account
                                </span>
                                {loading && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                                    </div>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 rounded-2xl bg-[#f8f9fa] p-5 text-sm text-slate-600">
                            <p className="font-bold text-[#191c1d]">Lưu ý</p>
                            <p className="mt-2 leading-6">
                                Backend đang dùng endpoint <span className="font-mono">/api/v1/auth/register</span>. Sau khi tạo tài khoản xong, hệ thống sẽ chuyển về trang đăng nhập.
                            </p>
                        </div>

                        <div className="mt-6 text-center text-sm text-slate-500">
                            Đã có tài khoản?{' '}
                            <Link to="/login" className="font-bold text-[#0058be] hover:underline">
                                Đăng nhập
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
