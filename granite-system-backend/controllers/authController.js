const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registerUser = async (req, res) => {
    try{
        const {name,email,password,role} = req.body;

        // Check user exists
        const userExists = await User.findOne({email});
        if(userExists){
            return res.status(400).json({message: 'User already exists.'});
        }

        // Hash passwords
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'Customer'

        });

        // Success Message
        if(user){
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
                message: 'User registered successfully!'
            });

        } else {
            res.status(400).json({message:'Invalid user data'});
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({message:'Server Error'});
    }
};

const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET,{
        expiresIn: '30d',
    });
};


const loginUser = async (req, res) => {
    try {
        const {email,password} = req.body;

        // Check User exists
        const user = await User.findOne({email});

        // Check password matches hashed password
        if(user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({message:'Inavlid Credentials'});
        }
    } catch(error) {
        console.error(error);
        res.status(500).json({message:'Servor Error'});
    }
};



module.exports = {
    registerUser,
    loginUser,
};