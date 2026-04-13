const express = require('express');
const router = express.Router();
const {
    getCart,
    addToCart,
    updateItemQuantity,
    removeItemFromCart,
    clearCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getCart)
    .post(addToCart)
    .delete(clearCart);

router.route('/:id')
    .put(updateItemQuantity)
    .delete(removeItemFromCart);

module.exports = router;
