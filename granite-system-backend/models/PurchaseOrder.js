const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
    poNumber: {
        type: String,
        unique: true,
    },
    supplierName: {
        type: String,
        required: true,
        trim: true,
    },
    supplierContact: {
        type: String,
        trim: true,
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true,
            },
            stoneName: { type: String, required: true },
            quantityInSqFt: { type: Number, required: true },
            unitPrice: { type: Number, required: true },
            subtotal: { type: Number, required: true },
        },
    ],
    totalAmount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['Draft', 'Ordered', 'Received', 'Cancelled'],
        default: 'Draft',
    },
    expectedDeliveryDate: {
        type: Date,
    },
    notes: {
        type: String,
        trim: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});

purchaseOrderSchema.pre('save', async function () {
    if (!this.poNumber) {
        const year = new Date().getFullYear();
        const suffix = Date.now().toString().slice(-6);
        this.poNumber = `PO-${year}-${suffix}`;
    }
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
