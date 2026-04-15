const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: String,
            enum: ['user', 'admin'],
            required: true,
        },
        text: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { timestamps: true }
);

const feedbackTicketSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        subject: {
            type: String,
            required: true,
            trim: true,
        },
        messages: [messageSchema],
        status: {
            type: String,
            enum: ['PENDING', 'ONGOING', 'RESOLVED'],
            default: 'PENDING',
        },
        isFrozen: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('FeedbackTicket', feedbackTicketSchema);
