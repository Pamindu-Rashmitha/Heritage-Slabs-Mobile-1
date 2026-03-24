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

const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        
        if(!user){
            return res.status(404).json({message:'User not found'});
        }

        if(req.body.name){
            user.name = req.body.name;
        }
        if(req.body.email){
            user.email = req.body.email;
        }
        if(req.body.password){
            user.password = req.body.password;
        }

        const updatedUser = await user.save();
        res.status(200).json({
            message:'User updated successfuly!',
            user:{id:updatedUser.id, name: updatedUser.name, email:updatedUser.email, password: updatedUser.password}
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({message:'Servor Error'})
    }
};

const deleteUser = async (req, res) =>{
    try {
        const userId = req.params.id;
        const deletedUser = await User.findByIdAndDelete(userId);

        if(!deletedUser){
            return res.status(404).json({message:'User not found'});
        }

        res.status(200).json({message:'User deleted successfully!'});
    } catch (error) {
        console.error(error);
        res.status(500).json({message:'Servor Error'})
    }
};

const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');

        if(!users){
            return res.status(404).json({message:'Users not found'});
        }
        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({message:'Servor Error'});
    }
};

const getUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).select('-password');

        if(!user){
            return res.status(404).json({message:'User not found'});
        }
        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({message:'Servor Error'});
    }
};

module.exports = {
    registerUser,
    loginUser,
    updateUser,
    deleteUser,
    getUser,
    getUsers
};