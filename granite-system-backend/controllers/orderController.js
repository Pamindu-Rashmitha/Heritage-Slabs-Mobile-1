const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const PDFDocument = require('pdfkit');
const { sendOrderConfirmation } = require('../middleware/emailService');

const PROVINCE_CITY_MAP = {
    Western: ['Colombo', 'Gampaha', 'Kalutara'],
    Central: ['Kandy', 'Matale', 'Nuwara Eliya'],
    Southern: ['Galle', 'Matara', 'Hambantota'],
    Northern: ['Jaffna', 'Kilinochchi', 'Mannar', 'Mullaitivu', 'Vavuniya'],
    Eastern: ['Trincomalee', 'Batticaloa', 'Ampara'],
    'North Western': ['Kurunegala', 'Puttalam'],
    'North Central': ['Anuradhapura', 'Polonnaruwa'],
    Uva: ['Badulla', 'Monaragala'],
    Sabaragamuwa: ['Ratnapura', 'Kegalle'],
};

const normalizeLabel = (value) =>
    String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');

// @desc    Create new order from cart
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
    try {
        const shipping = req.body.shippingDetails || {};
        const phoneDigits = String(shipping.phone || '').replace(/\D/g, '');
        const isValidSLPhone =
            /^(?:0\d{9}|94\d{9})$/.test(phoneDigits) ||
            /^(?:\+94)\d{9}$/.test(String(shipping.phone || '').trim());
        if (!isValidSLPhone) {
            return res.status(400).json({ message: 'Invalid Sri Lankan phone number' });
        }
        if (!/^\d{5}$/.test(String(shipping.zip || '').trim())) {
            return res.status(400).json({ message: 'Postal code must be 5 digits' });
        }
        const provinceKey = Object.keys(PROVINCE_CITY_MAP).find(
            (key) => normalizeLabel(key) === normalizeLabel(shipping.province)
        );
        if (!provinceKey) {
            return res.status(400).json({ message: 'Invalid province' });
        }
        const cityIsValid = PROVINCE_CITY_MAP[provinceKey].some(
            (city) => normalizeLabel(city) === normalizeLabel(shipping.city)
        );
        if (!cityIsValid) {
            return res.status(400).json({ message: `City must belong to ${provinceKey}` });
        }

        const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
        
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        const totalAmount = cart.items.reduce((acc, item) => acc + (item.product.pricePerSqFt * item.quantity), 0);

        const order = new Order({
            user: req.user.id,
            items: cart.items.map(item => ({
                product: item.product._id,
                quantity: item.quantity,
                price: item.product.pricePerSqFt
            })),
            totalAmount: totalAmount,
            status: 'Pending',
            shippingDetails: {
                firstName: shipping.firstName,
                lastName: shipping.lastName,
                email: shipping.email,
                phone: shipping.phone,
                address: shipping.address,
                province: provinceKey,
                city: shipping.city,
                country: shipping.country || 'Sri Lanka',
                zip: shipping.zip,
                orderNote: shipping.orderNote
            }
        });

        const createdOrder = await order.save();
        
        // Clear cart after order creation
        cart.items = [];
        await cart.save();

        res.status(201).json(createdOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).populate('items.product').sort('-createdAt');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Not authorized as an admin' });
        }
        const orders = await Order.find({}).populate('user', 'name email').populate('items.product').sort('-createdAt');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark order paid (simulated payment — demo only)
// @route   POST /api/orders/:id/simulate-payment
// @access  Private
const completeSimulatedPayment = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (order.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        if (order.status !== 'Pending') {
            return res.status(400).json({ message: 'Order is not awaiting payment' });
        }

        const transactionId =
            typeof req.body.transactionId === 'string' && req.body.transactionId.trim().length > 0
                ? req.body.transactionId.trim().slice(0, 64)
                : `SIM-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        order.status = 'Paid';
        order.paymentId = transactionId;
        await order.save();

        const user = await User.findById(order.user);
        const emailTarget = order.shippingDetails?.email || user?.email;
        if (emailTarget) {
            try {
                await sendOrderConfirmation(
                    {
                        name: user?.name || `${order.shippingDetails?.firstName || ''} ${order.shippingDetails?.lastName || ''}`.trim() || 'Customer',
                        email: emailTarget,
                    },
                    order
                );
            } catch (emailError) {
                console.error('Order confirmation email failed:', emailError.message);
            }
        } else {
            console.error('Order confirmation email skipped: no recipient email found');
        }

        res.json({ message: 'Payment recorded', transactionId: order.paymentId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const resolveAuthUser = async (req) => {
    if (req.user && req.user.id) return req.user;

    const header = req.headers.authorization || '';
    const bearerToken = header.startsWith('Bearer ') ? header.split(' ')[1] : null;
    const queryToken = typeof req.query.token === 'string' ? req.query.token : null;
    const token = bearerToken || queryToken;
    if (!token) return null;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const authUser = await User.findById(decoded.id).select('-password');
        return authUser || null;
    } catch (_) {
        return null;
    }
};

// @desc    Delete a pending order
// @route   DELETE /api/orders/:id
// @access  Private
const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.user.toString() !== req.user.id && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Not authorized to delete this order' });
        }

        if (order.status !== 'Pending' && req.user.role !== 'Admin') {
            return res.status(400).json({ message: 'Only pending orders can be deleted/cancelled' });
        }

        await Order.findByIdAndDelete(req.params.id);
        res.json({ message: 'Order removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Generate Invoice PDF
// @route   GET /api/orders/:id/invoice
// @access  Private
const generateInvoice = async (req, res) => {
    try {
        const authUser = await resolveAuthUser(req);
        if (!authUser) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }

        const order = await Order.findById(req.params.id).populate('user', 'name email').populate('items.product');
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.user._id.toString() !== authUser.id && authUser.role !== 'Admin') {
            return res.status(403).json({ message: 'Not authorized to access this invoice' });
        }

        const doc = new PDFDocument({ margin: 50 });
        let filename = `invoice_${order._id}.pdf`;
        res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-type', 'application/pdf');

        // Header
        doc.fillColor('#2a9d8f').fontSize(20).text('HERITAGE SLABS', { align: 'right' });
        doc.fillColor('#444444').fontSize(10).text('123 Granite Road, Colombo, Sri Lanka', { align: 'right' });
        doc.text('vijithagranite@gmail.com', { align: 'right' });
        doc.moveDown();

        doc.fillColor('#1e2235').fontSize(16).text('INVOICE', { underline: true });
        doc.fontSize(10).text(`Order ID: ${order._id}`);
        doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
        doc.text(`Status: ${order.status}`);
        doc.moveDown();

        // Customer Details
        doc.text(`Bill To:`, { fontWeight: 'bold' });
        doc.text(`${order.shippingDetails.firstName} ${order.shippingDetails.lastName}`);
        doc.text(`Phone: ${order.shippingDetails.phone}`);
        doc.text(`${order.shippingDetails.address}`);
        doc.text(`${order.shippingDetails.city}, ${order.shippingDetails.zip}`);
        doc.text(`${order.shippingDetails.country}`);
        doc.moveDown();

        // Table Header
        const tableTop = 270;
        doc.fontSize(10).text('Item', 50, tableTop, { bold: true });
        doc.text('Quantity', 250, tableTop, { bold: true });
        doc.text('Price/SqFt', 350, tableTop, { bold: true });
        doc.text('Total', 450, tableTop, { bold: true });
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        let runningY = tableTop + 25;
        order.items.forEach(item => {
            doc.text(item.product.stoneName, 50, runningY);
            doc.text(item.quantity.toString(), 250, runningY);
            doc.text(`LKR ${item.price.toLocaleString()}`, 350, runningY);
            doc.text(`LKR ${(item.price * item.quantity).toLocaleString()}`, 450, runningY);
            runningY += 20;
        });

        doc.moveTo(50, runningY).lineTo(550, runningY).stroke();
        doc.fontSize(12).text(`Grand Total: LKR ${order.totalAmount.toLocaleString()}`, 400, runningY + 15, { bold: true });

        doc.end();
        doc.pipe(res);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getAllOrders,
    completeSimulatedPayment,
    deleteOrder,
    generateInvoice
};
