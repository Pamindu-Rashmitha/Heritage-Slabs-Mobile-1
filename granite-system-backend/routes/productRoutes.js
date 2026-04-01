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
const { productValidation, idValidation, validate } = require('../middleware/validationMiddleware');

router.route('/').get(getProducts).post(protect, upload.single('image'), productValidation, validate, createProduct);
router.route('/:id').put(protect, idValidation, productValidation, validate, updateProduct).delete(protect, idValidation, validate, deleteProduct);

module.exports = router;