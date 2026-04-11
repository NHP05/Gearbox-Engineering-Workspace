import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import MyProjects from './pages/MyProjects';
import UserProfile from './pages/UserProfile';
import StandardsLibrary from './pages/StandardsLibrary';
import CalculationWizard from './pages/calculationWizard';
import Login from './pages/Login';
import Register from './pages/Register';

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
                    <Route
                        path="/my-projects"
                        element={(
                            <RequireAuth>
                                <MyProjects />
                            </RequireAuth>
                        )}
                    />
                    <Route
                        path="/user-profile"
                        element={(
                            <RequireAuth>
                                <UserProfile />
                            </RequireAuth>
                        )}
                    />
                    <Route
                        path="/standards-library"
                        element={(
                            <RequireAuth>
                                <StandardsLibrary />
                            </RequireAuth>
                        )}
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;