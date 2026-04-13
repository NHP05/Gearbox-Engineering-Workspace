import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { mergeProjects, updateProjectById, deleteProjectById, isUsingLocalProjectStore } from '../services/projectDraft';
import { patchWizardState, resetWizardState } from '../utils/wizardState';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import UserMenu from '../components/UserMenu';

const toSafeNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const parseStoredJson = (key, fallback = {}) => {
    try {
        const parsed = JSON.parse(localStorage.getItem(key) || '');
        return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch (error) {
        return fallback;
    }
};

const buildDynamicMetrics = (projectList = []) => {
    const projects = Array.isArray(projectList) ? projectList.length : 0;
    const analyses = (projectList || []).filter((item) => String(item.status || '').toLowerCase().includes('complete')).length;
    const exports = (projectList || []).reduce((acc, item) => {
        const variantsCount = toSafeNumber(item.variant_count, 0)
            || toSafeNumber(item.variants_count, 0)
            || toSafeNumber(item.options_count, 0)
            || toSafeNumber(item.saved_options, 0)
            || (Array.isArray(item.variants) ? item.variants.length : 0);
        return acc + variantsCount;
    }, 0);

    return {
        projects,
        analyses,
        exports: exports > 0 ? exports : projects,
    };
};

const normalizeProjectId = (value) => {
    const id = String(value ?? '').trim();
    if (!id || id === 'undefined' || id === 'null' || id === 'NaN') {
        return null;
    }
    return id;
};

const normalizeSearchValue = (value) => {
    return String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
};

const filterProjectsByQuery = (projectList = [], searchQuery = '') => {
    const query = normalizeSearchValue(searchQuery);
    if (!query) return projectList;

    return projectList.filter((project, index) => {
        const projectId = normalizeSearchValue(
            project?.id
            ?? project?.project_id
            ?? project?.projectId
            ?? project?.uuid
            ?? `local-${index + 1}`
        );
        const name = normalizeSearchValue(project.project_name || project.name || '');
        const status = normalizeSearchValue(project.status || '');
        const power = normalizeSearchValue(project.power_P);
        const speed = normalizeSearchValue(project.speed_n);
        const owner = normalizeSearchValue(project?.User?.username || project?.owner_username || '');

        return projectId.includes(query)
            || name.includes(query)
            || status.includes(query)
            || power.includes(query)
            || speed.includes(query)
            || owner.includes(query);
    });
};

const resolveProjectProgress = (project = {}) => {
    const status = String(project?.status || '').toLowerCase();

    const candidates = [
        project?.progress,
        project?.progress_percent,
        project?.progressPercent,
        project?.completion_percent,
        project?.completionPercent,
    ];

    for (let index = 0; index < candidates.length; index += 1) {
        const parsed = Number(candidates[index]);
        if (Number.isFinite(parsed)) {
            return Math.max(0, Math.min(100, Math.round(parsed)));
        }
    }

    if (status.includes('complete') || status.includes('hoan')) return 100;
    if (status.includes('progress') || status.includes('in_progress')) return 60;
    if (status.includes('draft')) return 20;
    return 0;
};

const Dashboard = () => {
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const { language, t } = useLanguage();
    const user = parseStoredJson('gearbox_user', {});
    const resolvedUserName = String(user?.full_name || user?.name || user?.username || '').trim();
    const userRole = String(user?.role || 'USER').toUpperCase();
    const isAdmin = userRole === 'ADMIN';
    const greetingName = resolvedUserName || t('dashboard_default_user');
    const greetingText = `${t('dashboard_greeting_prefix')}, ${greetingName}!`;
    const [projects, setProjects] = useState([]);
    const [adminOwnedProjects, setAdminOwnedProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeMenu, setActiveMenu] = useState('overview');
    const [search, setSearch] = useState('');
    const [openProjectMenu, setOpenProjectMenu] = useState(null);
    const [actionMessage, setActionMessage] = useState('');
    const [actionMessageVisible, setActionMessageVisible] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
    const [notificationActionBusyId, setNotificationActionBusyId] = useState('');
    const [openAccountMenuId, setOpenAccountMenuId] = useState(null);
    const [adminUsers, setAdminUsers] = useState([]);
    const [revealedCredentialByUserId, setRevealedCredentialByUserId] = useState({});
    const [adminActionLogs, setAdminActionLogs] = useState([]);
    const [adminLogActionBusyId, setAdminLogActionBusyId] = useState('');
    const [loadingAccounts, setLoadingAccounts] = useState(false);
    const [accountActionBusyId, setAccountActionBusyId] = useState('');
    const [stats, setStats] = useState({
        projects: 0,
        analyses: 0,
        exports: 0,
        source: 'fallback',
    });
    const notificationButtonRef = useRef(null);
    const notificationDropdownRef = useRef(null);

    const loadAdminAccountData = async () => {
        if (!isAdmin) return;

        setLoadingAccounts(true);
        try {
            const [usersResponse, logsResponse] = await Promise.all([
                axiosClient.get('/admin/users'),
                axiosClient.get('/admin/action-logs').catch(() => null),
            ]);

            const users = Array.isArray(usersResponse?.data?.data) ? usersResponse.data.data : [];
            const logs = Array.isArray(logsResponse?.data?.data) ? logsResponse.data.data : [];

            setAdminUsers(users);
            setRevealedCredentialByUserId({});
            setAdminActionLogs(logs);
        } catch (error) {
            setAdminUsers([]);
            setRevealedCredentialByUserId({});
            setAdminActionLogs([]);
        } finally {
            setLoadingAccounts(false);
        }
    };

    const loadNotifications = async () => {
        try {
            const response = await axiosClient.get('/notification/my?limit=200');
            const items = Array.isArray(response?.data?.data) ? response.data.data : [];
            setNotifications(items);
        } catch (error) {
            setNotifications([]);
        }
    };

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                if (!isAdmin && isUsingLocalProjectStore()) {
                    const merged = mergeProjects([]);
                    setProjects(merged);
                    setAdminOwnedProjects(merged);

                    const fallbackMetrics = buildDynamicMetrics(merged);
                    setStats({
                        ...fallbackMetrics,
                        source: 'local',
                    });

                    setError('');
                    return;
                }

                if (isAdmin) {
                    const [allProjectsResponse, myProjectsResponse, statsResponse] = await Promise.all([
                        axiosClient.get('/admin/projects'),
                        axiosClient.get('/project/my-projects').catch(() => null),
                        axiosClient.get('/public/stats').catch(() => null),
                    ]);

                    const allProjects = Array.isArray(allProjectsResponse?.data?.data) ? allProjectsResponse.data.data : [];
                    const myProjects = Array.isArray(myProjectsResponse?.data?.data) ? myProjectsResponse.data.data : [];
                    const statsData = statsResponse?.data?.data || null;

                    setProjects(allProjects);
                    setAdminOwnedProjects(myProjects);

                    const fallbackMetrics = buildDynamicMetrics(allProjects);
                    setStats({
                        projects: toSafeNumber(statsData?.projects, fallbackMetrics.projects),
                        analyses: toSafeNumber(statsData?.analyses, fallbackMetrics.analyses),
                        exports: toSafeNumber(statsData?.exports, fallbackMetrics.exports),
                        source: statsData ? 'api' : 'fallback',
                    });

                    setError('');
                    return;
                }

                const projectResponse = await axiosClient.get('/project/my-projects');
                const apiProjects = Array.isArray(projectResponse?.data?.data) ? projectResponse.data.data : [];
                const scopedProjects = mergeProjects(apiProjects);

                setProjects(scopedProjects);
                setAdminOwnedProjects(scopedProjects);

                const fallbackMetrics = buildDynamicMetrics(scopedProjects);
                setStats({
                    ...fallbackMetrics,
                    source: 'user-scope',
                });

                setError('');
            } catch (err) {
                setError(t('dashboard_api_fallback'));
                const merged = mergeProjects([]);
                setProjects(merged);
                setAdminOwnedProjects(merged);
                const fallbackMetrics = buildDynamicMetrics(merged);
                setStats({
                    ...fallbackMetrics,
                    source: 'fallback',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, [isAdmin, t]);

    useEffect(() => {
        if (!isAdmin) return;
        loadAdminAccountData();
    }, [isAdmin]);

    useEffect(() => {
        const closeProjectMenu = () => {
            setOpenProjectMenu(null);
            setOpenAccountMenuId(null);
        };
        window.addEventListener('click', closeProjectMenu);
        return () => window.removeEventListener('click', closeProjectMenu);
    }, []);

    useEffect(() => {
        loadNotifications();
    }, []);

    useEffect(() => {
        if (!openProjectMenu) return undefined;

        const closeOnViewportChange = () => setOpenProjectMenu(null);
        window.addEventListener('resize', closeOnViewportChange);
        window.addEventListener('scroll', closeOnViewportChange, true);

        return () => {
            window.removeEventListener('resize', closeOnViewportChange);
            window.removeEventListener('scroll', closeOnViewportChange, true);
        };
    }, [openProjectMenu]);

    useEffect(() => {
        if (!notificationDropdownOpen) return undefined;

        const closeDropdown = (event) => {
            const target = event?.target;
            if (notificationButtonRef.current?.contains(target)) return;
            if (notificationDropdownRef.current?.contains(target)) return;
            setNotificationDropdownOpen(false);
        };
        const closeOnViewportChange = () => setNotificationDropdownOpen(false);

        document.addEventListener('mousedown', closeDropdown);
        window.addEventListener('resize', closeOnViewportChange);

        return () => {
            document.removeEventListener('mousedown', closeDropdown);
            window.removeEventListener('resize', closeOnViewportChange);
        };
    }, [notificationDropdownOpen]);

    useEffect(() => {
        const fallbackMetrics = buildDynamicMetrics(projects);
        const payload = {
            projects: stats?.projects ?? fallbackMetrics.projects,
            analyses: stats?.analyses ?? fallbackMetrics.analyses,
            exports: stats?.exports ?? fallbackMetrics.exports,
            source: stats?.source || 'fallback',
            updatedAt: new Date().toISOString(),
        };

        localStorage.setItem('gearbox_dashboard_metrics', JSON.stringify(payload));
    }, [projects, stats]);

    useEffect(() => {
        if (!actionMessage) {
            setActionMessageVisible(false);
            return undefined;
        }

        setActionMessageVisible(true);

        const fadeTimeoutId = window.setTimeout(() => {
            setActionMessageVisible(false);
        }, 4500);

        const clearTimeoutId = window.setTimeout(() => {
            setActionMessage('');
        }, 5000);

        return () => {
            window.clearTimeout(fadeTimeoutId);
            window.clearTimeout(clearTimeoutId);
        };
    }, [actionMessage]);

    const handleLogout = () => {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('gearbox_user');
        navigate('/login', { replace: true });
    };

    const handleStartWizard = (projectId = null) => {
        const normalizedProjectId = normalizeProjectId(projectId);
        if (normalizedProjectId) {
            localStorage.setItem('current_project', normalizedProjectId);
            navigate('/wizard/motor');
            return;
        }

        const projectNameInput = window.prompt(t('dashboard_prompt_project_name_required'), '');
        if (projectNameInput === null) {
            return;
        }

        const projectName = String(projectNameInput || '').trim();
        if (!projectName) {
            setActionMessage(t('dashboard_project_name_required'));
            return;
        }

        resetWizardState();
        patchWizardState({
            meta: { projectName },
            stepSaved: {
                1: false,
                2: false,
                3: false,
                4: false,
                5: false,
            },
        });

        localStorage.removeItem('current_project');
        localStorage.removeItem('step1_result');
        localStorage.removeItem('step3_result');
        localStorage.removeItem('step4_result');

        navigate('/wizard/motor');
    };

    const handleProjectCardKeyDown = (event, projectId) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleStartWizard(projectId);
        }
    };

    const handleOpenProjects = () => {
        setActiveMenu('projects');
    };

    const formatDate = (value) => {
        if (!value) {
            return t('dashboard_recently_updated');
        }

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return String(value);
        }

        const locale = language === 'vi' ? 'vi-VN' : 'en-US';
        return `${t('dashboard_project_updated_prefix')} ${parsed.toLocaleDateString(locale)}`;
    };

    const getProjectId = (project, index = 0) => {
        const rawId = normalizeProjectId(
            project?.id
            ?? project?.project_id
            ?? project?.projectId
            ?? project?.uuid
        );

        if (rawId) {
            return rawId;
        }

        const fallbackSeed = normalizeProjectId(project?.createdAt || project?.updatedAt) || String(index + 1);
        return `local-${fallbackSeed}`;
    };

    const toggleProjectMenu = (event, project, index) => {
        event.stopPropagation();
        const projectId = getProjectId(project, index);
        const rect = event.currentTarget.getBoundingClientRect();

        setOpenProjectMenu((prev) => {
            if (prev?.projectId === String(projectId)) {
                return null;
            }

            const menuWidth = 160;
            const menuHeight = 132;
            const viewportPadding = 12;

            const left = Math.min(
                window.innerWidth - menuWidth - viewportPadding,
                Math.max(viewportPadding, rect.right - menuWidth)
            );

            const top = Math.min(
                window.innerHeight - menuHeight - viewportPadding,
                Math.max(viewportPadding, rect.bottom + 6)
            );

            return {
                project,
                index,
                projectId: String(projectId),
                top,
                left,
            };
        });
    };

    const handleEditProject = async (project, index) => {
        const projectId = getProjectId(project, index);
        const currentName = project.project_name || project.name || '';
        const nextName = window.prompt(t('dashboard_prompt_project_name'), currentName);

        if (nextName === null) {
            setOpenProjectMenu(null);
            return;
        }

        const trimmed = nextName.trim();
        if (!trimmed || trimmed === currentName) {
            setOpenProjectMenu(null);
            return;
        }

        try {
            await updateProjectById(projectId, { project_name: trimmed });
            setProjects((prev) => prev.map((item, itemIndex) => (
                String(getProjectId(item, itemIndex)) === String(projectId)
                    ? { ...item, project_name: trimmed, updatedAt: new Date().toISOString() }
                    : item
            )));
            setAdminOwnedProjects((prev) => prev.map((item, itemIndex) => (
                String(getProjectId(item, itemIndex)) === String(projectId)
                    ? { ...item, project_name: trimmed, updatedAt: new Date().toISOString() }
                    : item
            )));
            setActionMessage(t('dashboard_edit_success'));
        } catch (err) {
            setActionMessage(err?.response?.data?.message || t('dashboard_update_failed'));
        } finally {
            setOpenProjectMenu(null);
        }
    };

    const handleDeleteProject = async (project, index) => {
        const projectId = getProjectId(project, index);

        if (!window.confirm(t('dashboard_delete_confirm'))) {
            setOpenProjectMenu(null);
            return;
        }

        try {
            const isLocalProject = String(projectId).startsWith('local-');

            if (isAdmin && !isLocalProject) {
                const reason = window.prompt(t('admin_delete_project_reason_prompt'), t('admin_delete_project_reason_default'));
                if (reason === null) {
                    setOpenProjectMenu(null);
                    return;
                }

                const cleanReason = String(reason || '').trim();
                if (!cleanReason) {
                    setActionMessage(t('admin_reason_required'));
                    setOpenProjectMenu(null);
                    return;
                }

                const adminPassword = requestAdminPassword();
                if (adminPassword === null) {
                    setOpenProjectMenu(null);
                    return;
                }

                if (!adminPassword) {
                    setOpenProjectMenu(null);
                    return;
                }

                await axiosClient.delete(`/admin/projects/${encodeURIComponent(projectId)}`, {
                    data: {
                        reason: cleanReason,
                        admin_password: adminPassword,
                    },
                });
            } else {
                await deleteProjectById(projectId);
            }

            setProjects((prev) => prev.filter((item, itemIndex) => String(getProjectId(item, itemIndex)) !== String(projectId)));
            setAdminOwnedProjects((prev) => prev.filter((item, itemIndex) => String(getProjectId(item, itemIndex)) !== String(projectId)));
            setActionMessage(t('dashboard_delete_success'));

            if (isAdmin) {
                await Promise.all([
                    loadAdminAccountData(),
                    loadNotifications(),
                ]);
            }
        } catch (err) {
            setActionMessage(err?.response?.data?.message || t('dashboard_delete_failed'));
        } finally {
            setOpenProjectMenu(null);
        }
    };

    const sortedNotifications = useMemo(() => {
        return [...notifications].sort((a, b) => {
            const aPinned = a?.is_pinned ? 1 : 0;
            const bPinned = b?.is_pinned ? 1 : 0;
            if (aPinned !== bPinned) {
                return bPinned - aPinned;
            }

            const aTime = new Date(a?.createdAt || 0).getTime();
            const bTime = new Date(b?.createdAt || 0).getTime();
            return bTime - aTime;
        });
    }, [notifications]);

    const unreadNotifications = sortedNotifications.filter((item) => !item?.is_read);
    const unreadNoticeCount = unreadNotifications.length;
    const notificationPreviewItems = unreadNotifications.slice(0, 6);

    const resolveNotificationRoute = (item) => {
        const metadata = item?.metadata;
        if (!metadata || typeof metadata !== 'object') return '';

        const directRoute = String(metadata.route || metadata.targetRoute || '').trim();
        if (directRoute.startsWith('/')) {
            return directRoute;
        }

        const ticketCode = String(metadata.ticketCode || metadata.ticketId || '').trim();
        if (ticketCode) {
            return `/support?ticket=${encodeURIComponent(ticketCode)}`;
        }

        return '';
    };

    const requestAdminPassword = () => {
        if (!isAdmin) {
            return null;
        }

        const value = window.prompt(t('admin_password_confirm_prompt'), '');
        if (value === null) {
            return null;
        }

        const clean = String(value || '').trim();
        if (!clean) {
            setActionMessage(t('admin_password_required'));
            return '';
        }

        return clean;
    };

    const markNoticeRead = async (notificationId) => {
        if (!notificationId) return;

        setNotificationActionBusyId(`read-${notificationId}`);
        try {
            await axiosClient.put(`/notification/${notificationId}/read`);
            setNotifications((prev) => prev.map((item) => (
                Number(item.id) === Number(notificationId)
                    ? { ...item, is_read: true }
                    : item
            )));
        } catch (error) {
            // Keep current list on error
        } finally {
            setNotificationActionBusyId('');
        }
    };

    const markAllNoticeRead = async () => {
        setNotificationActionBusyId('read-all');
        try {
            await axiosClient.put('/notification/read-all');
            setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
        } catch (error) {
            // Keep current list on error
        } finally {
            setNotificationActionBusyId('');
        }
    };

    const toggleNoticePin = async (notification) => {
        if (!notification?.id) return;

        const nextPinned = !Boolean(notification?.is_pinned);
        setNotificationActionBusyId(`pin-${notification.id}`);
        try {
            await axiosClient.put(`/notification/${notification.id}/pin`, { pinned: nextPinned });
            setNotifications((prev) => prev.map((item) => (
                Number(item.id) === Number(notification.id)
                    ? {
                        ...item,
                        is_pinned: nextPinned,
                        pinned_at: nextPinned ? new Date().toISOString() : null,
                    }
                    : item
            )));
        } catch (error) {
            // Keep current list on error
        } finally {
            setNotificationActionBusyId('');
        }
    };

    const removeNotice = async (notificationId) => {
        if (!notificationId) return;

        setNotificationActionBusyId(`del-${notificationId}`);
        try {
            await axiosClient.delete(`/notification/${notificationId}`);
            setNotifications((prev) => prev.filter((item) => Number(item.id) !== Number(notificationId)));
        } catch (error) {
            // Keep current list on error
        } finally {
            setNotificationActionBusyId('');
        }
    };

    const handleOpenNotificationsPage = () => {
        setNotificationDropdownOpen(false);
        navigate('/notifications');
    };

    const markAdminLogRead = async (logId) => {
        if (!logId) return;

        setAdminLogActionBusyId(`read-${logId}`);
        try {
            await axiosClient.put(`/admin/action-logs/${logId}/read`);
            setAdminActionLogs((prev) => prev.map((item) => (
                Number(item.id) === Number(logId)
                    ? {
                        ...item,
                        is_read: true,
                        read_at: new Date().toISOString(),
                    }
                    : item
            )));
        } catch (error) {
            setActionMessage(error?.response?.data?.message || t('admin_action_failed'));
        } finally {
            setAdminLogActionBusyId('');
        }
    };

    const markAllAdminLogsRead = async () => {
        setAdminLogActionBusyId('read-all');
        try {
            await axiosClient.put('/admin/action-logs/read-all');
            setAdminActionLogs((prev) => prev.map((item) => ({
                ...item,
                is_read: true,
                read_at: item?.read_at || new Date().toISOString(),
            })));
        } catch (error) {
            setActionMessage(error?.response?.data?.message || t('admin_action_failed'));
        } finally {
            setAdminLogActionBusyId('');
        }
    };

    const handleOpenAdminAuditLogPage = () => {
        navigate('/admin/audit-logs');
    };

    const openNotificationTarget = async (item) => {
        const route = resolveNotificationRoute(item);
        if (!route) return;

        if (!item?.is_read && item?.id) {
            await markNoticeRead(item.id);
        }

        setNotificationDropdownOpen(false);
        navigate(route);
    };

    const handleToggleBanUser = async (account) => {
        setOpenAccountMenuId(null);
        const nextBanned = !Boolean(account?.is_banned);
        const defaultReason = nextBanned ? t('admin_ban_reason_default') : t('admin_unban_reason_default');
        const reason = window.prompt(
            nextBanned ? t('admin_ban_reason_prompt') : t('admin_unban_reason_prompt'),
            defaultReason
        );

        if (reason === null) return;

        const cleanReason = String(reason || '').trim();
        if (nextBanned && !cleanReason) {
            setActionMessage(t('admin_reason_required'));
            return;
        }

        const adminPassword = requestAdminPassword();
        if (adminPassword === null) return;
        if (!adminPassword) return;

        setAccountActionBusyId(`ban-${account.id}`);
        try {
            await axiosClient.put(`/admin/users/${account.id}/ban`, {
                banned: nextBanned,
                reason: cleanReason,
                admin_password: adminPassword,
            });
            setActionMessage(nextBanned ? t('admin_ban_success') : t('admin_unban_success'));
            await loadAdminAccountData();
        } catch (error) {
            setActionMessage(error?.response?.data?.message || t('admin_action_failed'));
        } finally {
            setAccountActionBusyId('');
        }
    };

    const handleDeleteUser = async (account) => {
        setOpenAccountMenuId(null);
        const reason = window.prompt(t('admin_delete_user_reason_prompt'), t('admin_delete_user_reason_default'));
        if (reason === null) return;

        const cleanReason = String(reason || '').trim();
        if (!cleanReason) {
            setActionMessage(t('admin_reason_required'));
            return;
        }

        if (!window.confirm(t('admin_delete_user_confirm'))) {
            return;
        }

        const adminPassword = requestAdminPassword();
        if (adminPassword === null) return;
        if (!adminPassword) return;

        setAccountActionBusyId(`del-${account.id}`);
        try {
            await axiosClient.delete(`/admin/users/${account.id}`, {
                data: {
                    reason: cleanReason,
                    admin_password: adminPassword,
                },
            });

            setActionMessage(t('admin_delete_user_success'));
            await Promise.all([
                loadAdminAccountData(),
                axiosClient.get('/admin/projects').then((response) => {
                    const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
                    setProjects(rows);
                }).catch(() => {}),
                axiosClient.get('/project/my-projects').then((response) => {
                    const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
                    setAdminOwnedProjects(rows);
                }).catch(() => {}),
            ]);
        } catch (error) {
            setActionMessage(error?.response?.data?.message || t('admin_action_failed'));
        } finally {
            setAccountActionBusyId('');
        }
    };

    const handleRevealCredential = async (account) => {
        setOpenAccountMenuId(null);
        if (!account?.id) return;

        if (revealedCredentialByUserId[account.id]) {
            setRevealedCredentialByUserId((prev) => {
                const next = { ...prev };
                delete next[account.id];
                return next;
            });
            return;
        }

        const adminPassword = requestAdminPassword();
        if (adminPassword === null) return;
        if (!adminPassword) return;

        setAccountActionBusyId(`reveal-${account.id}`);
        try {
            const response = await axiosClient.post(`/admin/users/${account.id}/reveal-password`, {
                admin_password: adminPassword,
            });

            const payload = response?.data?.data || {};
            setRevealedCredentialByUserId((prev) => ({
                ...prev,
                [account.id]: {
                    value: payload.credential_value || '',
                    type: payload.credential_type || 'HASH',
                },
            }));

            setActionMessage(t('admin_password_reveal_success'));
        } catch (error) {
            setActionMessage(error?.response?.data?.message || t('admin_action_failed'));
        } finally {
            setAccountActionBusyId('');
        }
    };

    const handleChangeUserRole = async (account) => {
        setOpenAccountMenuId(null);
        if (!account?.id) return;

        const currentRole = String(account?.role || 'USER').toUpperCase();
        const nextRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
        const note = window.prompt(
            t('admin_role_change_note_prompt'),
            nextRole === 'ADMIN' ? t('admin_role_change_note_promote_default') : t('admin_role_change_note_demote_default')
        );

        if (note === null) return;

        const adminPassword = requestAdminPassword();
        if (adminPassword === null) return;
        if (!adminPassword) return;

        setAccountActionBusyId(`role-${account.id}`);
        try {
            await axiosClient.put(`/admin/users/${account.id}/role`, {
                role: nextRole,
                reason: String(note || '').trim() || null,
                admin_password: adminPassword,
            });

            setActionMessage(nextRole === 'ADMIN' ? t('admin_role_promote_success') : t('admin_role_demote_success'));

            const isCurrentAccount = Number(account.id) === Number(user?.id);
            if (isCurrentAccount) {
                const updatedUser = {
                    ...user,
                    role: nextRole,
                };
                localStorage.setItem('gearbox_user', JSON.stringify(updatedUser));
            }

            await Promise.all([
                loadAdminAccountData(),
                loadNotifications(),
            ]);

            if (isCurrentAccount) {
                window.location.reload();
            }
        } catch (error) {
            setActionMessage(error?.response?.data?.message || t('admin_action_failed'));
        } finally {
            setAccountActionBusyId('');
        }
    };

    const filteredProjects = useMemo(() => filterProjectsByQuery(projects, search), [projects, search]);
    const recentProjectSource = isAdmin ? adminOwnedProjects : projects;
    const filteredRecentProjects = useMemo(() => filterProjectsByQuery(recentProjectSource, search), [recentProjectSource, search]);
    const unreadAdminActionLogs = useMemo(() => {
        return [...adminActionLogs]
            .filter((item) => !item?.is_read)
            .sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime())
            .slice(0, 8);
    }, [adminActionLogs]);
    const unreadAdminActionCount = unreadAdminActionLogs.length;

    const hasSearchQuery = Boolean(String(search || '').trim());
    const projectDisplayLimit = activeMenu === 'projects' || hasSearchQuery ? 20 : 4;
    const recentDisplayLimit = hasSearchQuery ? 20 : 4;
    const displayedProjects = filteredProjects.slice(0, projectDisplayLimit);
    const displayedRecentProjects = filteredRecentProjects.slice(0, recentDisplayLimit);

    const renderProjectMenu = (project, index) => {
        return (
            <div className="relative" onClick={(event) => event.stopPropagation()}>
                <button
                    type="button"
                    onClick={(event) => toggleProjectMenu(event, project, index)}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-500'}`}
                    aria-label="Project actions"
                >
                    <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                </button>
            </div>
        );
    };

    const renderFloatingProjectMenu = () => {
        if (!openProjectMenu) return null;

        return (
            <div
                className={`fixed w-40 rounded-xl border shadow-xl z-[1200] ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
                style={{
                    top: `${openProjectMenu.top}px`,
                    left: `${openProjectMenu.left}px`,
                }}
                onClick={(event) => event.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={() => handleEditProject(openProjectMenu.project, openProjectMenu.index)}
                    className={`w-full text-left px-3 py-2 text-sm font-medium ${isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                    {t('dashboard_edit_project')}
                </button>
                <button
                    type="button"
                    onClick={() => handleDeleteProject(openProjectMenu.project, openProjectMenu.index)}
                    className="w-full text-left px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
                >
                    {t('dashboard_delete_project')}
                </button>
                <button
                    type="button"
                    onClick={() => setOpenProjectMenu(null)}
                    className={`w-full text-left px-3 py-2 text-sm font-medium border-t ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                    {t('dashboard_cancel')}
                </button>
            </div>
        );
    };

    return (
        <div className={`flex min-h-screen font-sans ${isDark ? 'bg-[#070f23] text-slate-100' : 'bg-[#f8f9fa] text-[#191c1d]'}`}>
            {renderFloatingProjectMenu()}
            <aside className={`w-64 flex flex-col p-6 space-y-8 border-r ${isDark ? 'bg-slate-900 border-slate-700/70' : 'bg-[#f8f9fa] border-slate-200/60'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold">G</div>
                    <h1 className="text-lg font-bold tracking-tight">{t('app_brand_name')}</h1>
                </div>

                <nav className="flex flex-col gap-2 flex-1">
                    <button
                        type="button"
                        onClick={() => setActiveMenu('overview')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors text-left ${
                            activeMenu === 'overview'
                                ? 'bg-blue-50 text-blue-700'
                                : isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-slate-100' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                        }`}
                    >
                        <span className="material-symbols-outlined text-xl">grid_view</span>
                        {t('dashboard_overview')}
                    </button>

                    <button
                        type="button"
                        onClick={handleOpenProjects}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors text-left ${
                            activeMenu === 'projects'
                                ? 'bg-blue-50 text-blue-700'
                                : isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-slate-100' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                        }`}
                    >
                        <span className="material-symbols-outlined text-xl">folder</span>
                        {t('dashboard_my_projects')}
                    </button>

                    {isAdmin ? (
                        <button
                            type="button"
                            onClick={() => setActiveMenu('accounts')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors text-left ${
                                activeMenu === 'accounts'
                                    ? 'bg-blue-50 text-blue-700'
                                    : isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-slate-100' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                            }`}
                        >
                            <span className="material-symbols-outlined text-xl">manage_accounts</span>
                            {t('dashboard_user_accounts')}
                        </button>
                    ) : null}

                    {isAdmin ? (
                        <button
                            type="button"
                            onClick={() => navigate('/support')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors text-left ${
                                isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-slate-100' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                            }`}
                        >
                            <span className="material-symbols-outlined text-xl">support_agent</span>
                            {t('dashboard_user_support')}
                        </button>
                    ) : null}

                </nav>

                <div className="mt-auto space-y-3">
                    <button
                        type="button"
                        onClick={() => handleStartWizard()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
                    >
                        <span className="material-symbols-outlined text-xl">add</span>
                        {t('dashboard_new_project')}
                    </button>
                </div>
            </aside>

            <main className={`flex-1 flex flex-col px-8 py-6 ${isDark ? 'bg-[#070f23]' : 'bg-[#f8f9fa]'}`}>
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold tracking-tight">{greetingText}</h2>
                            {isAdmin ? <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">ADMIN</span> : null}
                        </div>
                        <p className={`text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                            {activeMenu === 'overview'
                                ? t('dashboard_overview_subtitle')
                                : activeMenu === 'accounts'
                                    ? t('dashboard_accounts_subtitle')
                                    : t('dashboard_projects_subtitle')}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button type="button" onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
                            <span className="material-symbols-outlined text-[18px]">{isDark ? 'light_mode' : 'dark_mode'}</span>
                        </button>

                        <div className="relative" onClick={(event) => event.stopPropagation()}>
                            <button
                                ref={notificationButtonRef}
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setNotificationDropdownOpen((prev) => !prev);
                                }}
                                className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full border ${unreadNoticeCount > 0 ? 'notification-bell-active' : ''} ${isDark ? 'border-slate-600 text-slate-100 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                                aria-label="Notifications"
                            >
                                <span className="material-symbols-outlined text-[18px]">notifications</span>
                            </button>

                            {notificationDropdownOpen ? (
                                <div ref={notificationDropdownRef} className={`absolute right-0 mt-2 w-96 max-w-[80vw] rounded-2xl border shadow-xl z-[1300] ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                                    <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                        <h3 className="text-sm font-bold">{t('dashboard_notifications')}</h3>
                                        {unreadNoticeCount > 0 ? <span className="text-xs font-semibold text-red-500">{unreadNoticeCount} {t('dashboard_unread')}</span> : null}
                                    </div>

                                    <div className="max-h-80 overflow-y-auto overscroll-contain p-2 space-y-2">
                                        {notificationPreviewItems.length === 0 ? (
                                            <p className={`px-3 py-4 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('dashboard_notifications_empty')}</p>
                                        ) : notificationPreviewItems.map((item) => {
                                            const isBusy = (
                                                notificationActionBusyId === `read-${item.id}`
                                                || notificationActionBusyId === `pin-${item.id}`
                                                || notificationActionBusyId === `del-${item.id}`
                                            );
                                            const notificationRoute = resolveNotificationRoute(item);
                                            const createdLabel = item?.createdAt ? new Date(item.createdAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') : '';

                                            return (
                                                <div key={item.id} className={`rounded-xl border px-3 py-2 text-xs ${item.is_read ? (isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500') : (isDark ? 'border-blue-700 bg-blue-950/40 text-slate-100' : 'border-blue-200 bg-blue-50 text-slate-700')}`}>
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                {item?.is_pinned ? <span className="material-symbols-outlined text-[14px] text-amber-500">keep</span> : null}
                                                                <p className="font-semibold truncate">{item.title}</p>
                                                            </div>
                                                            <p className="mt-1 whitespace-pre-wrap break-words">{item.message}</p>
                                                            {createdLabel ? <p className="mt-1 opacity-70">{createdLabel}</p> : null}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            {!item.is_read ? (
                                                                <button
                                                                    type="button"
                                                                    disabled={isBusy}
                                                                    onClick={() => markNoticeRead(item.id)}
                                                                    className="rounded-md px-1.5 py-1 text-blue-600 hover:bg-blue-100 disabled:opacity-60"
                                                                    title={t('dashboard_mark_read')}
                                                                >
                                                                    <span className="material-symbols-outlined text-[14px]">done</span>
                                                                </button>
                                                            ) : null}
                                                            {notificationRoute ? (
                                                                <button
                                                                    type="button"
                                                                    disabled={isBusy}
                                                                    onClick={() => openNotificationTarget(item)}
                                                                    className="rounded-md px-1.5 py-1 text-blue-600 hover:bg-blue-100 disabled:opacity-60"
                                                                    title={t('dashboard_open_notification_target')}
                                                                >
                                                                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                                                </button>
                                                            ) : null}
                                                            <button
                                                                type="button"
                                                                disabled={isBusy}
                                                                onClick={() => toggleNoticePin(item)}
                                                                className={`rounded-md px-1.5 py-1 disabled:opacity-60 ${item?.is_pinned ? 'text-amber-600 hover:bg-amber-100' : 'text-slate-500 hover:bg-slate-100'}`}
                                                                title={item?.is_pinned ? t('dashboard_unpin') : t('dashboard_pin')}
                                                            >
                                                                <span className="material-symbols-outlined text-[14px]">keep</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={isBusy}
                                                                onClick={() => removeNotice(item.id)}
                                                                className="rounded-md px-1.5 py-1 text-red-600 hover:bg-red-100 disabled:opacity-60"
                                                                title={t('dashboard_delete_notification')}
                                                            >
                                                                <span className="material-symbols-outlined text-[14px]">delete</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className={`px-3 py-2 border-t flex items-center justify-between gap-2 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                        <button
                                            type="button"
                                            disabled={notificationActionBusyId === 'read-all' || unreadNoticeCount === 0}
                                            onClick={markAllNoticeRead}
                                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-60"
                                        >
                                            {t('dashboard_mark_all_read')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleOpenNotificationsPage}
                                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                                        >
                                            {t('dashboard_expand_notifications')}
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div className="relative w-72">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M11 4a7 7 0 1 0 4.387 12.452l4.58 4.58a1 1 0 0 0 1.414-1.414l-4.58-4.58A7 7 0 0 0 11 4Zm-5 7a5 5 0 1 1 10 0a5 5 0 0 1-10 0Z" fill="currentColor" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder={t('dashboard_search_placeholder')}
                                className={`w-full rounded-xl border px-3 py-2.5 pl-11 text-sm outline-none transition-all ${isDark ? 'border-slate-600 bg-slate-800/90 text-slate-100 placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25' : 'border-slate-300 bg-white text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate('/assistant')}
                            className={`hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold ${isDark ? 'border-slate-600 text-slate-100 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                        >
                            <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                            {t('dashboard_ai')}
                        </button>

                        {!isAdmin ? (
                            <button
                                type="button"
                                onClick={() => navigate('/support')}
                                className={`hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold ${isDark ? 'border-slate-600 text-slate-100 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                            >
                                <span className="material-symbols-outlined text-[16px]">mail</span>
                                {t('dashboard_support')}
                            </button>
                        ) : null}

                        <div className="hidden md:block">
                            <UserMenu user={user} onNavigate={navigate} onLogout={handleLogout} />
                        </div>
                    </div>
                </header>

                {error ? (
                    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        {error}
                    </div>
                ) : null}

                {actionMessage ? (
                    <div className={`mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 transition-all duration-500 ease-out ${actionMessageVisible ? 'opacity-100 translate-y-0' : 'pointer-events-none -translate-y-1 opacity-0'}`}>
                        {actionMessage}
                    </div>
                ) : null}

                {activeMenu === 'overview' ? (
                    <>
                        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-transform hover:-translate-y-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                        <span className="material-symbols-outlined">engineering</span>
                                    </div>
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">TOTAL</span>
                                </div>
                                <h3 className="text-3xl font-bold mb-1">{stats.projects}</h3>
                                <p className="text-sm text-slate-500">{t('dashboard_total_projects')}</p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-transform hover:-translate-y-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                                        <span className="material-symbols-outlined">check_circle</span>
                                    </div>
                                </div>
                                <h3 className="text-3xl font-bold mb-1">{stats.analyses}</h3>
                                <p className="text-sm text-slate-500">{t('dashboard_completed_projects')}</p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-transform hover:-translate-y-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                                        <span className="material-symbols-outlined">{isAdmin ? 'groups' : 'folder_open'}</span>
                                    </div>
                                </div>
                                <h3 className="text-3xl font-bold mb-1">{isAdmin ? adminUsers.length : stats.exports}</h3>
                                <p className="text-sm text-slate-500">{isAdmin ? t('dashboard_total_users') : t('dashboard_saved_options')}</p>
                            </div>
                        </section>

                        <section id="recent-projects-section" className="pb-8">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold">{t('dashboard_recent_projects')}</h3>
                                <button type="button" onClick={handleOpenProjects} className="text-sm text-blue-600 font-medium hover:underline">
                                    {t('dashboard_view_all')}
                                </button>
                            </div>

                            {loading ? (
                                <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                                    {t('dashboard_loading_projects')}
                                </div>
                            ) : displayedRecentProjects.length === 0 ? (
                                <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                                    {t('dashboard_no_projects')}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    {displayedRecentProjects.map((project, index) => {
                                        const projectId = getProjectId(project, index);
                                        const projectName = project.project_name || project.name || `${t('dashboard_project_label')} #${projectId}`;
                                        const ownerName = project?.User?.username || project?.owner_username || '';
                                        const projectPower = project.power_P || 0;
                                        const projectSpeed = project.speed_n || 0;
                                        const progress = resolveProjectProgress(project);
                                        const completed = progress >= 100;

                                        return (
                                            <article
                                                key={projectId}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => handleStartWizard(projectId)}
                                                onKeyDown={(event) => handleProjectCardKeyDown(event, projectId)}
                                                className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col gap-4 group hover:shadow-md transition-all text-left cursor-pointer"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-lg group-hover:text-blue-600 transition-colors">{projectName}</h4>
                                                        <p className="text-xs text-slate-400 mt-1">{formatDate(project.updatedAt || project.createdAt)}</p>
                                                        {isAdmin && ownerName ? <p className="text-xs text-slate-500 mt-1">{t('dashboard_project_owner')}: {ownerName}</p> : null}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {renderProjectMenu(project, index)}
                                                        <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-600">arrow_forward</span>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4 mt-2">
                                                    <div className="bg-slate-50 px-3 py-2 rounded-lg flex-1">
                                                        <p className="text-[10px] text-slate-400 uppercase font-semibold">{t('dashboard_col_power')}</p>
                                                        <p className="text-sm font-bold text-slate-700">{projectPower} kW</p>
                                                    </div>
                                                    <div className="bg-slate-50 px-3 py-2 rounded-lg flex-1">
                                                        <p className="text-[10px] text-slate-400 uppercase font-semibold">{t('dashboard_col_speed')}</p>
                                                        <p className="text-sm font-bold text-slate-700">{projectSpeed} {language === 'vi' ? 'v/p' : 'rpm'}</p>
                                                    </div>
                                                </div>

                                                <div className="mt-2 flex items-center gap-2">
                                                    <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full ${completed ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }} />
                                                    </div>
                                                    <span className={`text-xs font-bold ${completed ? 'text-green-600' : 'text-slate-500'}`}>
                                                        {completed ? t('dashboard_completed') : `${progress}%`}
                                                    </span>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </>
                ) : activeMenu === 'accounts' ? (
                    <section className="pb-8 space-y-6">
                        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                                <h3 className="text-lg font-bold">{t('admin_accounts_title')}</h3>
                                <span className="text-xs text-slate-500">{adminUsers.length} {t('admin_accounts_total')}</span>
                            </div>

                            {loadingAccounts ? (
                                <div className="text-sm text-slate-500">{t('loading')}</div>
                            ) : adminUsers.length === 0 ? (
                                <div className="text-sm text-slate-500">{t('admin_accounts_empty')}</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500">{t('info_username')}</th>
                                                <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500">{t('info_email')}</th>
                                                <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500">{t('info_role')}</th>
                                                <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500">{t('admin_online_status')}</th>
                                                <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500">{t('admin_created_at')}</th>
                                                <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500">{t('admin_last_login')}</th>
                                                <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500">{t('admin_password_stored')}</th>
                                                <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500">{t('dashboard_col_action')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {adminUsers.map((account) => {
                                                const createdAtText = account?.createdAt ? new Date(account.createdAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') : '-';
                                                const lastLoginText = account?.last_login_at ? new Date(account.last_login_at).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') : '-';
                                                const revealedCredential = revealedCredentialByUserId[account.id];
                                                const maskedCredential = account?.password_mask || '********';
                                                const shownCredential = revealedCredential?.value || maskedCredential || '-';
                                                const credentialType = revealedCredential?.type || account?.password_type || 'HASH';
                                                const rowBusy = accountActionBusyId === `ban-${account.id}` || accountActionBusyId === `del-${account.id}` || accountActionBusyId === `reveal-${account.id}` || accountActionBusyId === `role-${account.id}`;

                                                return (
                                                    <tr key={account.id}>
                                                        <td className="px-4 py-3">
                                                            <p className="font-semibold text-slate-800">{account.username}</p>
                                                            {account?.ban_reason ? <p className="mt-1 text-xs text-red-600">{t('admin_ban_reason_label')}: {account.ban_reason}</p> : null}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">{account.email || '-'}</td>
                                                        <td className="px-4 py-3 text-sm">
                                                            <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${String(account.role || '').toUpperCase() === 'ADMIN' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                                                                {String(account.role || '').toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">
                                                            <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${account?.is_online ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                                {account?.is_online ? t('admin_online') : t('admin_offline')}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-slate-600">{createdAtText}</td>
                                                        <td className="px-4 py-3 text-xs text-slate-600">{lastLoginText}</td>
                                                        <td className="px-4 py-3 text-xs text-slate-600 max-w-[220px]">
                                                            <p className="truncate" title={shownCredential}>{shownCredential || '-'}</p>
                                                            <p className="mt-1 text-[10px] uppercase text-slate-400">{credentialType}</p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="relative inline-flex" onClick={(event) => event.stopPropagation()}>
                                                                <button
                                                                    type="button"
                                                                    disabled={rowBusy}
                                                                    onClick={() => setOpenAccountMenuId((prev) => (prev === account.id ? null : account.id))}
                                                                    className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
                                                                    aria-label="Account actions"
                                                                >
                                                                    <span className="material-symbols-outlined text-[16px]">more_horiz</span>
                                                                </button>

                                                                {openAccountMenuId === account.id ? (
                                                                    <div className={`absolute right-0 top-8 z-[1300] min-w-[180px] rounded-xl border shadow-lg ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                                                                        <button
                                                                            type="button"
                                                                            disabled={rowBusy || Number(account?.id) === Number(user?.id)}
                                                                            onClick={() => handleChangeUserRole(account)}
                                                                            className={`w-full text-left px-3 py-2 text-xs font-semibold disabled:opacity-60 ${isDark ? 'text-slate-100 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50'}`}
                                                                        >
                                                                            {String(account?.role || '').toUpperCase() === 'ADMIN' ? t('admin_set_user') : t('admin_set_admin')}
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            disabled={rowBusy || !account?.has_password}
                                                                            onClick={() => handleRevealCredential(account)}
                                                                            className={`w-full text-left px-3 py-2 text-xs font-semibold disabled:opacity-60 ${isDark ? 'text-slate-100 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50'}`}
                                                                        >
                                                                            {revealedCredential ? t('admin_hide_password') : t('admin_reveal_password')}
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            disabled={rowBusy}
                                                                            onClick={() => handleToggleBanUser(account)}
                                                                            className="w-full text-left px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                                                                        >
                                                                            {account?.is_banned ? t('admin_unban') : t('admin_ban')}
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            disabled={rowBusy || Number(account?.id) === Number(user?.id)}
                                                                            onClick={() => handleDeleteUser(account)}
                                                                            className="w-full text-left px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                                                                        >
                                                                            {t('admin_delete_account')}
                                                                        </button>
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold">{t('admin_audit_logs_title')}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">{unreadAdminActionCount} {t('admin_logs_unread')}</span>
                                    <button
                                        type="button"
                                        onClick={handleOpenAdminAuditLogPage}
                                        className="text-xs font-semibold text-blue-600 hover:underline"
                                    >
                                        {t('admin_logs_view_full')}
                                    </button>
                                </div>
                            </div>

                            <div className="mb-3 flex justify-end">
                                <button
                                    type="button"
                                    disabled={adminLogActionBusyId === 'read-all' || unreadAdminActionCount === 0}
                                    onClick={markAllAdminLogsRead}
                                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                >
                                    {t('admin_logs_mark_all_read')}
                                </button>
                            </div>

                            {unreadAdminActionLogs.length === 0 ? (
                                <div className="text-sm text-slate-500">{t('admin_logs_empty_unread')}</div>
                            ) : (
                                <div className="space-y-2">
                                    {unreadAdminActionLogs.map((log) => (
                                        <div key={log.id} className="rounded-xl border border-blue-200 bg-blue-50/40 px-3 py-2">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <p className="text-sm font-semibold text-slate-800">{log.action_type}</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs text-slate-500">{log.createdAt ? new Date(log.createdAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') : '-'}</p>
                                                    <button
                                                        type="button"
                                                        disabled={adminLogActionBusyId === `read-${log.id}`}
                                                        onClick={() => markAdminLogRead(log.id)}
                                                        className="rounded-md px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                                                    >
                                                        {t('admin_logs_mark_read')}
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-600 mt-1">
                                                {t('admin_log_actor')}: {log.admin_username || '-'} | {t('admin_log_target')}: {log.target_username || log.target_project_name || '-'}
                                            </p>
                                            {log.reason ? <p className="text-xs text-slate-700 mt-1">{t('admin_log_reason')}: {log.reason}</p> : null}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                ) : (
                    <section className="pb-8">
                        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                                <h3 className="text-lg font-bold">{t('dashboard_manage_projects')}</h3>
                                <span className="text-xs text-slate-500">{displayedProjects.length} {t('dashboard_projects_displayed')}</span>
                            </div>

                            {loading ? (
                                <div className="text-sm text-slate-500">{t('dashboard_loading_projects')}</div>
                            ) : displayedProjects.length === 0 ? (
                                <div className="text-sm text-slate-500">{t('dashboard_empty_search')}</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500">{t('dashboard_col_project_name')}</th>
                                                {isAdmin ? <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500">{t('dashboard_col_owner')}</th> : null}
                                                <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500">{t('dashboard_col_power')}</th>
                                                <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500">{t('dashboard_col_speed')}</th>
                                                <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500">{t('dashboard_col_action')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {displayedProjects.map((project, index) => {
                                                const projectId = getProjectId(project, index);
                                                const projectName = project.project_name || project.name || `${t('dashboard_project_label')} #${projectId}`;
                                                const ownerName = project?.User?.username || project?.owner_username || t('dashboard_owner_unknown');
                                                return (
                                                    <tr key={projectId}>
                                                        <td className="px-4 py-3">
                                                            <p className="font-semibold text-slate-800">{projectName}</p>
                                                            <p className="text-xs text-slate-500 mt-1">{formatDate(project.updatedAt || project.createdAt)}</p>
                                                        </td>
                                                        {isAdmin ? <td className="px-4 py-3 text-sm">{ownerName}</td> : null}
                                                        <td className="px-4 py-3 text-sm">{project.power_P || 0} kW</td>
                                                        <td className="px-4 py-3 text-sm">{project.speed_n || 0} {language === 'vi' ? 'v/p' : 'rpm'}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStartWizard(projectId)}
                                                                    className="text-sm font-semibold text-blue-600 hover:underline"
                                                                >
                                                                    {t('dashboard_open_wizard')}
                                                                </button>
                                                                {renderProjectMenu(project, index)}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};

export default Dashboard;