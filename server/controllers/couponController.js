const Coupon = require('../models/Coupon');
const Cart = require('../models/Cart');
const redisService = require('../services/redisService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// Default platform coupons
const defaultCoupons = {
  'WELCOME20': { type: 'percentage', value: 20, maxDiscount: 2000, minOrderAmount: 499, description: '20% off up to ₹2,000' },
  'PRIME10': { type: 'percentage', value: 10, maxDiscount: 1000, minOrderAmount: 299, description: '10% off up to ₹1,000' },
  'SAVE500': { type: 'fixed', value: 500, maxDiscount: 500, minOrderAmount: 2499, description: 'Flat ₹500 off on ₹2,499+' },
};

exports.createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create({
      ...req.body,
      createdBy: req.user._id,
      vendorId: req.user.role === 'vendor' ? req.user._id : null
    });
    return sendSuccess(res, 201, 'Coupon created', coupon);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

exports.getCoupons = async (req, res) => {
  try {
    const filter = req.user.role === 'vendor' ? { vendorId: req.user._id } : {};
    let coupons = await Coupon.find(filter).sort({ createdAt: -1 });

    if (!coupons || coupons.length === 0) {
      // Return default list for convenience
      coupons = Object.entries(defaultCoupons).map(([code, details]) => ({
        code,
        type: details.type,
        value: details.value,
        maxDiscount: details.maxDiscount,
        minOrderAmount: details.minOrderAmount,
        description: details.description,
        isActive: true,
      }));
    }

    return sendSuccess(res, 200, 'Coupons fetched', coupons);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

exports.validateCoupon = async (req, res) => {
  try {
    const { code, subtotal: bodySubtotal } = req.body;
    if (!code) return sendError(res, 400, 'Coupon code is required');

    const cleanCode = code.toUpperCase().trim();
    const userId = req.user?._id?.toString() || req.user?.id;

    // Check Cart from Redis or Mongo
    let cartSubtotal = typeof bodySubtotal === 'number' ? bodySubtotal : 0;
    let cart = null;

    if (userId) {
      const cached = await redisService.getCart(userId);
      if (cached && cached.totalAmount) {
        cartSubtotal = cartSubtotal || cached.totalAmount;
      }
      cart = await Cart.findOne({ userId });
      if (cart && cart.totalAmount) {
        cartSubtotal = cartSubtotal || cart.totalAmount;
      }
    }

    if (cartSubtotal <= 0) {
      cartSubtotal = 4999; // Default fallback for validation if cart not provided
    }

    let coupon = await Coupon.findOne({ code: cleanCode, isActive: true });

    // Fallback to built-in default promo codes
    if (!coupon && defaultCoupons[cleanCode]) {
      const def = defaultCoupons[cleanCode];
      try {
        coupon = await Coupon.create({
          code: cleanCode,
          type: def.type,
          value: def.value,
          maxDiscount: def.maxDiscount,
          minOrderAmount: def.minOrderAmount,
          isActive: true,
        });
      } catch {
        coupon = {
          code: cleanCode,
          type: def.type,
          value: def.value,
          maxDiscount: def.maxDiscount,
          minOrderAmount: def.minOrderAmount,
          isActive: true,
        };
      }
    }

    if (!coupon) {
      return sendError(res, 404, `Invalid promo code "${cleanCode}". Try WELCOME20 or PRIME10.`);
    }

    // Check min order amount
    if (cartSubtotal < (coupon.minOrderAmount || 0)) {
      return sendError(res, 400, `Minimum order amount for ${cleanCode} is ₹${coupon.minOrderAmount}`);
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (cartSubtotal * coupon.value) / 100;
      if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    } else {
      discountAmount = Math.min(coupon.value, cartSubtotal);
    }
    discountAmount = Math.round(discountAmount);

    // Save on cart if exists
    if (cart) {
      cart.couponApplied = { code: coupon.code, discountAmount, couponId: coupon._id };
      await cart.save();
    }

    return sendSuccess(res, 200, `Coupon ${cleanCode} applied successfully!`, {
      code: coupon.code,
      discountAmount,
      subtotal: cartSubtotal,
      finalAmount: Math.max(0, cartSubtotal - discountAmount),
      description: defaultCoupons[cleanCode]?.description || `${coupon.value}% discount applied`,
    });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

exports.removeCoupon = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    await Cart.findOneAndUpdate({ userId }, { couponApplied: null });
    return sendSuccess(res, 200, 'Coupon removed');
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

exports.toggleCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return sendError(res, 404, 'Coupon not found');
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    return sendSuccess(res, 200, `Coupon ${coupon.isActive ? 'activated' : 'deactivated'}`, coupon);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};
