const User = require('../models/User');
const VendorProfile = require('../models/VendorProfile');
const Product = require('../models/Product');
const Order = require('../models/Order');
const SubOrder = require('../models/SubOrder');
const PaymentSplit = require('../models/PaymentSplit');
const Review = require('../models/Review');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { paginate, buildPaginationMeta } = require('../utils/helpers');

exports.getDashboard = async (req, res) => {
  try {
    const [
      totalUsers, totalVendors, totalProducts, totalOrders,
      pendingVendors, revenueAgg, recentOrders
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'vendor' }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      VendorProfile.countDocuments({ isApproved: false }),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, totalCommission: { $sum: '$commissionAmount' } } }
      ]),
      Order.find().sort({ createdAt: -1 }).limit(5).populate('customerId', 'name email'),
    ]);
    
    return sendSuccess(res, 200, 'Admin dashboard', {
      stats: {
        totalUsers, totalVendors, totalProducts, totalOrders, pendingVendors,
        totalRevenue: revenueAgg[0]?.totalRevenue || 0,
      },
      recentOrders,
    });
  } catch (err) { return sendError(res, 500, err.message); }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    const { skip, limit: lim } = paginate(page, limit);
    const filter = role ? { role } : {};
    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(lim),
      User.countDocuments(filter),
    ]);
    return sendSuccess(res, 200, 'Users fetched', users, buildPaginationMeta(total, page, lim));
  } catch (err) { return sendError(res, 500, err.message); }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, 'User not found');
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    return sendSuccess(res, 200, `User ${user.isActive ? 'activated' : 'suspended'}`, { isActive: user.isActive });
  } catch (err) { return sendError(res, 500, err.message); }
};

exports.getPendingVendors = async (req, res) => {
  try {
    const vendors = await VendorProfile.find({ isApproved: false }).populate('userId', 'name email createdAt').sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Pending vendors', vendors);
  } catch (err) { return sendError(res, 500, err.message); }
};

exports.approveVendor = async (req, res) => {
  try {
    const profile = await VendorProfile.findByIdAndUpdate(
      req.params.id,
      { isApproved: true, approvedAt: new Date(), rejectionReason: null },
      { new: true }
    );
    if (!profile) return sendError(res, 404, 'Vendor profile not found');
    return sendSuccess(res, 200, 'Vendor approved', profile);
  } catch (err) { return sendError(res, 500, err.message); }
};

exports.rejectVendor = async (req, res) => {
  try {
    const profile = await VendorProfile.findByIdAndUpdate(
      req.params.id,
      { isApproved: false, rejectionReason: req.body.reason },
      { new: true }
    );
    if (!profile) return sendError(res, 404, 'Vendor profile not found');
    return sendSuccess(res, 200, 'Vendor rejected', profile);
  } catch (err) { return sendError(res, 500, err.message); }
};

exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const { skip, limit: lim } = paginate(page, limit);
    const filter = status ? { paymentStatus: status } : {};
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim).populate('customerId', 'name email'),
      Order.countDocuments(filter),
    ]);
    return sendSuccess(res, 200, 'Orders fetched', orders, buildPaginationMeta(total, page, lim));
  } catch (err) { return sendError(res, 500, err.message); }
};

exports.getPaymentSplits = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const { skip, limit: lim } = paginate(page, limit);
    const filter = status ? { payoutStatus: status } : {};
    const [splits, total] = await Promise.all([
      PaymentSplit.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim)
        .populate('vendorId', 'name email')
        .populate('orderId', 'orderNumber totalAmount'),
      PaymentSplit.countDocuments(filter),
    ]);
    return sendSuccess(res, 200, 'Payment splits fetched', splits, buildPaginationMeta(total, page, lim));
  } catch (err) { return sendError(res, 500, err.message); }
};

exports.updateCommissionRate = async (req, res) => {
  try {
    const profile = await VendorProfile.findByIdAndUpdate(
      req.params.vendorProfileId,
      { commissionRate: req.body.commissionRate },
      { new: true }
    );
    if (!profile) return sendError(res, 404, 'Vendor profile not found');
    return sendSuccess(res, 200, 'Commission rate updated', profile);
  } catch (err) { return sendError(res, 500, err.message); }
};

exports.moderateReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved: req.body.isApproved },
      { new: true }
    );
    if (!review) return sendError(res, 404, 'Review not found');
    return sendSuccess(res, 200, `Review ${review.isApproved ? 'approved' : 'hidden'}`, review);
  } catch (err) { return sendError(res, 500, err.message); }
};

exports.featureProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isFeatured: req.body.isFeatured },
      { new: true }
    );
    if (!product) return sendError(res, 404, 'Product not found');
    return sendSuccess(res, 200, `Product ${product.isFeatured ? 'featured' : 'unfeatured'}`, product);
  } catch (err) { return sendError(res, 500, err.message); }
};
