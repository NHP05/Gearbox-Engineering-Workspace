import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const Login = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axiosClient.post('/auth/login', form);
            localStorage.setItem('jwt_token', response.data.token);
            localStorage.setItem('gearbox_user', JSON.stringify(response.data.user));
            navigate('/wizard', { replace: true });
        } catch (err) {
            const message = err?.response?.data?.message || 'Không thể đăng nhập. Vui lòng kiểm tra thông tin.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 rounded-[28px] overflow-hidden shadow-[0_24px_80px_rgba(25,28,29,0.12)] bg-white">
                <div className="relative p-10 lg:p-14 bg-gradient-to-br from-[#0058be] to-[#2170e4] text-white">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 0, transparent 28%), radial-gradient(circle at 80% 10%, white 0, transparent 18%), radial-gradient(circle at 70% 80%, white 0, transparent 24%)' }} />
                    <div className="relative z-10 flex h-full flex-col justify-between">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80">Gearbox Engineer</span>
                            <h1 className="mt-4 text-4xl font-black leading-tight">Đăng nhập để tiếp tục thiết kế hộp giảm tốc</h1>
                            <p className="mt-4 max-w-md text-sm text-white/80 leading-6">
                                Truy cập các bước tính toán, lưu dự án và xuất báo cáo kỹ thuật từ một tài khoản duy nhất.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mt-10">
                            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Projects</p>
                                <p className="mt-2 text-2xl font-black">12</p>
                            </div>
                            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Analyses</p>
                                <p className="mt-2 text-2xl font-black">28</p>
                            </div>
                            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Exports</p>
                                <p className="mt-2 text-2xl font-black">142</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-10 lg:p-14">
                    <div className="max-w-md mx-auto">
                        <div className="mb-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0058be]">Customer Access</span>
                            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#191c1d]">Sign in</h2>
                            <p className="mt-3 text-sm leading-6 text-slate-500">
                                Dùng tài khoản khách hàng để tiếp tục vào wizard thiết kế.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label htmlFor="username" className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Username</label>
                                <input
                                    id="username"
                                    name="username"
                                    value={form.username}
                                    onChange={handleChange}
                                    autoComplete="username"
                                    className="w-full rounded-xl bg-[#f8f9fa] border border-[#c2c6d6]/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0058be]/25"
                                    placeholder="Nhập tên đăng nhập"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                    className="w-full rounded-xl bg-[#f8f9fa] border border-[#c2c6d6]/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0058be]/25"
                                    placeholder="Nhập mật khẩu"
                                />
                            </div>

                            {error ? (
                                <div className="rounded-xl bg-[#ffdad6] px-4 py-3 text-sm text-[#ba1a1a]">
                                    {error}
                                </div>
                            ) : null}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl gradient-button px-4 py-3.5 font-bold text-white shadow-lg shadow-[#0058be]/20 transition-all hover:brightness-105 disabled:opacity-60"
                            >
                                {loading ? 'Đang đăng nhập...' : 'Sign in to continue'}
                            </button>
                        </form>

                        <div className="mt-8 rounded-2xl bg-[#f8f9fa] p-5 text-sm text-slate-600">
                            <p className="font-bold text-[#191c1d]">Gợi ý</p>
                            <p className="mt-2 leading-6">
                                Backend đã có endpoint login tại <span className="font-mono">/api/v1/auth/login</span>. Nếu chưa có tài khoản, cần đăng ký trước qua API hoặc seed user trong BE.
                            </p>
                        </div>

                        <div className="mt-6 text-center text-sm text-slate-500">
                            Chưa có tài khoản?{' '}
                            <Link to="/register" className="font-bold text-[#0058be] hover:underline">
                                Đăng ký ngay
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
