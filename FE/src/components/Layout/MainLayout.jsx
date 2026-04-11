import React from 'react';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* Outlet render các trang con như Dashboard, MyProjects, UserProfile */}
            <main style={{ flex: 1, display: 'flex' }}>
                <Outlet /> 
            </main>
        </div>
    );
};

export default MainLayout;