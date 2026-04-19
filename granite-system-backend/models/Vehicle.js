const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    licensePlate: {
        type: String,
        required: [true, 'License plate is required'],
        unique: true,
        match: [/^[A-Za-z]{2,3}-\d{4}$/, 'License plate format invalid. Example: ABC-1234']
    },
    type: {
        type: String,
        required: [true, 'Vehicle type is required']
    },
    capacity: {
        type: Number,
        required: [true, 'Capacity is required'],
        min: [100, 'Capacity must be at least 100'],
        max: [3500, 'Capacity must not exceed 3500']
    },
    status: {
        type: String,
        enum: ['AVAILABLE', 'IN_TRANSIT', 'MAINTENANCE'],
        default: 'AVAILABLE'
    }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
