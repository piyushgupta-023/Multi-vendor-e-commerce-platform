const { body, param, query, validationResult } = require('express-validator');

// Auth validators
const validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['customer', 'vendor']).withMessage('Invalid role'),
  body('storeName').if(body('role').equals('vendor')).notEmpty().withMessage('Store name required for vendors'),
];

const validateLogin = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Product validators
const validateProduct = [
  body().custom((value) => {
    if (!value || typeof value !== 'object') return false;
    const name = value.name || value.title;
    return typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 200;
  }).withMessage('Product name is required and must be 200 characters or fewer'),
  body('name').optional().trim().isLength({ max: 200 }),
  body('title').optional().trim().isLength({ max: 200 }),
  body('description').notEmpty().withMessage('Description is required').isLength({ max: 5000 }),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').notEmpty().withMessage('Category is required'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
];

// Coupon validators
const validateCoupon = [
  body('code').trim().notEmpty().toUpperCase().withMessage('Coupon code is required'),
  body('type').isIn(['percentage', 'fixed']).withMessage('Type must be percentage or fixed'),
  body('value').isFloat({ min: 0 }).withMessage('Value must be a positive number'),
  body('minOrderAmount').optional().isFloat({ min: 0 }),
  body('expiresAt').optional().isISO8601().withMessage('Invalid date format'),
];

// Review validators
const validateReview = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('productId').isMongoId().withMessage('Invalid product ID'),
  body('title').optional().isLength({ max: 100 }),
  body('body').optional().isLength({ max: 2000 }),
];

// Middleware to handle validation result
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateProduct,
  validateCoupon,
  validateReview,
  validate,
};
