const Review = require('../models/Review');
const Order = require('../models/Order');

// ─── Customer ────────────────────────────────────────────────────────────────

// POST /api/reviews
// Only allowed if the user has a Paid/Shipped/Delivered order containing this product
exports.createReview = async (req, res) => {
    try {
        const { productId, rating, title, comment } = req.body;

        if (!productId || !rating || !title || !comment) {
            return res.status(400).json({ message: 'productId, rating, title and comment are required.' });
        }

        // Validate rating
        const ratingNum = Number(rating);
        if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({ message: 'Rating must be a whole number between 1 and 5.' });
        }

        // Validate title — min 3 chars, must contain at least one letter
        const titleTrimmed = String(title).trim();
        if (titleTrimmed.length < 3) {
            return res.status(400).json({ message: 'Title must be at least 3 characters.' });
        }
        if (!/[a-zA-Z]/.test(titleTrimmed)) {
            return res.status(400).json({ message: 'Title must contain at least one letter.' });
        }

        // Validate comment — min 5 chars, must contain at least one letter
        const commentTrimmed = String(comment).trim();
        if (commentTrimmed.length < 5) {
            return res.status(400).json({ message: 'Comment must be more than 5 characters.' });
        }
        if (!/[a-zA-Z]/.test(commentTrimmed)) {
            return res.status(400).json({ message: 'Comment must contain at least one letter.' });
        }

        // Check purchase
        const hasPurchased = await Order.findOne({
            user: req.user.id,
            status: { $in: ['Paid', 'Shipped', 'Delivered'] },
            'items.product': productId,
        });

        if (!hasPurchased) {
            return res.status(403).json({ message: 'You can only review products you have purchased.' });
        }

        // One review per product per user
        const existing = await Review.findOne({ product: productId, user: req.user.id });
        if (existing) {
            return res.status(409).json({ message: 'You have already reviewed this product.' });
        }

        // Auto-reply based on rating
        const autoReply =
            rating >= 4
                ? 'Thank you for your fantastic feedback! We\'re so pleased to hear you had a great experience with our product. Your satisfaction means the world to us. — Heritage Slabs Team'
                : 'We\'re truly sorry to hear your experience was not satisfactory. This isn\'t our standard. Please contact us directly so we can resolve this for you. — Heritage Slabs Team';

        const review = await Review.create({
            product: productId,
            user: req.user.id,
            rating,
            title,
            comment,
            adminReply: autoReply,
            replyDate: new Date(),
            isFlagged: rating <= 3,
        });

        await review.populate('user', 'name email');
        await review.populate('product', 'stoneName');

        res.status(201).json(review);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: 'You have already reviewed this product.' });
        }
        console.error('createReview error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/reviews/product/:productId  — public, anyone can read reviews
exports.getReviewsByProduct = async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.productId })
            .populate('user', 'name')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/reviews/:id  — customer deletes their own review
exports.deleteOwnReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ message: 'Review not found' });
        if (review.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorised' });
        }
        await review.deleteOne();
        res.json({ message: 'Review deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── Admin ────────────────────────────────────────────────────────────────────

// GET /api/admin/reviews
exports.getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('user', 'name email')
            .populate('product', 'stoneName')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/admin/reviews/flagged
exports.getFlaggedReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ isFlagged: true })
            .populate('user', 'name email')
            .populate('product', 'stoneName')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/admin/reviews/:id/reply  — admin updates (personalises) the reply
exports.updateReply = async (req, res) => {
    try {
        const { reply } = req.body;
        if (!reply) return res.status(400).json({ message: 'reply is required' });

        const review = await Review.findByIdAndUpdate(
            req.params.id,
            { adminReply: reply, replyDate: new Date() },
            { new: true }
        )
            .populate('user', 'name email')
            .populate('product', 'stoneName');

        if (!review) return res.status(404).json({ message: 'Review not found' });
        res.json(review);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// PATCH /api/admin/reviews/:id/flag
exports.toggleFlag = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ message: 'Review not found' });
        review.isFlagged = !review.isFlagged;
        await review.save();
        res.json({ isFlagged: review.isFlagged });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/admin/reviews/:id
exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);
        if (!review) return res.status(404).json({ message: 'Review not found' });
        res.json({ message: 'Review deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};
