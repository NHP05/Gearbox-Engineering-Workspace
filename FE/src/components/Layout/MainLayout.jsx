import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('gearbox_user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('gearbox_user');
        navigate('/login');
    };

    return (
        <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 2rem', background: '#007BFF', color: 'white' }}>
            <h2>Hệ thống Thiết kế Hộp Giảm Tốc</h2>
            <div>
                <Link to="/dashboard" style={{ color: 'white', marginRight: '1rem', textDecoration: 'none' }}>Dự án của tôi</Link>
                <span style={{ marginRight: '1rem', opacity: 0.9 }}>Xin chào, {user.username || 'khách'}</span>
                <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid white', color: 'white', cursor: 'pointer' }}>Đăng xuất</button>
            </div>
        </nav>
    );
};

const Footer = () => (
    <footer style={{ textAlign: 'center', padding: '1rem', background: '#F3F4F6', marginTop: 'auto' }}>
        <p>© 2026 - Đồ án Đa ngành Khoa học Máy tính & Cơ kỹ thuật</p>
    </footer>
);

const MainLayout = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main style={{ flex: 1, padding: '2rem' }}>
                {/* Outlet là nơi render nội dung của từng Page cụ thể */}
                <Outlet /> 
            </main>
            <Footer />
        </div>
    );
};

export default MainLayout;