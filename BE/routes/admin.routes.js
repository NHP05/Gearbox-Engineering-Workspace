const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');

router.get('/users', verifyToken, requireAdmin, adminController.listUsers);
router.put('/users/:id/ban', verifyToken, requireAdmin, adminController.banUser);
router.delete('/users/:id', verifyToken, requireAdmin, adminController.deleteUserAsAdmin);
router.post('/users/:id/reveal-password', verifyToken, requireAdmin, adminController.revealUserPassword);
router.put('/users/:id/role', verifyToken, requireAdmin, adminController.changeUserRole);

router.get('/projects', verifyToken, requireAdmin, adminController.listProjects);
router.delete('/projects/:id', verifyToken, requireAdmin, adminController.deleteProjectAsAdmin);
router.get('/action-logs', verifyToken, requireAdmin, adminController.listAdminActionLogs);
router.put('/action-logs/read-all', verifyToken, requireAdmin, adminController.markAllAdminActionLogsRead);
router.put('/action-logs/:id/read', verifyToken, requireAdmin, adminController.markAdminActionLogRead);

module.exports = router;
