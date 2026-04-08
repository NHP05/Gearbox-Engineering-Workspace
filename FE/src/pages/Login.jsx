import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import '../styles/auth.css';

const Login = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({ username: '', password: '' });

    // Validation function
    const validateForm = () => {
        const newErrors = { username: '', password: '' };
        let isValid = true;

        if (!form.username.trim()) {
            newErrors.username = 'Tên đăng nhập không được để trống';
            isValid = false;
        } else if (form.username.length < 3) {
            newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
            isValid = false;
        }

        if (!form.password) {
            newErrors.password = 'Mật khẩu không được để trống';
            isValid = false;
        } else if (form.password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
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
            console.log('Gửi request login đến:', axiosClient.defaults.baseURL);
            console.log('Username:', form.username, 'Password:', form.password);
            
            const response = await axiosClient.post('/auth/login', form, {
                timeout: 10000, // 10 secondes timeout
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            console.log('✅ Response status:', response.status);
            console.log('✅ Response data:', response.data);
            
            if (response.data.success && response.data.token) {
                localStorage.setItem('jwt_token', response.data.token);
                localStorage.setItem('gearbox_user', JSON.stringify(response.data.user || { username: form.username }));
                
                console.log('✅ Login thành công, redirecting...');
                navigate('/dashboard', { replace: true });
            } else {
                setError(response.data.message || 'Lỗi đăng nhập: Server không trả về token');
            }
        } catch (err) {
            console.error('❌ Full Error object:', err);
            console.error('❌ Error code:', err.code);
            console.error('❌ Error message:', err.message);
            console.error('❌ Error response:', err.response);
            console.error('❌ Error config:', err.config);
            
            // Network error / CORS error
            if (!err.response) {
                console.error('🔴 NO RESPONSE - Network error or CORS issue');
                setError(`❌ Không kết nối được Backend!\n\nKiểm tra:\n1. Chạy: cd BE && npm run dev\n2. Backend URL: http://localhost:8080\n3. Error: ${err.message}`);
            }
            // API error with response
            else {
                console.error('🟡 Response received but with error');
                const message = err.response.data?.message || `HTTP ${err.response.status}: ${err.response.statusText}`;
                setError(message);
            }
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

                        <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
                            <div className="space-y-2">
                                <label htmlFor="username" className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Username</label>
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
                                    placeholder="Nhập tên đăng nhập"
                                />
                                {errors.username && <p className="text-xs text-red-500 animate-pulse">{errors.username}</p>}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Password</label>
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
                                    placeholder="Nhập mật khẩu"
                                />
                                {errors.password && <p className="text-xs text-red-500 animate-pulse">{errors.password}</p>}
                            </div>

                            {error ? (
                                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 animate-shake">
                                    <p className="font-bold">❌ Lỗi đăng nhập</p>
                                    <p className="mt-1">{error}</p>
                                </div>
                            ) : null}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl bg-gradient-to-r from-[#0058be] to-[#2170e4] px-4 py-3.5 font-bold text-white shadow-lg shadow-[#0058be]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[#0058be]/30 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:brightness-100 relative overflow-hidden"
                            >
                                <span className={loading ? 'opacity-0' : 'opacity-100 transition-opacity duration-200'}>
                                    Sign in to continue
                                </span>
                                {loading && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                                    </div>
                                )}
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
