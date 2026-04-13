const {
    listNotificationsByUser,
    markNotificationRead,
    markAllNotificationsRead,
    toggleNotificationPin,
    deleteNotification,
} = require('../services/notification.service');

const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized.' });
        }

        const requestedLimit = Number(req.query?.limit);
        const limit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? requestedLimit : 100;
        const items = await listNotificationsByUser(userId, limit);
        return res.status(200).json({ success: true, data: items });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const readNotification = async (req, res) => {
    try {
        const userId = req.user?.id;
        const notificationId = req.params?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized.' });
        }

        const item = await markNotificationRead(userId, notificationId);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Notification not found.' });
        }

        return res.status(200).json({ success: true, data: item, message: 'Notification marked as read.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const readAllNotifications = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized.' });
        }

        const updated = await markAllNotificationsRead(userId);
        return res.status(200).json({ success: true, message: 'All notifications marked as read.', data: { updated } });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const pinNotification = async (req, res) => {
    try {
        const userId = req.user?.id;
        const notificationId = req.params?.id;
        const pinned = Boolean(req.body?.pinned);

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized.' });
        }

        const item = await toggleNotificationPin(userId, notificationId, pinned);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Notification not found.' });
        }

        return res.status(200).json({
            success: true,
            data: item,
            message: pinned ? 'Notification pinned.' : 'Notification unpinned.',
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const removeNotification = async (req, res) => {
    try {
        const userId = req.user?.id;
        const notificationId = req.params?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized.' });
        }

        const removed = await deleteNotification(userId, notificationId);
        if (!removed) {
            return res.status(404).json({ success: false, message: 'Notification not found.' });
        }

        return res.status(200).json({ success: true, message: 'Notification deleted.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getMyNotifications,
    readNotification,
    readAllNotifications,
    pinNotification,
    removeNotification,
};
