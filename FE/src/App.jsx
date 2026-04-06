import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Step1_Motor from './pages/calculationWizard/Step1_Motor';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Tự động chuyển hướng ngay vào Dashboard khi mở trang */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                <Route element={<MainLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/wizard/motor" element={<Step1_Motor />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;