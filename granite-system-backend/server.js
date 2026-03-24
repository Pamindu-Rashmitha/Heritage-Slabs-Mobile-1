require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Allows us to accept JSON data in the body of requests
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));



// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Successfully connected to MongoDB Atlas!');
        // Only start the server if the database connects
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Database connection failed:', error.message);
    });