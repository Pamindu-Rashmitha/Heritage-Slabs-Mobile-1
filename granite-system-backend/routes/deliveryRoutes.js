const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, deliveryController.getAllDeliveries);
router.get('/orders/ready', protect, deliveryController.getReadyOrders);
router.post('/assign', protect, deliveryController.assignDelivery);
router.patch('/:id/status', protect, deliveryController.updateDeliveryStatus);

module.exports = router;