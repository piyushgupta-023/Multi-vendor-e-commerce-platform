const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, maxlength: 100 },
  body: { type: String, maxlength: 2000 },
  images: [{ url: String, key: String }],
  isVerifiedPurchase: { type: Boolean, default: false },
  helpfulVotes: { type: Number, default: 0 },
  votedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isApproved: { type: Boolean, default: true },
  vendorReply: {
    text: String,
    repliedAt: Date,
  },
}, { timestamps: true });

// One review per customer per product
reviewSchema.index({ productId: 1, customerId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, rating: -1 });
reviewSchema.index({ vendorId: 1 });

// Update product rating on review save
reviewSchema.post('save', async function() {
  const Product = require('./Product');
  const stats = await this.constructor.aggregate([
    { $match: { productId: this.productId, isApproved: true } },
    { $group: { _id: '$productId', average: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(this.productId, {
      'ratings.average': parseFloat(stats[0].average.toFixed(1)),
      'ratings.count': stats[0].count,
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema);
