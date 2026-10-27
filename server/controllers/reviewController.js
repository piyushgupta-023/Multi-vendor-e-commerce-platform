const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { paginate, buildPaginationMeta } = require('../utils/helpers');

exports.createReview = async (req, res) => {
  try {
    const { productId, orderId, rating, title, body } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) return sendError(res, 404, 'Product not found');
    
    // Check if user actually bought the product
    let isVerifiedPurchase = false;
    if (orderId) {
      const order = await Order.findOne({ _id: orderId, customerId: req.user._id, paymentStatus: 'paid' });
      if (order) {
        isVerifiedPurchase = order.items.some(i => i.productId.toString() === productId);
      }
    }
    
    const existing = await Review.findOne({ productId, customerId: req.user._id });
    if (existing) return sendError(res, 409, 'You have already reviewed this product');
    
    const review = await Review.create({
      productId,
      customerId: req.user._id,
      vendorId: product.vendorId,
      orderId,
      rating,
      title,
      body,
      isVerifiedPurchase,
    });
    
    return sendSuccess(res, 201, 'Review submitted', review);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

exports.getProductReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { skip, limit: lim } = paginate(page, limit);
    
    const [reviews, total] = await Promise.all([
      Review.find({ productId: req.params.productId, isApproved: true })
        .sort({ createdAt: -1 }).skip(skip).limit(lim)
        .populate('customerId', 'name avatar'),
      Review.countDocuments({ productId: req.params.productId, isApproved: true }),
    ]);
    
    return sendSuccess(res, 200, 'Reviews fetched', reviews, buildPaginationMeta(total, page, lim));
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

exports.markHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return sendError(res, 404, 'Review not found');
    
    const userId = req.user._id.toString();
    if (review.votedBy.map(v => v.toString()).includes(userId)) {
      return sendError(res, 409, 'Already voted');
    }
    
    review.helpfulVotes += 1;
    review.votedBy.push(req.user._id);
    await review.save();
    
    return sendSuccess(res, 200, 'Marked as helpful', { helpfulVotes: review.helpfulVotes });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

exports.vendorReplyToReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return sendError(res, 404, 'Review not found');
    if (review.vendorId.toString() !== req.user._id.toString()) return sendError(res, 403, 'Access denied');
    
    review.vendorReply = { text: req.body.text, repliedAt: new Date() };
    await review.save();
    
    return sendSuccess(res, 200, 'Reply added', review);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return sendError(res, 404, 'Review not found');
    if (review.customerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendError(res, 403, 'Access denied');
    }
    await review.deleteOne();
    return sendSuccess(res, 200, 'Review deleted');
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};
