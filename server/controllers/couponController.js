const Coupon = require('../models/Coupon');
const Cart = require('../models/Cart');
const { sendSuccess, sendError } = require('../utils/apiResponse');

exports.createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create({ ...req.body, createdBy: req.user._id, vendorId: req.user.role === 'vendor' ? req.user._id : null });
    return sendSuccess(res, 201, 'Coupon created', coupon);
  } catch (err) { return sendError(res, 500, err.message); }
};

exports.getCoupons = async (req, res) => {
  try {
    const filter = req.user.role === 'vendor' ? { vendorId: req.user._id } : {};
    const coupons = await Coupon.find(filter).sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Coupons fetched', coupons);
  } catch (err) { return sendError(res, 500, err.message); }
};

exports.validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart || cart.items.length === 0) return sendError(res, 400, 'Cart is empty');
    
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) return sendError(res, 404, 'Coupon not found or inactive');
    
    // Check expiry
    if (coupon.expiresAt && new Date() > coupon.expiresAt) return sendError(res, 400, 'Coupon has expired');
    
    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return sendError(res, 400, 'Coupon usage limit reached');
    
    // Check per-user limit
    const userUsageCount = coupon.usedBy.filter(u => u.toString() === req.user._id.toString()).length;
    if (userUsageCount >= coupon.perUserLimit) return sendError(res, 400, 'You have already used this coupon');
    
    // Check min order amount
    const cartSubtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
    if (cartSubtotal < coupon.minOrderAmount) return sendError(res, 400, `Minimum order amount is ₹${coupon.minOrderAmount}`);
    
    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (cartSubtotal * coupon.value) / 100;
      if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    } else {
      discountAmount = Math.min(coupon.value, cartSubtotal);
    }
    discountAmount = parseFloat(discountAmount.toFixed(2));
    
    // Apply coupon to cart
    cart.couponApplied = { code: coupon.code, discountAmount, couponId: coupon._id };
    await cart.save();
    
    return sendSuccess(res, 200, 'Coupon applied', { code: coupon.code, discountAmount, finalAmount: Math.max(0, cartSubtotal - discountAmount) });
  } catch (err) { return sendError(res, 500, err.message); }
};

exports.removeCoupon = async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ userId: req.user._id }, { couponApplied: null });
    return sendSuccess(res, 200, 'Coupon removed');
  } catch (err) { return sendError(res, 500, err.message); }
};

exports.toggleCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return sendError(res, 404, 'Coupon not found');
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    return sendSuccess(res, 200, `Coupon ${coupon.isActive ? 'activated' : 'deactivated'}`, coupon);
  } catch (err) { return sendError(res, 500, err.message); }
};
