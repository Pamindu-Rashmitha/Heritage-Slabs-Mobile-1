const express = require('express');
const router = express.Router();
const {
    createProduct,
    getProducts,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');
const {protect} = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/').get(getProducts).post(protect, upload.single('image'), createProduct);
router.route('/:id').put(protect, updateProduct).delete(protect, deleteProduct);

module.exports = router;