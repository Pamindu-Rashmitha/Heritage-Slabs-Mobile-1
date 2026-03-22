const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    stoneName: {
        type: String,
        required: true,
    },
    pricePerSqFt: {
        type: Number,
        required: true,
    },
    stockInSqFt: {
        type: Number,
        required: true,
    },
    imageUrl: {
        type: String,
        required: false
    }
},{
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema);