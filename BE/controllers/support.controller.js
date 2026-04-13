const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

const User = require('../models/user.model');
const SupportTicket = require('../models/support_ticket.model');
const SupportMessage = require('../models/support_message.model');
const { createUserNotification } = require('../services/notification.service');
const {
    mockUsers,
    mockSupportTickets,
    mockSupportMessages,
} = require('../utils/mockData');

const AI_SCRIPT_PATH = path.resolve(__dirname, '../ai/assistant_engine.py');
const PYTHON_BIN = process.env.AI_PYTHON_BIN || 'python3';
const SKIP_DB = process.env.SKIP_DB === 'true';
const MAX_USER_TICKET_EDITS = 3;
const TICKET_STATUS_OPEN = 'open';
const TICKET_STATUS_BANNED = 'banned';
const TICKET_STATUS_DELETED_BY_ADMIN = 'deleted_by_admin';
const TICKET_STATUS_DELETED_BY_USER = 'deleted_by_user';

const sanitizeText = (value) => String(value || '').trim();
const toLanguage = (value) => (String(value || '').toLowerCase() === 'en' ? 'en' : 'vi');
const isEnglish = (language) => toLanguage(language) === 'en';
const pickMessage = (language, vi, en) => (isEnglish(language) ? en : vi);
const toRole = (value) => String(value || 'USER').trim().toUpperCase();
const normalizeTicketStatus = (value) => String(value || TICKET_STATUS_OPEN).toLowerCase();
const isTicketBanned = (ticket) => normalizeTicketStatus(ticket?.status) === TICKET_STATUS_BANNED;
const isTicketDeletedByAdmin = (ticket) => normalizeTicketStatus(ticket?.status) === TICKET_STATUS_DELETED_BY_ADMIN;
const isTicketDeletedByUser = (ticket) => normalizeTicketStatus(ticket?.status) === TICKET_STATUS_DELETED_BY_USER;
const isTicketClosed = (ticket) => isTicketBanned(ticket) || isTicketDeletedByAdmin(ticket) || isTicketDeletedByUser(ticket);

const normalizePriority = (value) => {
    const normalized = String(value || '').toLowerCase();
    if (normalized === 'low' || normalized === 'high') return normalized;
    return 'normal';
};

const nextMockId = (items) => {
    if (!Array.isArray(items) || !items.length) return 1;
    return Math.max(...items.map((item) => Number(item.id) || 0)) + 1;
};

const buildTicketCode = () => {
    const ts = Date.now();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `SUP-${ts}${random}`;
};

const buildSupportRoute = (ticketCode) => `/support?ticket=${encodeURIComponent(String(ticketCode || ''))}`;

const toDateTime = (value) => {
    const parsed = new Date(value || 0).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
};

const findUserById = async (userId) => {
    const normalizedId = Number(userId);
    if (!normalizedId) return null;

    if (SKIP_DB) {
        return mockUsers.find((item) => Number(item.id) === normalizedId) || null;
    }

    return User.findByPk(normalizedId, {
        attributes: ['id', 'username', 'email', 'role', 'language'],
    });
};

const verifyPasswordValue = async (plainPassword, user) => {
    const candidate = sanitizeText(plainPassword);
    if (!candidate) return false;

    if (user?.password_hash) {
        try {
            const matched = await bcrypt.compare(candidate, user.password_hash);
            if (matched) return true;
        } catch (error) {
            // Ignore malformed hash formats in legacy data.
        }
    }

    if (user?.password_plain) {
        return candidate === String(user.password_plain);
    }

    return false;
};

const ensureAdminPasswordConfirmed = async (req) => {
    const adminId = Number(req.user?.id || 0);
    const adminPassword = sanitizeText(req.body?.admin_password);

    if (!adminId) {
        return { ok: false, status: 401, message: 'Unauthorized.' };
    }

    if (!adminPassword) {
        return { ok: false, status: 400, message: 'Admin password is required.' };
    }

    const adminUser = SKIP_DB
        ? mockUsers.find((item) => Number(item.id) === adminId) || null
        : await User.findByPk(adminId, { attributes: ['id', 'username', 'role', 'password_hash', 'password_plain', 'language'] });

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

const resolveProfileSnapshot = async ({ userId, requestedName, requestedEmail }) => {
    const user = await findUserById(userId);

    const name = sanitizeText(requestedName)
        || sanitizeText(user?.username)
        || `user-${Number(userId) || 0}`;

    const email = sanitizeText(requestedEmail)
        || sanitizeText(user?.email)
        || null;

    return {
        name,
        email,
    };
};

const listAdminUsers = async () => {
    if (SKIP_DB) {
        return mockUsers
            .filter((item) => toRole(item.role) === 'ADMIN')
            .map((item) => ({
                id: Number(item.id),
                username: item.username,
                language: toLanguage(item.language),
            }));
    }

    const rows = await User.findAll({
        attributes: ['id', 'username', 'role', 'language'],
    });

    return rows
        .filter((row) => toRole(row.role) === 'ADMIN')
        .map((row) => ({
            id: Number(row.id),
            username: row.username,
            language: toLanguage(row.language),
        }));
};

const serializeMessage = (message) => {
    const sender = message?.sender || null;
    const senderId = Number(message?.sender_user_id || sender?.id || 0) || null;
    const senderRole = toRole(message?.sender_role || sender?.role || 'USER');

    return {
        id: Number(message?.id) || null,
        senderUserId: senderId,
        senderRole,
        senderName: sender?.username || `#${senderId || 0}`,
        message: String(message?.message || ''),
        isEdited: Boolean(message?.is_edited),
        editedCount: Number(message?.edited_count || 0),
        editedAt: message?.edited_at || null,
        createdAt: message?.createdAt || null,
        updatedAt: message?.updatedAt || null,
    };
};

const buildTicketBlockedMessage = (ticket, language, actorRole = 'USER') => {
    const role = toRole(actorRole);
    const bannedReason = sanitizeText(ticket?.banned_reason);
    const adminDeletedReason = sanitizeText(ticket?.deleted_by_admin_reason);
    const userDeletedReason = sanitizeText(ticket?.deleted_by_user_reason);

    if (isTicketBanned(ticket)) {
        return pickMessage(
            language,
            `Ticket này đã bị quản trị viên cấm.${bannedReason ? ` Lý do: ${bannedReason}` : ''}`,
            `This ticket was banned by an administrator.${bannedReason ? ` Reason: ${bannedReason}` : ''}`
        );
    }

    if (isTicketDeletedByAdmin(ticket)) {
        return pickMessage(
            language,
            `Ticket này đã bị quản trị viên xóa.${adminDeletedReason ? ` Lý do: ${adminDeletedReason}` : ''}`,
            `This ticket was deleted by an administrator.${adminDeletedReason ? ` Reason: ${adminDeletedReason}` : ''}`
        );
    }

    if (isTicketDeletedByUser(ticket)) {
        if (role === 'ADMIN') {
            return pickMessage(
                language,
                `Ticket này đã được người dùng xóa.${userDeletedReason ? ` Ghi chú: ${userDeletedReason}` : ''}`,
                `This ticket was deleted by the user.${userDeletedReason ? ` Note: ${userDeletedReason}` : ''}`
            );
        }

        return pickMessage(
            language,
            `Bạn đã xóa ticket này.${userDeletedReason ? ` Ghi chú: ${userDeletedReason}` : ''}`,
            `You deleted this ticket.${userDeletedReason ? ` Note: ${userDeletedReason}` : ''}`
        );
    }

    return '';
};

const serializeTicket = (ticket) => {
    const owner = ticket?.User || null;
    const ownerId = Number(ticket?.user_id || owner?.id || 0) || null;
    const messages = Array.isArray(ticket?.messages)
        ? [...ticket.messages]
            .sort((a, b) => toDateTime(a?.createdAt) - toDateTime(b?.createdAt))
            .map((item) => serializeMessage(item))
        : [];
    const status = normalizeTicketStatus(ticket?.status);
    const userEditCount = Number(ticket?.user_edit_count || 0);
    const bannedReason = sanitizeText(ticket?.banned_reason) || null;
    const deletedByAdminReason = sanitizeText(ticket?.deleted_by_admin_reason) || null;
    const deletedByUserReason = sanitizeText(ticket?.deleted_by_user_reason) || null;
    const blockedReasonForUser = buildTicketBlockedMessage(ticket, 'vi', 'USER');
    const blockedReasonForAdmin = buildTicketBlockedMessage(ticket, 'vi', 'ADMIN');

    return {
        id: Number(ticket?.id) || null,
        ticketId: ticket?.ticket_code || null,
        ticketCode: ticket?.ticket_code || null,
        subject: ticket?.subject || '',
        priority: ticket?.priority || 'normal',
        status,
        createdByName: ticket?.created_by_name || '',
        createdByEmail: ticket?.created_by_email || '',
        isEdited: userEditCount > 0,
        userEditCount,
        maxUserEdits: MAX_USER_TICKET_EDITS,
        userEditedAt: ticket?.user_edited_at || null,
        moderation: {
            isBanned: isTicketBanned(ticket),
            bannedByAdminId: Number(ticket?.banned_by_admin_id || 0) || null,
            bannedReason,
            bannedAt: ticket?.banned_at || null,
            isDeletedByAdmin: isTicketDeletedByAdmin(ticket),
            deletedByAdminId: Number(ticket?.deleted_by_admin_id || 0) || null,
            deletedByAdminReason,
            deletedByAdminAt: ticket?.deleted_by_admin_at || null,
            isDeletedByUser: isTicketDeletedByUser(ticket),
            deletedByUserReason,
            deletedByUserAt: ticket?.deleted_by_user_at || null,
        },
        blockedReasonForUser,
        blockedReasonForAdmin,
        canUserReply: !isTicketClosed(ticket),
        canAdminReply: !isTicketClosed(ticket),
        createdAt: ticket?.createdAt || null,
        updatedAt: ticket?.updatedAt || null,
        lastMessageAt: ticket?.last_message_at || ticket?.updatedAt || ticket?.createdAt || null,
        lastMessageByRole: toRole(ticket?.last_message_by_role || 'USER'),
        owner: {
            id: ownerId,
            username: owner?.username || ticket?.created_by_name || `#${ownerId || 0}`,
            email: owner?.email || ticket?.created_by_email || '',
            role: toRole(owner?.role || 'USER'),
        },
        route: ticket?.ticket_code ? buildSupportRoute(ticket.ticket_code) : '/support',
        messages,
    };
};

const parseTicketIdentifier = (value) => {
    const raw = sanitizeText(value);
    if (!raw) {
        return {
            code: null,
            id: null,
            raw,
        };
    }

    const normalizedId = Number(raw);
    return {
        code: raw.toUpperCase().startsWith('SUP-') ? raw : null,
        id: Number.isFinite(normalizedId) && normalizedId > 0 ? normalizedId : null,
        raw,
    };
};

const loadTickets = async ({ userId = null, adminView = false }) => {
    if (SKIP_DB) {
        const source = [...mockSupportTickets]
            .filter((item) => {
                if (adminView) return true;
                return Number(item.user_id) === Number(userId)
                    && normalizeTicketStatus(item.status) !== TICKET_STATUS_DELETED_BY_USER;
            })
            .sort((a, b) => toDateTime(b?.last_message_at || b?.createdAt) - toDateTime(a?.last_message_at || a?.createdAt));

        return source.map((ticket) => {
            const owner = mockUsers.find((item) => Number(item.id) === Number(ticket.user_id)) || null;
            const messages = mockSupportMessages
                .filter((item) => Number(item.ticket_id) === Number(ticket.id))
                .sort((a, b) => toDateTime(a?.createdAt) - toDateTime(b?.createdAt))
                .map((item) => ({
                    ...item,
                    sender: mockUsers.find((user) => Number(user.id) === Number(item.sender_user_id)) || null,
                }));

            return {
                ...ticket,
                User: owner,
                messages,
            };
        });
    }

    const where = {};
    if (!adminView) {
        where.user_id = Number(userId);
        where.status = {
            [Op.ne]: TICKET_STATUS_DELETED_BY_USER,
        };
    }

    return SupportTicket.findAll({
        where,
        include: [
            {
                model: User,
                attributes: ['id', 'username', 'email', 'role'],
            },
            {
                model: SupportMessage,
                as: 'messages',
                required: false,
                include: [
                    {
                        model: User,
                        as: 'sender',
                        attributes: ['id', 'username', 'email', 'role'],
                    },
                ],
            },
        ],
        order: [
            ['last_message_at', 'DESC'],
            [{ model: SupportMessage, as: 'messages' }, 'createdAt', 'ASC'],
        ],
    });
};

const loadSingleTicket = async (ticketIdentifier) => {
    const parsed = parseTicketIdentifier(ticketIdentifier);
    if (!parsed.raw) return null;

    if (SKIP_DB) {
        const found = mockSupportTickets.find((item) => (
            Number(item.id) === Number(parsed.id)
            || String(item.ticket_code) === parsed.raw
        ));
        if (!found) return null;

        const owner = mockUsers.find((item) => Number(item.id) === Number(found.user_id)) || null;
        const messages = mockSupportMessages
            .filter((item) => Number(item.ticket_id) === Number(found.id))
            .sort((a, b) => toDateTime(a?.createdAt) - toDateTime(b?.createdAt))
            .map((item) => ({
                ...item,
                sender: mockUsers.find((user) => Number(user.id) === Number(item.sender_user_id)) || null,
            }));

        return {
            ...found,
            User: owner,
            messages,
        };
    }

    const where = parsed.code
        ? { ticket_code: parsed.code }
        : parsed.id
            ? {
                [Op.or]: [
                    { id: parsed.id },
                    { ticket_code: parsed.raw },
                ],
            }
            : { ticket_code: parsed.raw };

    return SupportTicket.findOne({
        where,
        include: [
            {
                model: User,
                attributes: ['id', 'username', 'email', 'role'],
            },
            {
                model: SupportMessage,
                as: 'messages',
                required: false,
                include: [
                    {
                        model: User,
                        as: 'sender',
                        attributes: ['id', 'username', 'email', 'role'],
                    },
                ],
            },
        ],
        order: [[{ model: SupportMessage, as: 'messages' }, 'createdAt', 'ASC']],
    });
};

const generateUniqueTicketCode = async () => {
    for (let index = 0; index < 6; index += 1) {
        const candidate = buildTicketCode();

        if (SKIP_DB) {
            const existed = mockSupportTickets.find((item) => item.ticket_code === candidate);
            if (!existed) return candidate;
            continue;
        }

        const existed = await SupportTicket.findOne({
            where: { ticket_code: candidate },
            attributes: ['id'],
        });

        if (!existed) return candidate;
    }

    return `${buildTicketCode()}${Math.floor(Math.random() * 9)}`;
};

const notifyAdminsOnNewTicket = async ({ ticketCode, ticketId, actorUserId, actorName, subject }) => {
    const admins = await listAdminUsers();
    if (!admins.length) return;

    await Promise.all(admins
        .filter((admin) => Number(admin.id) !== Number(actorUserId))
        .map((admin) => {
            const language = toLanguage(admin.language);
            return createUserNotification({
                userId: admin.id,
                type: 'SUPPORT_NEW_TICKET',
                title: pickMessage(language, 'Ticket hỗ trợ mới từ người dùng', 'New support ticket from user'),
                message: pickMessage(
                    language,
                    `[${ticketCode}] ${actorName}: ${subject}`,
                    `[${ticketCode}] ${actorName}: ${subject}`
                ),
                metadata: {
                    feature: 'support-center',
                    ticketId,
                    ticketCode,
                    route: buildSupportRoute(ticketCode),
                },
            });
        }));
};

const notifyUserOnAdminReply = async ({ userId, ticketId, ticketCode, adminName, message }) => {
    const targetUser = await findUserById(userId);
    const language = toLanguage(targetUser?.language);
    const summary = sanitizeText(message).slice(0, 120);

    await createUserNotification({
        userId,
        type: 'SUPPORT_REPLY',
        title: pickMessage(language, 'Phản hồi mới từ quản trị viên', 'New reply from administrator'),
        message: pickMessage(
            language,
            `[${ticketCode}] ${adminName}: ${summary}`,
            `[${ticketCode}] ${adminName}: ${summary}`
        ),
        metadata: {
            feature: 'support-center',
            ticketId,
            ticketCode,
            route: buildSupportRoute(ticketCode),
        },
    });
};

const notifyAdminsOnUserReply = async ({ ticketCode, ticketId, actorUserId, actorName, message }) => {
    const admins = await listAdminUsers();
    if (!admins.length) return;

    const summary = sanitizeText(message).slice(0, 120);

    await Promise.all(admins
        .filter((admin) => Number(admin.id) !== Number(actorUserId))
        .map((admin) => {
            const language = toLanguage(admin.language);
            return createUserNotification({
                userId: admin.id,
                type: 'SUPPORT_USER_REPLY',
                title: pickMessage(language, 'Người dùng vừa phản hồi ticket', 'User replied on a support ticket'),
                message: pickMessage(
                    language,
                    `[${ticketCode}] ${actorName}: ${summary}`,
                    `[${ticketCode}] ${actorName}: ${summary}`
                ),
                metadata: {
                    feature: 'support-center',
                    ticketId,
                    ticketCode,
                    route: buildSupportRoute(ticketCode),
                },
            });
        }));
};

const notifyAdminsOnTicketEdited = async ({ ticketCode, ticketId, actorUserId, actorName, subject, editCount }) => {
    const admins = await listAdminUsers();
    if (!admins.length) return;

    await Promise.all(admins
        .filter((admin) => Number(admin.id) !== Number(actorUserId))
        .map((admin) => {
            const language = toLanguage(admin.language);
            return createUserNotification({
                userId: admin.id,
                type: 'SUPPORT_TICKET_EDITED',
                title: pickMessage(language, 'Ticket đã được người dùng chỉnh sửa', 'Ticket was edited by user'),
                message: pickMessage(
                    language,
                    `[${ticketCode}] ${actorName} đã chỉnh sửa ticket (${editCount}/${MAX_USER_TICKET_EDITS}): ${subject}`,
                    `[${ticketCode}] ${actorName} edited this ticket (${editCount}/${MAX_USER_TICKET_EDITS}): ${subject}`
                ),
                metadata: {
                    feature: 'support-center',
                    ticketId,
                    ticketCode,
                    route: buildSupportRoute(ticketCode),
                    editCount,
                },
            });
        }));
};

const notifyAdminsOnTicketDeletedByUser = async ({ ticketCode, ticketId, actorUserId, actorName, reason }) => {
    const admins = await listAdminUsers();
    if (!admins.length) return;

    await Promise.all(admins
        .filter((admin) => Number(admin.id) !== Number(actorUserId))
        .map((admin) => {
            const language = toLanguage(admin.language);
            return createUserNotification({
                userId: admin.id,
                type: 'SUPPORT_USER_DELETE_TICKET',
                title: pickMessage(language, 'Người dùng đã xóa ticket', 'User deleted a support ticket'),
                message: pickMessage(
                    language,
                    `[${ticketCode}] ${actorName} đã xóa ticket.${reason ? ` Lý do: ${reason}` : ''}`,
                    `[${ticketCode}] ${actorName} deleted this ticket.${reason ? ` Reason: ${reason}` : ''}`
                ),
                metadata: {
                    feature: 'support-center',
                    ticketId,
                    ticketCode,
                    route: buildSupportRoute(ticketCode),
                    reason: reason || null,
                },
            });
        }));
};

const notifyUserOnTicketModeration = async ({
    userId,
    ticketId,
    ticketCode,
    action,
    adminUserId,
    adminName,
    reason,
}) => {
    const targetUser = await findUserById(userId);
    const language = toLanguage(targetUser?.language);
    const normalizedAction = String(action || '').toLowerCase();

    const title = normalizedAction === 'ban'
        ? pickMessage(language, 'Ticket của bạn đã bị cấm', 'Your ticket was banned')
        : pickMessage(language, 'Ticket của bạn đã bị xóa', 'Your ticket was deleted');

    const message = normalizedAction === 'ban'
        ? pickMessage(
            language,
            `[${ticketCode}] Ticket đã bị cấm bởi ${adminName}.${reason ? ` Lý do: ${reason}` : ''}`,
            `[${ticketCode}] Ticket was banned by ${adminName}.${reason ? ` Reason: ${reason}` : ''}`
        )
        : pickMessage(
            language,
            `[${ticketCode}] Ticket đã bị xóa bởi ${adminName}.${reason ? ` Lý do: ${reason}` : ''}`,
            `[${ticketCode}] Ticket was deleted by ${adminName}.${reason ? ` Reason: ${reason}` : ''}`
        );

    await createUserNotification({
        userId,
        type: normalizedAction === 'ban' ? 'SUPPORT_TICKET_BANNED' : 'SUPPORT_TICKET_DELETED',
        title,
        message,
        metadata: {
            feature: 'support-center',
            ticketId,
            ticketCode,
            route: buildSupportRoute(ticketCode),
            action: normalizedAction,
            actionBy: adminUserId,
            reason: reason || null,
        },
    });
};

const runPythonAssistant = (payload) => {
    return new Promise((resolve, reject) => {
        const child = spawn(PYTHON_BIN, [AI_SCRIPT_PATH], {
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        let stdout = '';
        let stderr = '';
        const timeout = setTimeout(() => {
            child.kill('SIGKILL');
            reject(new Error('Python assistant timeout.'));
        }, 8000);

        child.stdout.on('data', (chunk) => {
            stdout += chunk.toString();
        });

        child.stderr.on('data', (chunk) => {
            stderr += chunk.toString();
        });

        child.on('error', (error) => {
            clearTimeout(timeout);
            reject(error);
        });

        child.on('close', (code) => {
            clearTimeout(timeout);
            if (code !== 0) {
                reject(new Error(stderr || `Python exited with code ${code}`));
                return;
            }

            try {
                const parsed = JSON.parse(stdout || '{}');
                resolve(parsed);
            } catch (error) {
                reject(error);
            }
        });

        child.stdin.write(JSON.stringify(payload));
        child.stdin.end();
    });
};

const createSupportTicket = async (req, res) => {
    try {
        const requesterId = Number(req.user?.id);
        const { name, email, subject, message, priority, language } = req.body || {};

        const cleanSubject = sanitizeText(subject);
        const cleanMessage = sanitizeText(message);

        if (!requesterId) {
            return res.status(401).json({ success: false, message: 'Unauthorized.' });
        }

        if (!cleanSubject || !cleanMessage) {
            return res.status(400).json({
                success: false,
                message: pickMessage(
                    language,
                    'Thong tin support chua day du (subject, message).',
                    'Support information is incomplete (subject, message).'
                ),
            });
        }

        const snapshot = await resolveProfileSnapshot({
            userId: requesterId,
            requestedName: name,
            requestedEmail: email,
        });

        const ticketCode = await generateUniqueTicketCode();
        const normalizedPriority = normalizePriority(priority);
        let createdTicket;

        if (SKIP_DB) {
            const now = new Date();
            createdTicket = {
                id: nextMockId(mockSupportTickets),
                ticket_code: ticketCode,
                user_id: requesterId,
                subject: cleanSubject,
                priority: normalizedPriority,
                status: TICKET_STATUS_OPEN,
                created_by_name: snapshot.name,
                created_by_email: snapshot.email,
                user_edit_count: 0,
                user_edited_at: null,
                banned_by_admin_id: null,
                banned_reason: null,
                banned_at: null,
                deleted_by_admin_id: null,
                deleted_by_admin_reason: null,
                deleted_by_admin_at: null,
                deleted_by_user_reason: null,
                deleted_by_user_at: null,
                last_message_at: now,
                last_message_by_role: 'USER',
                createdAt: now,
                updatedAt: now,
            };

            mockSupportTickets.unshift(createdTicket);
            mockSupportMessages.push({
                id: nextMockId(mockSupportMessages),
                ticket_id: createdTicket.id,
                sender_user_id: requesterId,
                sender_role: 'USER',
                message: cleanMessage,
                is_edited: false,
                edited_count: 0,
                edited_at: null,
                createdAt: now,
                updatedAt: now,
            });
        } else {
            createdTicket = await SupportTicket.create({
                ticket_code: ticketCode,
                user_id: requesterId,
                subject: cleanSubject,
                priority: normalizedPriority,
                status: TICKET_STATUS_OPEN,
                created_by_name: snapshot.name,
                created_by_email: snapshot.email,
                user_edit_count: 0,
                user_edited_at: null,
                banned_by_admin_id: null,
                banned_reason: null,
                banned_at: null,
                deleted_by_admin_id: null,
                deleted_by_admin_reason: null,
                deleted_by_admin_at: null,
                deleted_by_user_reason: null,
                deleted_by_user_at: null,
                last_message_at: new Date(),
                last_message_by_role: 'USER',
            });

            const firstMessage = await SupportMessage.create({
                ticket_id: createdTicket.id,
                sender_user_id: requesterId,
                sender_role: 'USER',
                message: cleanMessage,
                is_edited: false,
                edited_count: 0,
                edited_at: null,
            });

            createdTicket.last_message_at = firstMessage.createdAt;
            createdTicket.last_message_by_role = 'USER';
            await createdTicket.save();
        }

        await notifyAdminsOnNewTicket({
            ticketCode,
            ticketId: createdTicket.id,
            actorUserId: requesterId,
            actorName: snapshot.name,
            subject: cleanSubject,
        });

        const hydrated = await loadSingleTicket(createdTicket.id || ticketCode);
        const payload = hydrated ? serializeTicket(hydrated) : {
            id: createdTicket.id,
            ticketId: ticketCode,
            ticketCode,
        };

        return res.status(201).json({
            success: true,
            message: pickMessage(language, 'Yeu cau ho tro da duoc tiep nhan.', 'Support request has been received.'),
            data: payload,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getMySupportTickets = async (req, res) => {
    try {
        const requesterId = Number(req.user?.id);
        if (!requesterId) {
            return res.status(401).json({ success: false, message: 'Unauthorized.' });
        }

        const rows = await loadTickets({ userId: requesterId, adminView: false });
        return res.status(200).json({
            success: true,
            data: rows.map((item) => serializeTicket(item)),
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getAllSupportTickets = async (req, res) => {
    try {
        const rows = await loadTickets({ adminView: true });
        return res.status(200).json({
            success: true,
            data: rows.map((item) => serializeTicket(item)),
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const replySupportTicket = async (req, res) => {
    try {
        const adminUserId = Number(req.user?.id);
        const adminName = sanitizeText(req.user?.username) || `admin-${adminUserId || 0}`;
        const ticketIdentifier = sanitizeText(req.params?.ticketId);
        const { message, language } = req.body || {};
        const cleanMessage = sanitizeText(message);

        if (!adminUserId) {
            return res.status(401).json({ success: false, message: 'Unauthorized.' });
        }

        if (!ticketIdentifier || !cleanMessage) {
            return res.status(400).json({
                success: false,
                message: pickMessage(language, 'Thong tin phan hoi chua day du.', 'Reply information is incomplete.'),
            });
        }

        const ticket = await loadSingleTicket(ticketIdentifier);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: pickMessage(language, 'Khong tim thay ticket ho tro.', 'Support ticket not found.'),
            });
        }

        if (isTicketClosed(ticket)) {
            return res.status(400).json({
                success: false,
                message: buildTicketBlockedMessage(ticket, language, 'ADMIN') || pickMessage(language, 'Ticket da dong.', 'Ticket is closed.'),
            });
        }

        const now = new Date();

        if (SKIP_DB) {
            mockSupportMessages.push({
                id: nextMockId(mockSupportMessages),
                ticket_id: ticket.id,
                sender_user_id: adminUserId,
                sender_role: 'ADMIN',
                message: cleanMessage,
                is_edited: false,
                edited_count: 0,
                edited_at: null,
                createdAt: now,
                updatedAt: now,
            });

            const idx = mockSupportTickets.findIndex((item) => Number(item.id) === Number(ticket.id));
            if (idx >= 0) {
                mockSupportTickets[idx] = {
                    ...mockSupportTickets[idx],
                    last_message_at: now,
                    last_message_by_role: 'ADMIN',
                    status: TICKET_STATUS_OPEN,
                    updatedAt: now,
                };
            }
        } else {
            await SupportMessage.create({
                ticket_id: ticket.id,
                sender_user_id: adminUserId,
                sender_role: 'ADMIN',
                message: cleanMessage,
                is_edited: false,
                edited_count: 0,
                edited_at: null,
            });

            await SupportTicket.update(
                {
                    last_message_at: now,
                    last_message_by_role: 'ADMIN',
                    status: TICKET_STATUS_OPEN,
                },
                { where: { id: Number(ticket.id) } }
            );
        }

        await notifyUserOnAdminReply({
            userId: Number(ticket.user_id),
            ticketId: Number(ticket.id),
            ticketCode: String(ticket.ticket_code),
            adminName,
            message: cleanMessage,
        });

        const refreshed = await loadSingleTicket(ticket.id);

        return res.status(200).json({
            success: true,
            message: pickMessage(language, 'Da gui phan hoi cho ticket.', 'Reply has been sent to this ticket.'),
            data: refreshed ? serializeTicket(refreshed) : null,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const replyMySupportTicket = async (req, res) => {
    try {
        const requesterId = Number(req.user?.id);
        const requesterName = sanitizeText(req.user?.username) || `user-${requesterId || 0}`;
        const ticketIdentifier = sanitizeText(req.params?.ticketId);
        const { message, language } = req.body || {};
        const cleanMessage = sanitizeText(message);

        if (!requesterId) {
            return res.status(401).json({ success: false, message: 'Unauthorized.' });
        }

        if (!ticketIdentifier || !cleanMessage) {
            return res.status(400).json({
                success: false,
                message: pickMessage(language, 'Thong tin phan hoi chua day du.', 'Reply information is incomplete.'),
            });
        }

        const ticket = await loadSingleTicket(ticketIdentifier);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: pickMessage(language, 'Khong tim thay ticket ho tro.', 'Support ticket not found.'),
            });
        }

        if (Number(ticket.user_id) !== Number(requesterId)) {
            return res.status(403).json({
                success: false,
                message: pickMessage(language, 'Ban khong co quyen gui tin nhan vao ticket nay.', 'You cannot post message to this ticket.'),
            });
        }

        if (isTicketClosed(ticket)) {
            return res.status(400).json({
                success: false,
                message: buildTicketBlockedMessage(ticket, language, 'USER') || pickMessage(language, 'Ticket da dong.', 'Ticket is closed.'),
            });
        }

        const now = new Date();

        if (SKIP_DB) {
            mockSupportMessages.push({
                id: nextMockId(mockSupportMessages),
                ticket_id: ticket.id,
                sender_user_id: requesterId,
                sender_role: 'USER',
                message: cleanMessage,
                is_edited: false,
                edited_count: 0,
                edited_at: null,
                createdAt: now,
                updatedAt: now,
            });

            const idx = mockSupportTickets.findIndex((item) => Number(item.id) === Number(ticket.id));
            if (idx >= 0) {
                mockSupportTickets[idx] = {
                    ...mockSupportTickets[idx],
                    last_message_at: now,
                    last_message_by_role: 'USER',
                    status: TICKET_STATUS_OPEN,
                    updatedAt: now,
                };
            }
        } else {
            await SupportMessage.create({
                ticket_id: ticket.id,
                sender_user_id: requesterId,
                sender_role: 'USER',
                message: cleanMessage,
                is_edited: false,
                edited_count: 0,
                edited_at: null,
            });

            await SupportTicket.update(
                {
                    last_message_at: now,
                    last_message_by_role: 'USER',
                    status: TICKET_STATUS_OPEN,
                },
                { where: { id: Number(ticket.id) } }
            );
        }

        await notifyAdminsOnUserReply({
            ticketCode: String(ticket.ticket_code),
            ticketId: Number(ticket.id),
            actorUserId: requesterId,
            actorName: requesterName,
            message: cleanMessage,
        });

        const refreshed = await loadSingleTicket(ticket.id);

        return res.status(200).json({
            success: true,
            message: pickMessage(language, 'Da gui tin nhan vao ticket.', 'Message has been sent to this ticket.'),
            data: refreshed ? serializeTicket(refreshed) : null,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const editMySupportTicket = async (req, res) => {
    try {
        const requesterId = Number(req.user?.id);
        const requesterName = sanitizeText(req.user?.username) || `user-${requesterId || 0}`;
        const ticketIdentifier = sanitizeText(req.params?.ticketId);
        const { subject, message, priority, language } = req.body || {};

        if (!requesterId) {
            return res.status(401).json({ success: false, message: 'Unauthorized.' });
        }

        if (!ticketIdentifier) {
            return res.status(400).json({
                success: false,
                message: pickMessage(language, 'Thieu dinh danh ticket.', 'Ticket identifier is required.'),
            });
        }

        const ticket = await loadSingleTicket(ticketIdentifier);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: pickMessage(language, 'Khong tim thay ticket ho tro.', 'Support ticket not found.'),
            });
        }

        if (Number(ticket.user_id) !== Number(requesterId)) {
            return res.status(403).json({
                success: false,
                message: pickMessage(language, 'Ban khong co quyen sua ticket nay.', 'You cannot edit this ticket.'),
            });
        }

        if (isTicketClosed(ticket)) {
            return res.status(400).json({
                success: false,
                message: buildTicketBlockedMessage(ticket, language, 'USER') || pickMessage(language, 'Ticket da dong.', 'Ticket is closed.'),
            });
        }

        const currentEditCount = Number(ticket?.user_edit_count || 0);
        if (currentEditCount >= MAX_USER_TICKET_EDITS) {
            return res.status(400).json({
                success: false,
                message: pickMessage(
                    language,
                    `Ban da dat gioi han ${MAX_USER_TICKET_EDITS} lan chinh sua cho ticket nay.`,
                    `You have reached the ${MAX_USER_TICKET_EDITS}-edit limit for this ticket.`
                ),
            });
        }

        const nextSubject = sanitizeText(subject) || String(ticket?.subject || '').trim();
        const nextPriority = sanitizeText(priority)
            ? normalizePriority(priority)
            : String(ticket?.priority || 'normal');

        let baseUserMessage = null;

        if (SKIP_DB) {
            const candidates = mockSupportMessages
                .filter((item) => (
                    Number(item.ticket_id) === Number(ticket.id)
                    && Number(item.sender_user_id) === Number(requesterId)
                    && toRole(item.sender_role) === 'USER'
                ))
                .sort((a, b) => toDateTime(a?.createdAt) - toDateTime(b?.createdAt));

            baseUserMessage = candidates[0] || null;

            if (!baseUserMessage) {
                const fallback = mockSupportMessages
                    .filter((item) => Number(item.ticket_id) === Number(ticket.id))
                    .sort((a, b) => toDateTime(a?.createdAt) - toDateTime(b?.createdAt));
                baseUserMessage = fallback[0] || null;
            }
        } else {
            baseUserMessage = await SupportMessage.findOne({
                where: {
                    ticket_id: Number(ticket.id),
                    sender_user_id: Number(requesterId),
                    sender_role: 'USER',
                },
                order: [['createdAt', 'ASC']],
            });

            if (!baseUserMessage) {
                baseUserMessage = await SupportMessage.findOne({
                    where: {
                        ticket_id: Number(ticket.id),
                        sender_role: 'USER',
                    },
                    order: [['createdAt', 'ASC']],
                });
            }
        }

        if (!baseUserMessage) {
            return res.status(404).json({
                success: false,
                message: pickMessage(language, 'Khong tim thay noi dung ticket de chinh sua.', 'Unable to find editable ticket content.'),
            });
        }

        const nextMessage = sanitizeText(message) || sanitizeText(baseUserMessage?.message);

        if (!nextSubject || !nextMessage) {
            return res.status(400).json({
                success: false,
                message: pickMessage(language, 'Thong tin chinh sua ticket chua day du.', 'Ticket edit information is incomplete.'),
            });
        }

        const oldSubject = String(ticket?.subject || '');
        const oldPriority = String(ticket?.priority || 'normal');
        const oldMessage = String(baseUserMessage?.message || '');

        const changed = nextSubject !== oldSubject
            || nextPriority !== oldPriority
            || nextMessage !== oldMessage;

        if (!changed) {
            return res.status(400).json({
                success: false,
                message: pickMessage(language, 'Khong co thay doi nao de cap nhat.', 'No changes detected for this ticket.'),
            });
        }

        const now = new Date();
        const nextEditCount = currentEditCount + 1;

        if (SKIP_DB) {
            const ticketIdx = mockSupportTickets.findIndex((item) => Number(item.id) === Number(ticket.id));
            if (ticketIdx >= 0) {
                mockSupportTickets[ticketIdx] = {
                    ...mockSupportTickets[ticketIdx],
                    subject: nextSubject,
                    priority: nextPriority,
                    user_edit_count: nextEditCount,
                    user_edited_at: now,
                    last_message_at: now,
                    last_message_by_role: 'USER',
                    updatedAt: now,
                };
            }

            const msgIdx = mockSupportMessages.findIndex((item) => Number(item.id) === Number(baseUserMessage.id));
            if (msgIdx >= 0) {
                const prevCount = Number(mockSupportMessages[msgIdx]?.edited_count || 0);
                mockSupportMessages[msgIdx] = {
                    ...mockSupportMessages[msgIdx],
                    message: nextMessage,
                    is_edited: true,
                    edited_count: prevCount + 1,
                    edited_at: now,
                    updatedAt: now,
                };
            }
        } else {
            await baseUserMessage.update({
                message: nextMessage,
                is_edited: true,
                edited_count: Number(baseUserMessage.edited_count || 0) + 1,
                edited_at: now,
            });

            await SupportTicket.update(
                {
                    subject: nextSubject,
                    priority: nextPriority,
                    user_edit_count: nextEditCount,
                    user_edited_at: now,
                    last_message_at: now,
                    last_message_by_role: 'USER',
                },
                { where: { id: Number(ticket.id) } }
            );
        }

        await notifyAdminsOnTicketEdited({
            ticketCode: String(ticket.ticket_code),
            ticketId: Number(ticket.id),
            actorUserId: requesterId,
            actorName: requesterName,
            subject: nextSubject,
            editCount: nextEditCount,
        });

        const refreshed = await loadSingleTicket(ticket.id);

        return res.status(200).json({
            success: true,
            message: pickMessage(language, 'Da cap nhat ticket ho tro.', 'Support ticket has been updated.'),
            data: refreshed ? serializeTicket(refreshed) : null,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteMySupportTicket = async (req, res) => {
    try {
        const requesterId = Number(req.user?.id);
        const requesterName = sanitizeText(req.user?.username) || `user-${requesterId || 0}`;
        const ticketIdentifier = sanitizeText(req.params?.ticketId);
        const { reason, language } = req.body || {};
        const cleanReason = sanitizeText(reason);

        if (!requesterId) {
            return res.status(401).json({ success: false, message: 'Unauthorized.' });
        }

        const ticket = await loadSingleTicket(ticketIdentifier);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: pickMessage(language, 'Khong tim thay ticket ho tro.', 'Support ticket not found.'),
            });
        }

        if (Number(ticket.user_id) !== Number(requesterId)) {
            return res.status(403).json({
                success: false,
                message: pickMessage(language, 'Ban khong co quyen xoa ticket nay.', 'You cannot delete this ticket.'),
            });
        }

        if (isTicketDeletedByAdmin(ticket) || isTicketDeletedByUser(ticket)) {
            return res.status(400).json({
                success: false,
                message: pickMessage(language, 'Ticket da duoc danh dau xoa.', 'Ticket is already marked as deleted.'),
            });
        }

        const now = new Date();

        if (SKIP_DB) {
            const idx = mockSupportTickets.findIndex((item) => Number(item.id) === Number(ticket.id));
            if (idx >= 0) {
                mockSupportTickets[idx] = {
                    ...mockSupportTickets[idx],
                    status: TICKET_STATUS_DELETED_BY_USER,
                    deleted_by_user_reason: cleanReason || null,
                    deleted_by_user_at: now,
                    last_message_at: now,
                    last_message_by_role: 'USER',
                    updatedAt: now,
                };
            }
        } else {
            await SupportTicket.update(
                {
                    status: TICKET_STATUS_DELETED_BY_USER,
                    deleted_by_user_reason: cleanReason || null,
                    deleted_by_user_at: now,
                    last_message_at: now,
                    last_message_by_role: 'USER',
                },
                { where: { id: Number(ticket.id) } }
            );
        }

        await notifyAdminsOnTicketDeletedByUser({
            ticketCode: String(ticket.ticket_code),
            ticketId: Number(ticket.id),
            actorUserId: requesterId,
            actorName: requesterName,
            reason: cleanReason,
        });

        const refreshed = await loadSingleTicket(ticket.id);
        return res.status(200).json({
            success: true,
            message: pickMessage(language, 'Da xoa ticket ho tro.', 'Support ticket has been deleted.'),
            data: refreshed ? serializeTicket(refreshed) : null,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const banSupportTicket = async (req, res) => {
    try {
        const confirmation = await ensureAdminPasswordConfirmed(req);
        if (!confirmation.ok) {
            return res.status(confirmation.status).json({ success: false, message: confirmation.message });
        }

        const adminId = Number(req.user?.id || 0);
        const adminName = sanitizeText(req.user?.username) || `admin-${adminId || 0}`;
        const ticketIdentifier = sanitizeText(req.params?.ticketId);
        const { reason, language } = req.body || {};
        const cleanReason = sanitizeText(reason);

        if (!cleanReason) {
            return res.status(400).json({
                success: false,
                message: pickMessage(language, 'Can nhap ly do cam ticket.', 'Reason is required to ban a ticket.'),
            });
        }

        const ticket = await loadSingleTicket(ticketIdentifier);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: pickMessage(language, 'Khong tim thay ticket ho tro.', 'Support ticket not found.'),
            });
        }

        if (isTicketDeletedByAdmin(ticket) || isTicketDeletedByUser(ticket)) {
            return res.status(400).json({
                success: false,
                message: pickMessage(language, 'Khong the cam ticket da bi xoa.', 'Cannot ban a deleted ticket.'),
            });
        }

        if (isTicketBanned(ticket)) {
            return res.status(400).json({
                success: false,
                message: pickMessage(language, 'Ticket nay da bi cam truoc do.', 'This ticket is already banned.'),
            });
        }

        const now = new Date();

        if (SKIP_DB) {
            const idx = mockSupportTickets.findIndex((item) => Number(item.id) === Number(ticket.id));
            if (idx >= 0) {
                mockSupportTickets[idx] = {
                    ...mockSupportTickets[idx],
                    status: TICKET_STATUS_BANNED,
                    banned_by_admin_id: adminId,
                    banned_reason: cleanReason,
                    banned_at: now,
                    updatedAt: now,
                };
            }
        } else {
            await SupportTicket.update(
                {
                    status: TICKET_STATUS_BANNED,
                    banned_by_admin_id: adminId,
                    banned_reason: cleanReason,
                    banned_at: now,
                },
                { where: { id: Number(ticket.id) } }
            );
        }

        await notifyUserOnTicketModeration({
            userId: Number(ticket.user_id),
            ticketId: Number(ticket.id),
            ticketCode: String(ticket.ticket_code),
            action: 'ban',
            adminUserId: adminId,
            adminName,
            reason: cleanReason,
        });

        const refreshed = await loadSingleTicket(ticket.id);
        return res.status(200).json({
            success: true,
            message: pickMessage(language, 'Da cam ticket ho tro.', 'Support ticket has been banned.'),
            data: refreshed ? serializeTicket(refreshed) : null,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteSupportTicketAsAdmin = async (req, res) => {
    try {
        const confirmation = await ensureAdminPasswordConfirmed(req);
        if (!confirmation.ok) {
            return res.status(confirmation.status).json({ success: false, message: confirmation.message });
        }

        const adminId = Number(req.user?.id || 0);
        const adminName = sanitizeText(req.user?.username) || `admin-${adminId || 0}`;
        const ticketIdentifier = sanitizeText(req.params?.ticketId);
        const { reason, language } = req.body || {};
        const cleanReason = sanitizeText(reason);

        if (!cleanReason) {
            return res.status(400).json({
                success: false,
                message: pickMessage(language, 'Can nhap ly do xoa ticket.', 'Reason is required to delete a ticket.'),
            });
        }

        const ticket = await loadSingleTicket(ticketIdentifier);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: pickMessage(language, 'Khong tim thay ticket ho tro.', 'Support ticket not found.'),
            });
        }

        if (isTicketDeletedByAdmin(ticket)) {
            return res.status(400).json({
                success: false,
                message: pickMessage(language, 'Ticket nay da bi xoa boi admin.', 'This ticket is already deleted by admin.'),
            });
        }

        const now = new Date();

        if (SKIP_DB) {
            const idx = mockSupportTickets.findIndex((item) => Number(item.id) === Number(ticket.id));
            if (idx >= 0) {
                mockSupportTickets[idx] = {
                    ...mockSupportTickets[idx],
                    status: TICKET_STATUS_DELETED_BY_ADMIN,
                    deleted_by_admin_id: adminId,
                    deleted_by_admin_reason: cleanReason,
                    deleted_by_admin_at: now,
                    updatedAt: now,
                };
            }
        } else {
            await SupportTicket.update(
                {
                    status: TICKET_STATUS_DELETED_BY_ADMIN,
                    deleted_by_admin_id: adminId,
                    deleted_by_admin_reason: cleanReason,
                    deleted_by_admin_at: now,
                },
                { where: { id: Number(ticket.id) } }
            );
        }

        await notifyUserOnTicketModeration({
            userId: Number(ticket.user_id),
            ticketId: Number(ticket.id),
            ticketCode: String(ticket.ticket_code),
            action: 'delete',
            adminUserId: adminId,
            adminName,
            reason: cleanReason,
        });

        const refreshed = await loadSingleTicket(ticket.id);
        return res.status(200).json({
            success: true,
            message: pickMessage(language, 'Da xoa ticket ho tro.', 'Support ticket has been deleted.'),
            data: refreshed ? serializeTicket(refreshed) : null,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const aiHint = async (req, res) => {
    try {
        const { question, context, language } = req.body || {};
        const cleanQuestion = sanitizeText(question);

        if (!cleanQuestion) {
            return res.status(400).json({
                success: false,
                message: 'Question is required.',
            });
        }

        let reply = '';
        let actions = [];
        let confidence = 0.72;
        let source = 'python';

        try {
            if (!fs.existsSync(AI_SCRIPT_PATH)) {
                throw new Error('Python AI script not found.');
            }

            const aiResult = await runPythonAssistant({
                question: cleanQuestion,
                context: context || {},
                language: language === 'en' ? 'en' : 'vi',
            });

            reply = aiResult?.reply || '';
            actions = Array.isArray(aiResult?.actions) ? aiResult.actions : [];
            confidence = Number.isFinite(Number(aiResult?.confidence)) ? Number(aiResult.confidence) : confidence;
        } catch (pythonError) {
            const q = cleanQuestion.toLowerCase();
            const sf = Number(context?.safetyFactor || 1.12).toFixed(2);
            reply = 'Kiem tra ratio tong, duong kinh puly va do ben truc truoc khi xuat bao cao.';

            if (q.includes('safety')) {
                reply = `Safety factor hien tai ~${sf}. Khuyen nghi >= 1.25. Ban co the tang face width va tang duong kinh truc tieu chuan.`;
            } else if (q.includes('ratio')) {
                reply = 'Neu ratio > 6, nen tach cap truyen de giam peak stress. Duy tri ratio cap dau 2.5-3.5 de on dinh.';
            } else if (q.includes('spur') || q.includes('bevel')) {
                reply = 'Voi spur/bevel, uu tien can bang giua so rang va center distance. Tranh ratio qua cao gay rung va giam hieu suat.';
            } else if (q.includes('export')) {
                reply = 'Truoc khi export: xac nhan da Save Draft, da co du lieu Step1/3/4, va chon dung dinh dang file.';
            }
            actions = ['Check ratio consistency', 'Verify shaft diameter margin', 'Save draft before export'];
            confidence = 0.58;
            source = 'node-fallback';
            console.warn('⚠️ Python AI fallback:', pythonError.message);
        }

        return res.status(200).json({
            success: true,
            data: {
                reply,
                actions,
                confidence,
                source,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    createSupportTicket,
    getMySupportTickets,
    getAllSupportTickets,
    replySupportTicket,
    replyMySupportTicket,
    editMySupportTicket,
    deleteMySupportTicket,
    banSupportTicket,
    deleteSupportTicketAsAdmin,
    aiHint,
};
