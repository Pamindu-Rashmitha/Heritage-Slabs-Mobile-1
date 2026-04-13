const express = require('express');
const router = express.Router();
const {
    createOrder,
    getMyOrders,
    getAllOrders,
    completeSimulatedPayment,
    deleteOrder,
    generateInvoice
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getAllOrders)
    .post(protect, createOrder);

router.get('/myorders', protect, getMyOrders);
router.post('/:id/simulate-payment', protect, completeSimulatedPayment);
router.get('/:id/invoice', generateInvoice);

router.route('/:id')
    .delete(protect, deleteOrder);

module.exports = router;
