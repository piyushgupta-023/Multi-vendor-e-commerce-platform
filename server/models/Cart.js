const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: String,
  image: String,
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  stock: Number,
}, { _id: true });

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
  couponApplied: {
    code: String,
    discountAmount: { type: Number, default: 0 },
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
  },
  totalAmount: { type: Number, default: 0 },
  totalItems: { type: Number, default: 0 },
}, { timestamps: true });

cartSchema.pre('save', function(next) {
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.totalAmount = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  if (this.couponApplied?.discountAmount) {
    this.totalAmount = Math.max(0, this.totalAmount - this.couponApplied.discountAmount);
  }
  next();
});

cartSchema.index({ userId: 1 });

module.exports = mongoose.model('Cart', cartSchema);
