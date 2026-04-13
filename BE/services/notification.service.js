const Notification = require('../models/notification.model');
const { Op } = require('sequelize');
const { mockNotifications } = require('../utils/mockData');

const SKIP_DB = process.env.SKIP_DB === 'true';
const CREATE_DEDUPE_WINDOW_MS = 45 * 1000;
const LIST_DEDUPE_WINDOW_MS = 30 * 60 * 1000;

const nextMockId = () => {
    if (!mockNotifications.length) return 1;
    return Math.max(...mockNotifications.map((item) => Number(item.id) || 0)) + 1;
};

const toTimeValue = (value) => {
    if (!value) return 0;
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
};

const buildNotificationSignature = (item = {}) => {
    return [
        Number(item.user_id) || 0,
        String(item.type || ''),
        String(item.title || ''),
        String(item.message || ''),
    ].join('::');
};

const dedupeNotificationItems = (items = [], windowMs = LIST_DEDUPE_WINDOW_MS) => {
    const accepted = [];
    const lastAcceptedBySignature = new Map();

    items.forEach((item) => {
        const signature = buildNotificationSignature(item);
        const createdAt = toTimeValue(item?.createdAt);
        const lastAcceptedAt = lastAcceptedBySignature.get(signature) || 0;

        if (lastAcceptedAt && Math.abs(lastAcceptedAt - createdAt) <= windowMs) {
            return;
        }

        lastAcceptedBySignature.set(signature, createdAt);
        accepted.push(item);
    });

    return accepted;
};

const createUserNotification = async ({ userId, type = 'SYSTEM', title, message, metadata = null }) => {
    if (!userId || !title || !message) return null;

    const normalizedUserId = Number(userId);
    const normalizedType = String(type || 'SYSTEM');
    const normalizedTitle = String(title || '').trim();
    const normalizedMessage = String(message || '').trim();

    if (!normalizedTitle || !normalizedMessage) return null;

    if (SKIP_DB) {
        const now = Date.now();
        const duplicated = mockNotifications.find((item) => (
            Number(item.user_id) === normalizedUserId
            && String(item.type || '') === normalizedType
            && String(item.title || '') === normalizedTitle
            && String(item.message || '') === normalizedMessage
            && (now - toTimeValue(item.createdAt)) <= CREATE_DEDUPE_WINDOW_MS
        ));

        if (duplicated) {
            return duplicated;
        }

        const payload = {
            id: nextMockId(),
            user_id: normalizedUserId,
            type: normalizedType,
            title: normalizedTitle,
            message: normalizedMessage,
            metadata,
            is_read: false,
            is_pinned: false,
            pinned_at: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        mockNotifications.unshift(payload);
        return payload;
    }

    const duplicated = await Notification.findOne({
        where: {
            user_id: normalizedUserId,
            type: normalizedType,
            title: normalizedTitle,
            message: normalizedMessage,
            createdAt: {
                [Op.gte]: new Date(Date.now() - CREATE_DEDUPE_WINDOW_MS),
            },
        },
        order: [['createdAt', 'DESC']],
    });

    if (duplicated) {
        return duplicated;
    }

    return Notification.create({
        user_id: normalizedUserId,
        type: normalizedType,
        title: normalizedTitle,
        message: normalizedMessage,
        metadata,
        is_read: false,
        is_pinned: false,
        pinned_at: null,
    });
};

const listNotificationsByUser = async (userId, limit = 30) => {
    if (!userId) return [];

    if (SKIP_DB) {
        const sorted = mockNotifications
            .filter((item) => Number(item.user_id) === Number(userId))
            .sort((a, b) => {
                const aPinned = a?.is_pinned ? 1 : 0;
                const bPinned = b?.is_pinned ? 1 : 0;
                if (aPinned !== bPinned) return bPinned - aPinned;

                const aTime = new Date(a?.createdAt || 0).getTime();
                const bTime = new Date(b?.createdAt || 0).getTime();
                return bTime - aTime;
            });

        const uniqueItems = dedupeNotificationItems(sorted);

        if (Number(limit) > 0) {
            return uniqueItems.slice(0, Number(limit));
        }

        return uniqueItems;
    }

    const query = {
        where: { user_id: Number(userId) },
        order: [['is_pinned', 'DESC'], ['pinned_at', 'DESC'], ['createdAt', 'DESC']],
    };

    if (Number(limit) > 0) {
        query.limit = Math.min(Number(limit) * 4, 1000);
    }

    const rows = await Notification.findAll(query);
    const uniqueRows = dedupeNotificationItems(rows);
    if (Number(limit) > 0) {
        return uniqueRows.slice(0, Number(limit));
    }

    return uniqueRows;
};

const markNotificationRead = async (userId, notificationId) => {
    if (!userId || !notificationId) return null;

    if (SKIP_DB) {
        const found = mockNotifications.find((item) => Number(item.id) === Number(notificationId) && Number(item.user_id) === Number(userId));
        if (!found) return null;
        found.is_read = true;
        found.updatedAt = new Date();
        return found;
    }

    const found = await Notification.findOne({
        where: {
            id: Number(notificationId),
            user_id: Number(userId),
        },
    });

    if (!found) return null;
    found.is_read = true;
    await found.save();
    return found;
};

const markAllNotificationsRead = async (userId) => {
    if (!userId) return 0;

    if (SKIP_DB) {
        let count = 0;
        mockNotifications.forEach((item) => {
            if (Number(item.user_id) === Number(userId) && !item.is_read) {
                item.is_read = true;
                item.updatedAt = new Date();
                count += 1;
            }
        });
        return count;
    }

    const [updated] = await Notification.update(
        { is_read: true },
        { where: { user_id: Number(userId), is_read: false } }
    );
    return updated;
};

const toggleNotificationPin = async (userId, notificationId, pinned = true) => {
    if (!userId || !notificationId) return null;

    if (SKIP_DB) {
        const found = mockNotifications.find((item) => Number(item.id) === Number(notificationId) && Number(item.user_id) === Number(userId));
        if (!found) return null;

        found.is_pinned = Boolean(pinned);
        found.pinned_at = found.is_pinned ? new Date() : null;
        found.updatedAt = new Date();
        return found;
    }

    const found = await Notification.findOne({
        where: {
            id: Number(notificationId),
            user_id: Number(userId),
        },
    });

    if (!found) return null;

    found.is_pinned = Boolean(pinned);
    found.pinned_at = found.is_pinned ? new Date() : null;
    await found.save();
    return found;
};

const deleteNotification = async (userId, notificationId) => {
    if (!userId || !notificationId) return false;

    if (SKIP_DB) {
        const idx = mockNotifications.findIndex((item) => Number(item.id) === Number(notificationId) && Number(item.user_id) === Number(userId));
        if (idx < 0) return false;
        mockNotifications.splice(idx, 1);
        return true;
    }

    const removed = await Notification.destroy({
        where: {
            id: Number(notificationId),
            user_id: Number(userId),
        },
    });

    return Number(removed) > 0;
};

module.exports = {
    createUserNotification,
    listNotificationsByUser,
    markNotificationRead,
    markAllNotificationsRead,
    toggleNotificationPin,
    deleteNotification,
};
