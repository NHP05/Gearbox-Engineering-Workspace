import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import Dashboard from './pages/Dashboard';
import CalculationWizard from './pages/calculationWizard';
import Login from './pages/Login';
import Register from './pages/Register';
import AIAssistant from './pages/AIAssistant';
import SupportCenter from './pages/SupportCenter';
import Settings from './pages/Settings';
import ProfileInfo from './pages/ProfileInfo';
import Notifications from './pages/Notifications';
import AdminAuditLogs from './pages/AdminAuditLogs';

const RequireAuth = ({ children }) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

RequireAuth.propTypes = {
    children: PropTypes.node.isRequired,
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Wizard routes - all variants point to same component */}
                <Route
                    path="/wizard"
                    element={(
                        <RequireAuth>
                            <CalculationWizard />
                        </RequireAuth>
                    )}
                />
                <Route
                    path="/wizard/:step"
                    element={(
                        <RequireAuth>
                            <CalculationWizard />
                        </RequireAuth>
                    )}
                />
                <Route
                    path="/dashboard"
                    element={(
                        <RequireAuth>
                            <Dashboard />
                        </RequireAuth>
                    )}
                />
                <Route
                    path="/assistant"
                    element={(
                        <RequireAuth>
                            <AIAssistant />
                        </RequireAuth>
                    )}
                />
                <Route
                    path="/support"
                    element={(
                        <RequireAuth>
                            <SupportCenter />
                        </RequireAuth>
                    )}
                />
                <Route
                    path="/notifications"
                    element={(
                        <RequireAuth>
                            <Notifications />
                        </RequireAuth>
                    )}
                />
                <Route
                    path="/admin/audit-logs"
                    element={(
                        <RequireAuth>
                            <AdminAuditLogs />
                        </RequireAuth>
                    )}
                />
                <Route
                    path="/settings"
                    element={(
                        <RequireAuth>
                            <Settings />
                        </RequireAuth>
                    )}
                />
                <Route
                    path="/profile"
                    element={(
                        <RequireAuth>
                            <ProfileInfo />
                        </RequireAuth>
                    )}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;