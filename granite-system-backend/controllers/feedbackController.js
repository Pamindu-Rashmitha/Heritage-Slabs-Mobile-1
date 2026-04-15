const FeedbackTicket = require('../models/FeedbackTicket');

// ─── Customer ────────────────────────────────────────────────────────────────

// POST /api/feedback  — create a new ticket
exports.createTicket = async (req, res) => {
    try {
        const { subject, message } = req.body;
        if (!subject || !message) {
            return res.status(400).json({ message: 'subject and message are required.' });
        }

        // Validate subject — min 3 chars, must contain at least one letter
        const subjectTrimmed = String(subject).trim();
        if (subjectTrimmed.length < 3) {
            return res.status(400).json({ message: 'Subject must be at least 3 characters.' });
        }
        if (!/[a-zA-Z]/.test(subjectTrimmed)) {
            return res.status(400).json({ message: 'Subject must contain at least one letter.' });
        }

        // Validate message — min 5 chars, must contain at least one letter
        const messageTrimmed = String(message).trim();
        if (messageTrimmed.length < 5) {
            return res.status(400).json({ message: 'Message must be more than 5 characters.' });
        }
        if (!/[a-zA-Z]/.test(messageTrimmed)) {
            return res.status(400).json({ message: 'Message must contain at least one letter.' });
        }

        const ticket = await FeedbackTicket.create({
            user: req.user.id,
            subject,
            messages: [{ sender: 'user', text: message }],
        });

        await ticket.populate('user', 'name email');
        res.status(201).json(ticket);
    } catch (err) {
        console.error('createTicket error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/feedback/mine  — customer sees their own tickets
exports.getMyTickets = async (req, res) => {
    try {
        const tickets = await FeedbackTicket.find({ user: req.user.id })
            .sort({ updatedAt: -1 });
        res.json(tickets);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/feedback/:id  — customer reads one ticket (must own it)
exports.getTicket = async (req, res) => {
    try {
        const ticket = await FeedbackTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        // Allow admin or ticket owner
        if (
            ticket.user.toString() !== req.user.id &&
            req.user.role !== 'Admin'
        ) {
            return res.status(403).json({ message: 'Not authorised' });
        }

        res.json(ticket);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/feedback/:id/message  — customer sends a follow-up message
exports.sendMessage = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ message: 'text is required' });

        const ticket = await FeedbackTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        if (ticket.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorised' });
        }

        if (ticket.isFrozen) {
            return res.status(403).json({ message: 'This conversation has been closed by admin. Please open a new ticket.' });
        }

        ticket.messages.push({ sender: 'user', text });
        if (ticket.status === 'PENDING') ticket.status = 'ONGOING';
        await ticket.save();

        res.json(ticket);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── Admin ────────────────────────────────────────────────────────────────────

// GET /api/admin/feedback  — all tickets
exports.getAllTickets = async (req, res) => {
    try {
        const tickets = await FeedbackTicket.find()
            .populate('user', 'name email')
            .sort({ updatedAt: -1 });
        res.json(tickets);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/admin/feedback/:id/reply  — admin sends a message
exports.adminReply = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ message: 'text is required' });

        const ticket = await FeedbackTicket.findById(req.params.id).populate('user', 'name email');
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        if (ticket.isFrozen) {
            return res.status(403).json({ message: 'This conversation is frozen. Unfreeze the ticket before replying.' });
        }

        ticket.messages.push({ sender: 'admin', text });
        if (ticket.status === 'PENDING') ticket.status = 'ONGOING';
        await ticket.save();

        res.json(ticket);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// PATCH /api/admin/feedback/:id/status  — change status
exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ['PENDING', 'ONGOING', 'RESOLVED'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const ticket = await FeedbackTicket.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('user', 'name email');

        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
        res.json(ticket);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// PATCH /api/admin/feedback/:id/freeze  — toggle freeze
exports.toggleFreeze = async (req, res) => {
    try {
        const ticket = await FeedbackTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        ticket.isFrozen = !ticket.isFrozen;
        await ticket.save();
        res.json({ isFrozen: ticket.isFrozen });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};
