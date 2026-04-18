const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        length: 10
    },
    suppliedMaterial: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        default: 5.0,
        min: 0,
        max: 5
    }
}, { timestamps: true });

// Normalize the id property for the frontend
supplierSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
    }
});

module.exports = mongoose.model('Supplier', supplierSchema);
