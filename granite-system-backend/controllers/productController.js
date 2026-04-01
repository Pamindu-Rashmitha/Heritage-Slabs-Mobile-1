const Product = require('../models/Product');

const createProduct = async (req, res) => {
    try{
        const { stoneName, pricePerSqFt, stockInSqFt } = req.body;

        const imagePath = req.file ? `/${req.file.path.replace(/\\/g, '/')}` : null;

        const product = await Product.create({
            user: req.user.id,
            stoneName,
            pricePerSqFt,
            stockInSqFt,
            imageUrl: imagePath,
        });

        res.status(201).json(product);
    
    } catch (error){
        console.error(error);
        res.status(500).json({message:'Servor Error'})
    }
};

const getProducts = async (req, res) => {
    try{
        const products = await Product.find({});
        res.status(200).json({products});
    } catch(error){
        console.error(error);
        res.status(500).json({message:'Server Error'});
    }
};

const updateProduct = async (req, res) => {
    try {
        let product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check for user ownership
        if (product.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized to update this product' });
        }

        const { stoneName, pricePerSqFt, stockInSqFt } = req.body;

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { stoneName, pricePerSqFt, stockInSqFt },
            { new: true, runValidators: true }
        );

        res.status(200).json(updatedProduct);
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Product ID format' });
        }
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check for user ownership
        if (product.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized to delete this product' });
        }

        await product.deleteOne();
        res.status(200).json({ id: req.params.id, message: 'Product deleted' });

    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Product ID format' });
        }
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};



module.exports = {createProduct, getProducts, updateProduct, deleteProduct};