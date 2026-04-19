const Delivery = require('../models/Delivery');
const Vehicle = require('../models/Vehicle');
const Order = require('../models/Order');

const getAllDeliveries = async (req, res) => {
    try {
        const deliveries = await Delivery.find({})
            .populate('order')
            .populate('vehicle')
            .sort({ createdAt: -1 });
        res.status(200).json(deliveries);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching deliveries' });
    }
};

const getReadyOrders = async (req, res) => {
    try {
        // Fetch orders that are Paid but not yet Shipped/Delivered
        const orders = await Order.find({ status: 'Paid' }).populate('user', 'name email');
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching ready orders' });
    }
};

const assignDelivery = async (req, res) => {
    try {
        const { orderId, vehicleId, driverName, estimatedTime } = req.body;

        // 1. Create the delivery record
        const delivery = await Delivery.create({
            order: orderId,
            vehicle: vehicleId,
            driverName,
            estimatedTime,
            status: 'SHIPPED'
        });

        // 2. Update the Vehicle status so it can't be double-booked
        await Vehicle.findByIdAndUpdate(vehicleId, { status: 'IN_TRANSIT' });

        // 3. Update the Order status
        await Order.findByIdAndUpdate(orderId, { status: 'Shipped' });

        const populatedDelivery = await Delivery.findById(delivery._id).populate('vehicle').populate('order');
        res.status(201).json(populatedDelivery);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server error assigning delivery' });
    }
};

const updateDeliveryStatus = async (req, res) => {
    try {
        const { status } = req.body; // Expecting 'DELIVERED'
        const delivery = await Delivery.findById(req.params.id);
        
        if (!delivery) return res.status(404).json({ message: 'Delivery not found' });

        delivery.status = status;
        await delivery.save();

        // If the delivery is done, free up the truck and mark order delivered!
        if (status === 'DELIVERED') {
            await Vehicle.findByIdAndUpdate(delivery.vehicle, { status: 'AVAILABLE' });
            await Order.findByIdAndUpdate(delivery.order, { status: 'Delivered' });
        }

        res.status(200).json(delivery);
    } catch (error) {
        res.status(500).json({ message: 'Server error updating delivery' });
    }
};

module.exports = { getAllDeliveries, getReadyOrders, assignDelivery, updateDeliveryStatus };
