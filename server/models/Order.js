const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  image: String,
  price: Number,
  quantity: Number,
  subtotal: Number,
}, { _id: true });

const orderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderNumber: { type: String, unique: true },
  items: [orderItemSchema],
  shippingAddress: {
    name: String,
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String,
    phone: String,
  },
  totalAmount: { type: Number, required: true },
  subtotal: { type: Number },
  shippingCharge: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  orderStatus: { type: String, enum: ['placed', 'packed', 'shipped', 'delivered', 'cancelled'], default: 'placed' },
  deliveredAt: Date,
  paymentMethod: { type: String, enum: ['razorpay', 'stripe', 'cod'], default: 'razorpay' },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  stripePaymentIntentId: String,
  couponApplied: { code: String, discountAmount: Number },
  invoiceUrl: String,
  notes: String,
}, { timestamps: true });

orderSchema.pre('save', async function() {
  if (!this.orderNumber) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = `ORD-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
  }
});

orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
