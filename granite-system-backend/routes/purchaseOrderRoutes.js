const express = require('express');
const router = express.Router();
const {
    createPurchaseOrder,
    getPurchaseOrders,
    getPurchaseOrderById,
    updatePurchaseOrder,
    deletePurchaseOrder,
} = require('../controllers/purchaseOrderController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getPurchaseOrders)
    .post(protect, createPurchaseOrder);

router.route('/:id')
    .get(protect, getPurchaseOrderById)
    .put(protect, updatePurchaseOrder)
    .delete(protect, deletePurchaseOrder);

module.exports = router;
