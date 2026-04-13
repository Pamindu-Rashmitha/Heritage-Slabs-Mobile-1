const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'Product'
            },
            quantity: {
                type: Number,
                required: true
            },
            price: {
                type: Number,
                required: true
            }
        }
    ],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed', 'Cancelled'],
        default: 'Pending'
    },
    paymentId: {
        type: String
    },
    shippingDetails: {
        firstName: String,
        lastName: String,
        email: String,
        phone: String,
        address: String,
        province: String,
        city: String,
        country: { type: String, default: 'Sri Lanka' },
        zip: String,
        orderNote: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
