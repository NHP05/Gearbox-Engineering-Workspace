const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/my', verifyToken, notificationController.getMyNotifications);
router.put('/:id/read', verifyToken, notificationController.readNotification);
router.put('/read-all', verifyToken, notificationController.readAllNotifications);
router.put('/:id/pin', verifyToken, notificationController.pinNotification);
router.delete('/:id', verifyToken, notificationController.removeNotification);

module.exports = router;
