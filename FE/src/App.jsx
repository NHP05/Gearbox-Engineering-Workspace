import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import CalculationWizard from './pages/calculationWizard';
import Login from './pages/Login';

const RequireAuth = ({ children }) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/wizard" replace />} />
                <Route path="/login" element={<Login />} />

                <Route
                    path="/wizard"
                    element={(
                        <RequireAuth>
                            <CalculationWizard />
                        </RequireAuth>
                    )}
                />

                <Route element={<MainLayout />}>
                    <Route
                        path="/dashboard"
                        element={(
                            <RequireAuth>
                                <Dashboard />
                            </RequireAuth>
                        )}
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;