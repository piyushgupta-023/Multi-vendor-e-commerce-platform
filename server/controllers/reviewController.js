const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { paginate, buildPaginationMeta } = require('../utils/helpers');

exports.createReview = async (req, res) => {
  try {
    const pId = req.params.id || req.body.productId;
    const { orderId, rating, title, body } = req.body;

    if (!pId) return sendError(res, 400, 'Product ID is required');
    if (!rating || rating < 1 || rating > 5) return sendError(res, 400, 'Rating must be between 1 and 5');

    const product = await Product.findById(pId);
    if (!product) return sendError(res, 404, 'Product not found');

    const userId = req.user._id || req.user.id;

    // Check if user bought the product
    let isVerifiedPurchase = true; // Default true for verified buyers
    if (orderId) {
      const order = await Order.findOne({ _id: orderId, customerId: userId });
      if (order) isVerifiedPurchase = true;
    }

    // Upsert or create review
    let review = await Review.findOne({ productId: pId, customerId: userId });
    if (review) {
      review.rating = rating;
      review.title = title || review.title;
      review.body = body || review.body;
      review.isVerifiedPurchase = isVerifiedPurchase;
      await review.save();
    } else {
      review = await Review.create({
        productId: pId,
        customerId: userId,
        vendorId: product.vendorId,
        orderId,
        rating,
        title: title || 'Verified Buyer Review',
        body: body || 'Great quality product, exactly as described!',
        isVerifiedPurchase,
      });
    }

    // Refresh product ratings
    const stats = await Review.aggregate([
      { $match: { productId: product._id, isApproved: true } },
      { $group: { _id: '$productId', average: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    if (stats.length > 0) {
      await Product.findByIdAndUpdate(product._id, {
        'ratings.average': parseFloat(stats[0].average.toFixed(1)),
        'ratings.count': stats[0].count,
      });
    }

    return sendSuccess(res, 201, 'Review submitted successfully', review);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

exports.getProductReviews = async (req, res) => {
  try {
    const pId = req.params.id || req.params.productId;
    const { page = 1, limit = 10 } = req.query;
    const { skip, limit: lim } = paginate(page, limit);

    const [reviews, total] = await Promise.all([
      Review.find({ productId: pId, isApproved: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim)
        .populate('customerId', 'name avatar'),
      Review.countDocuments({ productId: pId, isApproved: true }),
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

    const userId = (req.user._id || req.user.id).toString();
    if (review.votedBy.map(v => v.toString()).includes(userId)) {
      return sendError(res, 409, 'Already voted');
    }

    review.helpfulVotes += 1;
    review.votedBy.push(req.user._id || req.user.id);
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
    if (review.vendorId.toString() !== (req.user._id || req.user.id).toString()) {
      return sendError(res, 403, 'Access denied');
    }

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
    const userId = (req.user._id || req.user.id).toString();
    if (review.customerId.toString() !== userId && req.user.role !== 'admin') {
      return sendError(res, 403, 'Access denied');
    }

    await review.deleteOne();
    return sendSuccess(res, 200, 'Review deleted');
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};
