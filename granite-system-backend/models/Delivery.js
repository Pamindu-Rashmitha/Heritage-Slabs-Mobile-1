const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order', 
        required: [true, 'Order ID is required']
    },
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: [true, 'Vehicle ID is required']
    },
    driverName: {
        type: String,
        required: [true, 'Driver name is required']
    },
    estimatedTime: {
        type: String
    },
    status: {
        type: String,
        enum: ['PENDING', 'SHIPPED', 'DELIVERED'],
        default: 'PENDING'
    }
}, { timestamps: true }); 

module.exports = mongoose.model('Delivery', deliverySchema);
