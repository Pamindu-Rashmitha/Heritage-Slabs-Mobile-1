const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
    createReview,
    getReviewsByProduct,
    deleteOwnReview,
    getAllReviews,
    getFlaggedReviews,
    updateReply,
    toggleFlag,
    deleteReview,
} = require('../controllers/reviewController');

// ── Customer / Public ─────────────────────────────────────────────────────────
router.get('/product/:productId', getReviewsByProduct);
router.post('/', protect, createReview);
router.delete('/:id', protect, deleteOwnReview);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get('/admin/all', protect, adminOnly, getAllReviews);
router.get('/admin/flagged', protect, adminOnly, getFlaggedReviews);
router.put('/admin/:id/reply', protect, adminOnly, updateReply);
router.patch('/admin/:id/flag', protect, adminOnly, toggleFlag);
router.delete('/admin/:id', protect, adminOnly, deleteReview);

module.exports = router;
