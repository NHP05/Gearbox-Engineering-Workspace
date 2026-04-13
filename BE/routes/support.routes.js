const express = require('express');
const router = express.Router();
const supportController = require('../controllers/support.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');

router.post('/contact', verifyToken, supportController.createSupportTicket);
router.post('/tickets', verifyToken, supportController.createSupportTicket);
router.get('/my-tickets', verifyToken, supportController.getMySupportTickets);
router.get('/tickets/my', verifyToken, supportController.getMySupportTickets);
router.put('/tickets/:ticketId', verifyToken, supportController.editMySupportTicket);
router.put('/ticket/:ticketId', verifyToken, supportController.editMySupportTicket);
router.delete('/tickets/:ticketId', verifyToken, supportController.deleteMySupportTicket);
router.delete('/ticket/:ticketId', verifyToken, supportController.deleteMySupportTicket);
router.get('/tickets', verifyToken, requireAdmin, supportController.getAllSupportTickets);
router.get('/admin/tickets', verifyToken, requireAdmin, supportController.getAllSupportTickets);
router.put('/tickets/:ticketId/ban', verifyToken, requireAdmin, supportController.banSupportTicket);
router.put('/ticket/:ticketId/ban', verifyToken, requireAdmin, supportController.banSupportTicket);
router.delete('/tickets/:ticketId/admin-delete', verifyToken, requireAdmin, supportController.deleteSupportTicketAsAdmin);
router.delete('/ticket/:ticketId/admin-delete', verifyToken, requireAdmin, supportController.deleteSupportTicketAsAdmin);
router.post('/tickets/:ticketId/message', verifyToken, supportController.replyMySupportTicket);
router.post('/tickets/:ticketId/messages', verifyToken, supportController.replyMySupportTicket);
router.post('/ticket/:ticketId/message', verifyToken, supportController.replyMySupportTicket);
router.post('/ticket/:ticketId/messages', verifyToken, supportController.replyMySupportTicket);
router.post('/tickets/:ticketId/reply', verifyToken, requireAdmin, supportController.replySupportTicket);
router.post('/ticket/:ticketId/reply', verifyToken, requireAdmin, supportController.replySupportTicket);
router.post('/ai-hint', supportController.aiHint);

module.exports = router;
