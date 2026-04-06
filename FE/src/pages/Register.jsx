import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const Register = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (form.password !== form.confirmPassword) {
            setLoading(false);
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

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

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label htmlFor="register-username" className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Username</label>
                                <input
                                    id="register-username"
                                    name="username"
                                    value={form.username}
                                    onChange={handleChange}
                                    autoComplete="username"
                                    className="w-full rounded-xl bg-[#f8f9fa] border border-[#c2c6d6]/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0058be]/25"
                                    placeholder="Chọn tên đăng nhập"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="register-password" className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Password</label>
                                <input
                                    id="register-password"
                                    name="password"
                                    type="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                    className="w-full rounded-xl bg-[#f8f9fa] border border-[#c2c6d6]/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0058be]/25"
                                    placeholder="Tạo mật khẩu"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="register-confirm" className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Confirm Password</label>
                                <input
                                    id="register-confirm"
                                    name="confirmPassword"
                                    type="password"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                    className="w-full rounded-xl bg-[#f8f9fa] border border-[#c2c6d6]/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0058be]/25"
                                    placeholder="Nhập lại mật khẩu"
                                />
                            </div>

                            {error ? (
                                <div className="rounded-xl bg-[#ffdad6] px-4 py-3 text-sm text-[#ba1a1a]">
                                    {error}
                                </div>
                            ) : null}

                            {success ? (
                                <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
                                    {success}
                                </div>
                            ) : null}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl gradient-button px-4 py-3.5 font-bold text-white shadow-lg shadow-[#0058be]/20 transition-all hover:brightness-105 disabled:opacity-60"
                            >
                                {loading ? 'Đang đăng ký...' : 'Create account'}
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
