const Product = require('../models/Product');

const createProduct = async (req, res) => {
    try{
        const {stoneName, pricePerSqFt, stockInSqFt} = req.body;

        if(!stoneName || !pricePerSqFt || !stockInSqFt){
            return res.status(400).json({message: 'Please add all required fields'});
        }

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
        const product = await Product.findById(req.params.id);

        if(!product){
            return res.status(404).json({message:'Product not found'});
        }

        const updatedProduct = await Product.findByIdAndUpdate (
            req.params.id,
            req.body,
            {new: true}
        );

        res.status(200).json(updatedProduct);
    } catch(error) {
        console.error(error);
        res.status(500).json({message:'Server Error'})
    }
};

const deleteProduct = async (req, res) => {
    try{
        const product = await Product.findById(req.params.id);

        if(!product){
            return res.status(404).json({message:'Product not found'});
        }

        await product.deleteOne();
        res.status(200).json({id: req.params.id, message:'Product deleted'});

    } catch(error){
        console.error(error);
        res.status(500).json({message:'Server Error'});
    }
};



module.exports = {createProduct, getProducts, updateProduct, deleteProduct};