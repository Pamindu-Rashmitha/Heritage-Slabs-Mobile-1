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
const { productValidation, validate } = require('../middleware/validationMiddleware');

router.route('/').get(getProducts).post(protect, upload.single('image'), productValidation, validate, createProduct);
router.route('/:id').put(protect, productValidation, validate, updateProduct).delete(protect, deleteProduct);

module.exports = router;