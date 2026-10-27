const express = require('express');
const router = express.Router();
const { createCoupon, getCoupons, validateCoupon, removeCoupon, toggleCoupon } = require('../controllers/couponController');
const { protect, authorize } = require('../middlewares/auth');
const { validateCoupon: validateCouponInput, validate } = require('../utils/validators');

// Apply coupon to cart
router.post('/apply', protect, authorize('customer'), validateCoupon);
router.delete('/remove', protect, authorize('customer'), removeCoupon);

// Vendor coupon management
router.get('/', protect, authorize('vendor', 'admin'), getCoupons);
router.post('/', protect, authorize('vendor', 'admin'), validateCouponInput, validate, createCoupon);
router.patch('/:id/toggle', protect, authorize('vendor', 'admin'), toggleCoupon);

module.exports = router;
