import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Step1_Motor from './pages/calculationWizard/Step1_Motor';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/wizard/motor" replace />} />
                
                <Route element={<MainLayout />}>
                    <Route path="/dashboard" element={<div>Trang quản lý dự án sẽ code sau...</div>} />
                    <Route path="/wizard/motor" element={<Step1_Motor />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;