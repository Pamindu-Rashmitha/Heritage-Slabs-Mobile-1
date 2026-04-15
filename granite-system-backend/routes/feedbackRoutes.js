const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
    createTicket,
    getMyTickets,
    getTicket,
    sendMessage,
    getAllTickets,
    adminReply,
    updateStatus,
    toggleFreeze,
} = require('../controllers/feedbackController');

// ── Customer ──────────────────────────────────────────────────────────────────
router.post('/', protect, createTicket);
router.get('/mine', protect, getMyTickets);
router.get('/:id', protect, getTicket);
router.post('/:id/message', protect, sendMessage);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get('/admin/all', protect, adminOnly, getAllTickets);
router.post('/admin/:id/reply', protect, adminOnly, adminReply);
router.patch('/admin/:id/status', protect, adminOnly, updateStatus);
router.patch('/admin/:id/freeze', protect, adminOnly, toggleFreeze);

module.exports = router;
