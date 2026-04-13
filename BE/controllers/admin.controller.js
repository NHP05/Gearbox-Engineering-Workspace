const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const Project = require('../models/project.model');
const DesignVariant = require('../models/variant.model');
const AdminActionLog = require('../models/admin_action_log.model');
const DeletedAccount = require('../models/deleted_account.model');
const {
    mockUsers,
    mockProjects,
    mockVariants,
    mockAdminActionLogs,
    mockDeletedAccounts,
} = require('../utils/mockData');
const { createUserNotification } = require('../services/notification.service');

const SKIP_DB = process.env.SKIP_DB === 'true';
const ONLINE_WINDOW_MS = 5 * 60 * 1000;

const toRole = (value) => String(value || 'USER').toUpperCase();
const toLanguage = (value) => (String(value || '').toLowerCase() === 'en' ? 'en' : 'vi');
const byLanguage = (language, vi, en) => (toLanguage(language) === 'en' ? en : vi);
const toOptionalLanguage = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'en' || normalized === 'vi') return normalized;
    return null;
};

const toOptionalBoolean = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return null;
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
    if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
    return null;
};

const resolveRequestLanguage = (req) => {
    return toOptionalLanguage(
        req?.headers?.['x-client-language']
        || req?.headers?.['x-language']
        || req?.body?.language
        || req?.query?.language
    );
};
const roleLabelByLanguage = (role, language) => {
    const normalized = toRole(role);
    if (toLanguage(language) === 'en') {
        return normalized === 'ADMIN' ? 'Administrator' : 'User';
    }
    return normalized === 'ADMIN' ? 'Quản trị viên' : 'Người dùng';
};

const toDateOrNull = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isOnlineByLastSeen = (lastSeenAt) => {
    const parsed = toDateOrNull(lastSeenAt);
    if (!parsed) return false;
    return (Date.now() - parsed.getTime()) <= ONLINE_WINDOW_MS;
};

const nextMockId = (collection = []) => {
    if (!collection.length) return 1;
    return Math.max(...collection.map((item) => Number(item.id) || 0)) + 1;
};

const resolveAdminIdentity = async (req) => {
    const adminId = Number(req.user?.id) || 0;
    const fromToken = String(req.user?.username || '').trim();
    if (fromToken) {
        return { adminId, adminUsername: fromToken };
    }

    if (SKIP_DB) {
        const found = mockUsers.find((item) => Number(item.id) === adminId);
        return { adminId, adminUsername: found?.username || `admin#${adminId}` };
    }

    const found = await User.findByPk(adminId);
    return { adminId, adminUsername: found?.username || `admin#${adminId}` };
};

const resolveUserLanguage = async (userId, fallback = 'vi') => {
    const id = Number(userId);
    if (!Number.isFinite(id) || id <= 0) return toLanguage(fallback);

    if (SKIP_DB) {
        const found = mockUsers.find((item) => Number(item.id) === id);
        return toLanguage(found?.language || fallback);
    }

    const found = await User.findByPk(id, { attributes: ['language'] });
    return toLanguage(found?.language || fallback);
};

const verifyPasswordValue = async (plainPassword, user) => {
    const candidate = String(plainPassword || '');
    if (!candidate) return false;

    if (user?.password_hash) {
        try {
            const matched = await bcrypt.compare(candidate, user.password_hash);
            if (matched) {
                return true;
            }
        } catch (error) {
            // Ignore malformed hash from legacy environments.
        }
    }

    if (user?.password_plain) {
        return candidate === String(user.password_plain);
    }

    return false;
};

const ensureAdminPasswordConfirmed = async (req) => {
    const adminPassword = String(req.body?.admin_password || '').trim();
    const adminId = Number(req.user?.id) || 0;

    if (!adminId) {
        return { ok: false, status: 401, message: 'Unauthorized.' };
    }

    if (!adminPassword) {
        return { ok: false, status: 400, message: 'Admin password is required.' };
    }

    const adminUser = SKIP_DB
        ? mockUsers.find((item) => Number(item.id) === Number(adminId))
        : await User.findByPk(adminId);

    if (!adminUser) {
        return { ok: false, status: 401, message: 'Admin account not found.' };
    }

    const role = toRole(adminUser.role || req.user?.role);
    if (role !== 'ADMIN') {
        return { ok: false, status: 403, message: 'Admin permission required.' };
    }

    const matched = await verifyPasswordValue(adminPassword, adminUser);
    if (!matched) {
        return { ok: false, status: 401, message: 'Admin password confirmation failed.' };
    }

    return { ok: true, adminUser };
};

const createAdminActionLog = async ({
    adminUserId,
    adminUsername,
    actionType,
    targetUserId = null,
    targetUsername = null,
    targetProjectId = null,
    targetProjectName = null,
    reason = null,
    payload = null,
}) => {
    if (!adminUserId || !actionType) return null;

    if (SKIP_DB) {
        const item = {
            id: nextMockId(mockAdminActionLogs),
            admin_user_id: Number(adminUserId),
            admin_username: adminUsername || 'admin',
            action_type: actionType,
            target_user_id: targetUserId ? Number(targetUserId) : null,
            target_username: targetUsername || null,
            target_project_id: targetProjectId ? Number(targetProjectId) : null,
            target_project_name: targetProjectName || null,
            reason: reason || null,
            payload: payload || null,
            is_read: false,
            read_at: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        mockAdminActionLogs.unshift(item);
        return item;
    }

    return AdminActionLog.create({
        admin_user_id: Number(adminUserId),
        admin_username: adminUsername || 'admin',
        action_type: actionType,
        target_user_id: targetUserId ? Number(targetUserId) : null,
        target_username: targetUsername || null,
        target_project_id: targetProjectId ? Number(targetProjectId) : null,
        target_project_name: targetProjectName || null,
        reason: reason || null,
        payload: payload || null,
        is_read: false,
        read_at: null,
    });
};

const normalizeAdminActionLog = (item) => {
    const row = item && typeof item.toJSON === 'function' ? item.toJSON() : { ...(item || {}) };
    return {
        ...row,
        is_read: Boolean(row.is_read),
        read_at: row.read_at || null,
    };
};

const createDeletedAccountRecord = async ({
    originalUserId,
    username,
    email,
    deletedByUserId,
    deletedByUsername,
    reason,
    metadata,
}) => {
    if (!username || !deletedByUserId) return null;

    if (SKIP_DB) {
        const row = {
            id: nextMockId(mockDeletedAccounts),
            original_user_id: originalUserId || null,
            username,
            email: email || null,
            deleted_by_user_id: Number(deletedByUserId),
            deleted_by_username: deletedByUsername || 'admin',
            reason: reason || null,
            metadata: metadata || null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        mockDeletedAccounts.unshift(row);
        return row;
    }

    return DeletedAccount.create({
        original_user_id: originalUserId || null,
        username,
        email: email || null,
        deleted_by_user_id: Number(deletedByUserId),
        deleted_by_username: deletedByUsername || 'admin',
        reason: reason || null,
        metadata: metadata || null,
    });
};

const listUsers = async (req, res) => {
    try {
        if (SKIP_DB) {
            const users = mockUsers.map((item) => ({
                id: item.id,
                username: item.username,
                email: item.email || '',
                role: toRole(item.role),
                is_banned: Boolean(item.is_banned),
                ban_reason: item.ban_reason || null,
                banned_by: item.banned_by || null,
                banned_at: item.banned_at || null,
                last_login_at: item.last_login_at || null,
                last_seen_at: item.last_seen_at || null,
                is_online: isOnlineByLastSeen(item.last_seen_at),
                has_password: Boolean(item.password_hash || item.password_plain),
                password_mask: item.password_hash || item.password_plain ? '********' : '',
                password_type: item.password_plain ? 'PLAIN' : (item.password_hash ? 'HASH' : 'NONE'),
                createdAt: item.createdAt || new Date(),
                updatedAt: item.updatedAt || new Date(),
            }));
            return res.status(200).json({ success: true, data: users });
        }

        const users = await User.findAll({
            attributes: [
                'id',
                'username',
                'email',
                'role',
                'is_banned',
                'ban_reason',
                'banned_by',
                'banned_at',
                'last_login_at',
                'last_seen_at',
                'password_hash',
                'password_plain',
                'createdAt',
                'updatedAt',
            ],
            order: [['createdAt', 'DESC']],
        });

        const normalized = users.map((item) => {
            const row = item.toJSON();
            const { password_hash, password_plain, ...safeRow } = row;
            const hasPlainPassword = Boolean(password_plain);
            const hasHashPassword = Boolean(password_hash);

            return {
                ...safeRow,
                role: toRole(row.role),
                is_online: isOnlineByLastSeen(row.last_seen_at),
                has_password: hasPlainPassword || hasHashPassword,
                password_mask: hasPlainPassword || hasHashPassword ? '********' : '',
                password_type: hasPlainPassword ? 'PLAIN' : (hasHashPassword ? 'HASH' : 'NONE'),
            };
        });

        return res.status(200).json({ success: true, data: normalized });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const listAdminActionLogs = async (req, res) => {
    try {
        const requestedLimit = Number(req.query?.limit);
        const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
            ? Math.min(Math.round(requestedLimit), 1000)
            : 200;
        const unreadOnly = toOptionalBoolean(req.query?.unread_only) === true;

        if (SKIP_DB) {
            const rows = [...mockAdminActionLogs]
                .filter((item) => (unreadOnly ? !Boolean(item?.is_read) : true))
                .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                .slice(0, limit)
                .map((item) => normalizeAdminActionLog(item));
            return res.status(200).json({ success: true, data: rows });
        }

        const where = unreadOnly ? { is_read: false } : undefined;
        const rows = await AdminActionLog.findAll({
            where,
            order: [['createdAt', 'DESC']],
            limit,
        });

        return res.status(200).json({ success: true, data: rows.map((item) => normalizeAdminActionLog(item)) });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const markAdminActionLogRead = async (req, res) => {
    try {
        const logId = Number(req.params?.id);
        if (!Number.isFinite(logId) || logId <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid log id.' });
        }

        if (SKIP_DB) {
            const found = mockAdminActionLogs.find((item) => Number(item.id) === logId);
            if (!found) {
                return res.status(404).json({ success: false, message: 'Action log not found.' });
            }

            found.is_read = true;
            found.read_at = new Date();
            found.updatedAt = new Date();

            return res.status(200).json({
                success: true,
                message: 'Action log marked as read.',
                data: normalizeAdminActionLog(found),
            });
        }

        const found = await AdminActionLog.findByPk(logId);
        if (!found) {
            return res.status(404).json({ success: false, message: 'Action log not found.' });
        }

        found.is_read = true;
        found.read_at = new Date();
        await found.save();

        return res.status(200).json({
            success: true,
            message: 'Action log marked as read.',
            data: normalizeAdminActionLog(found),
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const markAllAdminActionLogsRead = async (req, res) => {
    try {
        if (SKIP_DB) {
            let updated = 0;
            const now = new Date();

            mockAdminActionLogs.forEach((item) => {
                if (!Boolean(item?.is_read)) {
                    item.is_read = true;
                    item.read_at = now;
                    item.updatedAt = now;
                    updated += 1;
                }
            });

            return res.status(200).json({
                success: true,
                message: 'All action logs marked as read.',
                data: { updated },
            });
        }

        const [updated] = await AdminActionLog.update(
            {
                is_read: true,
                read_at: new Date(),
            },
            {
                where: { is_read: false },
            }
        );

        return res.status(200).json({
            success: true,
            message: 'All action logs marked as read.',
            data: { updated: Number(updated || 0) },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const banUser = async (req, res) => {
    try {
        const confirmation = await ensureAdminPasswordConfirmed(req);
        if (!confirmation.ok) {
            return res.status(confirmation.status).json({ success: false, message: confirmation.message });
        }

        const { adminId, adminUsername } = await resolveAdminIdentity(req);
        const userId = Number(req.params?.id);
        const banned = Boolean(req.body?.banned);
        const reason = String(req.body?.reason || '').trim();

        if (!Number.isFinite(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user id.' });
        }

        if (banned && !reason) {
            return res.status(400).json({ success: false, message: 'Reason is required when banning an account.' });
        }

        if (adminId === userId) {
            return res.status(400).json({ success: false, message: 'Admin cannot ban current account.' });
        }

        let payload;

        if (SKIP_DB) {
            const target = mockUsers.find((item) => Number(item.id) === userId);
            if (!target) {
                return res.status(404).json({ success: false, message: 'User not found.' });
            }
            target.is_banned = banned;
            target.ban_reason = banned ? reason : null;
            target.banned_by = banned ? adminId : null;
            target.banned_at = banned ? new Date() : null;
            target.updatedAt = new Date();
            payload = {
                id: target.id,
                username: target.username,
                role: toRole(target.role),
                is_banned: Boolean(target.is_banned),
                ban_reason: target.ban_reason,
            };
        } else {
            const target = await User.findByPk(userId);
            if (!target) {
                return res.status(404).json({ success: false, message: 'User not found.' });
            }
            target.is_banned = banned;
            target.ban_reason = banned ? reason : null;
            target.banned_by = banned ? adminId : null;
            target.banned_at = banned ? new Date() : null;
            await target.save();
            payload = {
                id: target.id,
                username: target.username,
                role: toRole(target.role),
                is_banned: Boolean(target.is_banned),
                ban_reason: target.ban_reason,
            };
        }

        await createAdminActionLog({
            adminUserId: adminId,
            adminUsername,
            actionType: banned ? 'BAN_USER' : 'UNBAN_USER',
            targetUserId: payload.id,
            targetUsername: payload.username,
            reason: reason || null,
            payload,
        });

        const targetLanguage = await resolveUserLanguage(userId);
        const adminLanguage = resolveRequestLanguage(req) || await resolveUserLanguage(adminId);

        await createUserNotification({
            userId,
            type: banned ? 'USER_BANNED' : 'USER_UNBANNED',
            title: banned
                ? byLanguage(targetLanguage, 'Tài khoản bị hạn chế truy cập', 'Account access restricted')
                : byLanguage(targetLanguage, 'Tài khoản đã được mở lại', 'Account access restored'),
            message: banned
                ? byLanguage(
                    targetLanguage,
                    `Tài khoản của bạn đã bị quản trị viên hạn chế truy cập.${reason ? ` Lý do: ${reason}` : ''}`,
                    `An administrator has restricted your account.${reason ? ` Reason: ${reason}` : ''}`
                )
                : byLanguage(
                    targetLanguage,
                    'Tài khoản của bạn đã được quản trị viên mở lại quyền truy cập.',
                    'Your account access has been restored by an administrator.'
                ),
            metadata: {
                actionBy: adminId,
                reason: reason || null,
            },
        });

        await createUserNotification({
            userId: adminId,
            type: 'ADMIN_AUDIT',
            title: banned
                ? byLanguage(adminLanguage, 'Đã ghi nhận thao tác cấm tài khoản', 'Ban action recorded')
                : byLanguage(adminLanguage, 'Đã ghi nhận thao tác bỏ cấm tài khoản', 'Unban action recorded'),
            message: banned
                ? byLanguage(
                    adminLanguage,
                    `Đã cấm tài khoản ${payload.username}.${reason ? ` Lý do: ${reason}` : ''}`,
                    `Banned account ${payload.username}.${reason ? ` Reason: ${reason}` : ''}`
                )
                : byLanguage(
                    adminLanguage,
                    `Đã bỏ cấm tài khoản ${payload.username}.${reason ? ` Lý do: ${reason}` : ''}`,
                    `Unbanned account ${payload.username}.${reason ? ` Reason: ${reason}` : ''}`
                ),
            metadata: {
                actionType: banned ? 'BAN_USER' : 'UNBAN_USER',
                targetUserId: payload.id,
                targetUsername: payload.username,
                reason: reason || null,
            },
        });

        return res.status(200).json({
            success: true,
            message: banned ? 'User has been banned.' : 'User has been unbanned.',
            data: payload,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const listProjects = async (req, res) => {
    try {
        if (SKIP_DB) {
            const rows = mockProjects.map((project) => {
                const owner = mockUsers.find((item) => Number(item.id) === Number(project.user_id));
                return {
                    ...project,
                    User: owner ? {
                        id: owner.id,
                        username: owner.username,
                        email: owner.email || null,
                        role: toRole(owner.role),
                    } : null,
                };
            });
            return res.status(200).json({ success: true, data: rows });
        }

        const projects = await Project.findAll({
            include: [{
                model: User,
                attributes: ['id', 'username', 'email'],
            }],
            order: [['createdAt', 'DESC']],
        });

        return res.status(200).json({ success: true, data: projects });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteProjectAsAdmin = async (req, res) => {
    try {
        const confirmation = await ensureAdminPasswordConfirmed(req);
        if (!confirmation.ok) {
            return res.status(confirmation.status).json({ success: false, message: confirmation.message });
        }

        const { adminId, adminUsername } = await resolveAdminIdentity(req);
        const projectId = Number(req.params?.id);
        const reason = String(req.body?.reason || '').trim();

        if (!Number.isFinite(projectId)) {
            return res.status(400).json({ success: false, message: 'Invalid project id.' });
        }

        if (!reason) {
            return res.status(400).json({ success: false, message: 'Reason is required when deleting a project.' });
        }

        let ownerId = null;
        let projectName = '';
        let ownerName = null;

        if (SKIP_DB) {
            const idx = mockProjects.findIndex((item) => Number(item.id) === projectId);
            if (idx < 0) {
                return res.status(404).json({ success: false, message: 'Project not found.' });
            }

            const [removed] = mockProjects.splice(idx, 1);
            ownerId = Number(removed.user_id);
            projectName = removed.project_name;
            ownerName = mockUsers.find((item) => Number(item.id) === ownerId)?.username || null;

            for (let i = mockVariants.length - 1; i >= 0; i -= 1) {
                if (Number(mockVariants[i].project_id) === projectId) {
                    mockVariants.splice(i, 1);
                }
            }
        } else {
            const project = await Project.findByPk(projectId);
            if (!project) {
                return res.status(404).json({ success: false, message: 'Project not found.' });
            }

            ownerId = Number(project.user_id);
            projectName = project.project_name;
            ownerName = project?.User?.username || null;
            await DesignVariant.destroy({ where: { project_id: projectId } });
            await project.destroy();
        }

        await createAdminActionLog({
            adminUserId: adminId,
            adminUsername,
            actionType: 'DELETE_PROJECT',
            targetUserId: ownerId || null,
            targetUsername: ownerName,
            targetProjectId: projectId,
            targetProjectName: projectName,
            reason,
            payload: {
                ownerId,
                ownerName,
            },
        });

        const ownerLanguage = ownerId ? await resolveUserLanguage(ownerId) : 'vi';
        const adminLanguage = resolveRequestLanguage(req) || await resolveUserLanguage(adminId);

        if (ownerId && Number(ownerId) !== Number(adminId)) {
            await createUserNotification({
                userId: ownerId,
                type: 'PROJECT_DELETED',
                title: byLanguage(ownerLanguage, 'Đồ án đã bị quản trị viên xóa', 'Project removed by admin'),
                message: byLanguage(
                    ownerLanguage,
                    `Đồ án \"${projectName}\" của bạn đã bị quản trị viên xóa. Lý do: ${reason}`,
                    `Your project \"${projectName}\" was removed by an administrator. Reason: ${reason}`
                ),
                metadata: {
                    projectId,
                    actionBy: adminId,
                    reason,
                },
            });
        }

        await createUserNotification({
            userId: adminId,
            type: 'ADMIN_AUDIT',
            title: byLanguage(adminLanguage, 'Đã ghi nhận thao tác xóa đồ án', 'Project delete action recorded'),
            message: byLanguage(
                adminLanguage,
                `Đã xóa đồ án \"${projectName}\".${reason ? ` Lý do: ${reason}` : ''}`,
                `Deleted project \"${projectName}\".${reason ? ` Reason: ${reason}` : ''}`
            ),
            metadata: {
                actionType: 'DELETE_PROJECT',
                projectId,
                projectName,
                ownerId,
                ownerName,
                reason,
            },
        });

        return res.status(200).json({ success: true, message: 'Project deleted.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteUserAsAdmin = async (req, res) => {
    try {
        const confirmation = await ensureAdminPasswordConfirmed(req);
        if (!confirmation.ok) {
            return res.status(confirmation.status).json({ success: false, message: confirmation.message });
        }

        const { adminId, adminUsername } = await resolveAdminIdentity(req);
        const userId = Number(req.params?.id);
        const reason = String(req.body?.reason || '').trim();
        const adminLanguage = resolveRequestLanguage(req) || await resolveUserLanguage(adminId);

        if (!Number.isFinite(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user id.' });
        }

        if (!reason) {
            return res.status(400).json({ success: false, message: 'Reason is required when deleting an account.' });
        }

        if (adminId === userId) {
            return res.status(400).json({ success: false, message: 'Admin cannot delete current account.' });
        }

        if (SKIP_DB) {
            const idx = mockUsers.findIndex((item) => Number(item.id) === userId);
            if (idx < 0) {
                return res.status(404).json({ success: false, message: 'User not found.' });
            }

            const target = mockUsers[idx];
            await createDeletedAccountRecord({
                originalUserId: target.id,
                username: target.username,
                email: target.email || null,
                deletedByUserId: adminId,
                deletedByUsername: adminUsername,
                reason,
                metadata: {
                    role: toRole(target.role),
                    projectsOwned: mockProjects.filter((item) => Number(item.user_id) === Number(target.id)).length,
                },
            });

            mockUsers.splice(idx, 1);
            for (let i = mockProjects.length - 1; i >= 0; i -= 1) {
                if (Number(mockProjects[i].user_id) === userId) {
                    const removedProjectId = Number(mockProjects[i].id);
                    mockProjects.splice(i, 1);
                    for (let j = mockVariants.length - 1; j >= 0; j -= 1) {
                        if (Number(mockVariants[j].project_id) === removedProjectId) {
                            mockVariants.splice(j, 1);
                        }
                    }
                }
            }

            await createAdminActionLog({
                adminUserId: adminId,
                adminUsername,
                actionType: 'DELETE_USER',
                targetUserId: target.id,
                targetUsername: target.username,
                reason,
                payload: {
                    email: target.email || null,
                    role: toRole(target.role),
                },
            });

            await createUserNotification({
                userId: adminId,
                type: 'ADMIN_AUDIT',
                title: byLanguage(adminLanguage, 'Đã ghi nhận thao tác xóa tài khoản', 'User delete action recorded'),
                message: byLanguage(
                    adminLanguage,
                    `Đã xóa tài khoản ${target.username}.${reason ? ` Lý do: ${reason}` : ''}`,
                    `Deleted account ${target.username}.${reason ? ` Reason: ${reason}` : ''}`
                ),
                metadata: {
                    actionType: 'DELETE_USER',
                    targetUserId: target.id,
                    targetUsername: target.username,
                    reason,
                },
            });

            return res.status(200).json({ success: true, message: 'User deleted.' });
        }

        const target = await User.findByPk(userId);
        if (!target) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        await createDeletedAccountRecord({
            originalUserId: target.id,
            username: target.username,
            email: target.email || null,
            deletedByUserId: adminId,
            deletedByUsername: adminUsername,
            reason,
            metadata: {
                role: toRole(target.role),
                createdAt: target.createdAt,
                lastLoginAt: target.last_login_at,
            },
        });

        await target.destroy();

        await createAdminActionLog({
            adminUserId: adminId,
            adminUsername,
            actionType: 'DELETE_USER',
            targetUserId: userId,
            targetUsername: target.username,
            reason,
            payload: {
                email: target.email || null,
                role: toRole(target.role),
            },
        });

        await createUserNotification({
            userId: adminId,
            type: 'ADMIN_AUDIT',
            title: byLanguage(adminLanguage, 'Đã ghi nhận thao tác xóa tài khoản', 'User delete action recorded'),
            message: byLanguage(
                adminLanguage,
                `Đã xóa tài khoản ${target.username}.${reason ? ` Lý do: ${reason}` : ''}`,
                `Deleted account ${target.username}.${reason ? ` Reason: ${reason}` : ''}`
            ),
            metadata: {
                actionType: 'DELETE_USER',
                targetUserId: target.id,
                targetUsername: target.username,
                reason,
            },
        });

        return res.status(200).json({ success: true, message: 'User deleted.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const revealUserPassword = async (req, res) => {
    try {
        const confirmation = await ensureAdminPasswordConfirmed(req);
        if (!confirmation.ok) {
            return res.status(confirmation.status).json({ success: false, message: confirmation.message });
        }

        const { adminId, adminUsername } = await resolveAdminIdentity(req);
        const targetUserId = Number(req.params?.id);

        if (!Number.isFinite(targetUserId)) {
            return res.status(400).json({ success: false, message: 'Invalid user id.' });
        }

        const target = SKIP_DB
            ? mockUsers.find((item) => Number(item.id) === Number(targetUserId))
            : await User.findByPk(targetUserId);

        if (!target) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const rawValue = String(target?.password_plain || '').trim();
        if (!rawValue) {
            return res.status(404).json({ success: false, message: 'Credential is not available.' });
        }

        const credentialType = 'PLAIN';

        await createAdminActionLog({
            adminUserId: adminId,
            adminUsername,
            actionType: 'VIEW_USER_CREDENTIAL',
            targetUserId: target.id,
            targetUsername: target.username,
            reason: String(req.body?.reason || '').trim() || null,
            payload: {
                credentialType,
            },
        });

        return res.status(200).json({
            success: true,
            data: {
                user_id: target.id,
                username: target.username,
                credential_type: credentialType,
                credential_value: rawValue,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const changeUserRole = async (req, res) => {
    try {
        const confirmation = await ensureAdminPasswordConfirmed(req);
        if (!confirmation.ok) {
            return res.status(confirmation.status).json({ success: false, message: confirmation.message });
        }

        const { adminId, adminUsername } = await resolveAdminIdentity(req);
        const targetUserId = Number(req.params?.id);
        const nextRole = toRole(req.body?.role);

        if (!Number.isFinite(targetUserId)) {
            return res.status(400).json({ success: false, message: 'Invalid user id.' });
        }

        if (Number(adminId) === Number(targetUserId)) {
            return res.status(400).json({ success: false, message: 'Admin cannot change current account role.' });
        }

        if (!['ADMIN', 'USER'].includes(nextRole)) {
            return res.status(400).json({ success: false, message: 'Role must be ADMIN or USER.' });
        }

        if (SKIP_DB) {
            const target = mockUsers.find((item) => Number(item.id) === Number(targetUserId));
            if (!target) {
                return res.status(404).json({ success: false, message: 'User not found.' });
            }

            const prevRole = toRole(target.role);
            if (prevRole === nextRole) {
                return res.status(200).json({
                    success: true,
                    message: 'Role is unchanged.',
                    data: {
                        id: target.id,
                        username: target.username,
                        role: prevRole,
                    },
                });
            }

            target.role = nextRole;
            target.updatedAt = new Date();

            await createAdminActionLog({
                adminUserId: adminId,
                adminUsername,
                actionType: nextRole === 'ADMIN' ? 'PROMOTE_USER' : 'DEMOTE_ADMIN',
                targetUserId: target.id,
                targetUsername: target.username,
                reason: String(req.body?.reason || '').trim() || null,
                payload: {
                    previousRole: prevRole,
                    nextRole,
                },
            });

            const targetLanguage = await resolveUserLanguage(target.id);
            const adminLanguage = resolveRequestLanguage(req) || await resolveUserLanguage(adminId);

            await createUserNotification({
                userId: target.id,
                type: 'ROLE_CHANGED',
                title: byLanguage(targetLanguage, 'Vai trò tài khoản đã được cập nhật', 'Account role updated'),
                message: byLanguage(
                    targetLanguage,
                    `Vai trò tài khoản của bạn đã được đổi thành ${roleLabelByLanguage(nextRole, targetLanguage)} bởi quản trị viên.`,
                    `Your account role has been changed to ${roleLabelByLanguage(nextRole, targetLanguage)} by an administrator.`
                ),
                metadata: {
                    previousRole: prevRole,
                    nextRole,
                    changedBy: adminId,
                },
            });

            await createUserNotification({
                userId: adminId,
                type: 'ADMIN_AUDIT',
                title: byLanguage(adminLanguage, 'Đã ghi nhận thao tác đổi vai trò', 'Role change action recorded'),
                message: byLanguage(
                    adminLanguage,
                    `Đã đổi vai trò của ${target.username} từ ${roleLabelByLanguage(prevRole, adminLanguage)} sang ${roleLabelByLanguage(nextRole, adminLanguage)}.`,
                    `Changed role of ${target.username} from ${roleLabelByLanguage(prevRole, adminLanguage)} to ${roleLabelByLanguage(nextRole, adminLanguage)}.`
                ),
                metadata: {
                    actionType: nextRole === 'ADMIN' ? 'PROMOTE_USER' : 'DEMOTE_ADMIN',
                    targetUserId: target.id,
                    targetUsername: target.username,
                    previousRole: prevRole,
                    nextRole,
                },
            });

            return res.status(200).json({
                success: true,
                message: 'User role updated.',
                data: {
                    id: target.id,
                    username: target.username,
                    role: nextRole,
                },
            });
        }

        const target = await User.findByPk(targetUserId);
        if (!target) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const prevRole = toRole(target.role);
        if (prevRole === nextRole) {
            return res.status(200).json({
                success: true,
                message: 'Role is unchanged.',
                data: {
                    id: target.id,
                    username: target.username,
                    role: prevRole,
                },
            });
        }

        target.role = nextRole;
        await target.save();

        await createAdminActionLog({
            adminUserId: adminId,
            adminUsername,
            actionType: nextRole === 'ADMIN' ? 'PROMOTE_USER' : 'DEMOTE_ADMIN',
            targetUserId: target.id,
            targetUsername: target.username,
            reason: String(req.body?.reason || '').trim() || null,
            payload: {
                previousRole: prevRole,
                nextRole,
            },
        });

        const targetLanguage = await resolveUserLanguage(target.id);
        const adminLanguage = resolveRequestLanguage(req) || await resolveUserLanguage(adminId);

        await createUserNotification({
            userId: target.id,
            type: 'ROLE_CHANGED',
            title: byLanguage(targetLanguage, 'Vai trò tài khoản đã được cập nhật', 'Account role updated'),
            message: byLanguage(
                targetLanguage,
                `Vai trò tài khoản của bạn đã được đổi thành ${roleLabelByLanguage(nextRole, targetLanguage)} bởi quản trị viên.`,
                `Your account role has been changed to ${roleLabelByLanguage(nextRole, targetLanguage)} by an administrator.`
            ),
            metadata: {
                previousRole: prevRole,
                nextRole,
                changedBy: adminId,
            },
        });

        await createUserNotification({
            userId: adminId,
            type: 'ADMIN_AUDIT',
            title: byLanguage(adminLanguage, 'Đã ghi nhận thao tác đổi vai trò', 'Role change action recorded'),
            message: byLanguage(
                adminLanguage,
                `Đã đổi vai trò của ${target.username} từ ${roleLabelByLanguage(prevRole, adminLanguage)} sang ${roleLabelByLanguage(nextRole, adminLanguage)}.`,
                `Changed role of ${target.username} from ${roleLabelByLanguage(prevRole, adminLanguage)} to ${roleLabelByLanguage(nextRole, adminLanguage)}.`
            ),
            metadata: {
                actionType: nextRole === 'ADMIN' ? 'PROMOTE_USER' : 'DEMOTE_ADMIN',
                targetUserId: target.id,
                targetUsername: target.username,
                previousRole: prevRole,
                nextRole,
            },
        });

        return res.status(200).json({
            success: true,
            message: 'User role updated.',
            data: {
                id: target.id,
                username: target.username,
                role: nextRole,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    listUsers,
    listAdminActionLogs,
    markAdminActionLogRead,
    markAllAdminActionLogsRead,
    banUser,
    listProjects,
    deleteProjectAsAdmin,
    deleteUserAsAdmin,
    revealUserPassword,
    changeUserRole,
};
