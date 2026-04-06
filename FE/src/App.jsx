import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Step1_Motor from './pages/CalculationWizard/Step1_Motor';
import Step2_Belt from './pages/CalculationWizard/Step2_Belt';
import Step3_Final from './pages/CalculationWizard/Step3_Final';
function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Tự động chuyển hướng ngay vào Dashboard khi mở trang */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                <Route element={<MainLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/wizard/motor" element={<Step1_Motor />} />
                    <Route path="/wizard/belt" element={<Step2_Belt />} />
                    <Route path="/wizard/gear" element={<Step3_Final />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
// Nhớ Import ở trên cùng

// ...
// Thêm dòng này bên trong Route element={<MainLayout />}

export default App;