const { body, param, validationResult } = require('express-validator');


const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const registerValidation = [
    body('name')
        .notEmpty().withMessage('Name is required')
        .isString().withMessage('Name must be a string'),
    body('email')
        .isEmail().withMessage('Please include a valid email'),
    body('password')
        .isStrongPassword({
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
        })
        .withMessage('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

const loginValidation = [
    body('email')
        .isEmail().withMessage('Valid email is required for login'),
    body('password')
        .notEmpty().withMessage('Password must be provided')
];

const productValidation = [
    body('stoneName')
        .notEmpty().withMessage('Stone name is required')
        .isString().withMessage('Stone name must be a text string')
        .trim()
        .escape()
        .isLength({ min: 3, max: 15 }).withMessage('Stone name must be between 3 and 15 characters'),
    body('pricePerSqFt')
        .notEmpty().withMessage('Price per square foot is required')
        .isFloat({ min: 0.01 }).withMessage('Price per square foot must be a positive numeric value greater than 0'),
    body('stockInSqFt')
        .notEmpty().withMessage('Stock in square foot is required')
        .isFloat({ min: 0 }).withMessage('Stock in square foot must be a non-negative numeric value')
];

const idValidation = [
    param('id').isMongoId().withMessage('Invalid product ID format')
];

module.exports = {
    validate,
    registerValidation,
    loginValidation,
    productValidation,
    idValidation
};
