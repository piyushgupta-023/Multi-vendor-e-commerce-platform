const mongoose = require('mongoose');

const paymentSplitSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  subOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubOrder' },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  grossAmount: { type: Number, required: true },
  commissionRate: { type: Number, required: true },
  commissionAmount: { type: Number, required: true },
  netPayout: { type: Number, required: true },
  payoutStatus: { type: String, enum: ['pending', 'processing', 'paid', 'failed'], default: 'pending' },
  paymentGateway: { type: String, enum: ['razorpay', 'stripe', 'manual'] },
  razorpayTransferId: String,
  stripeTransferId: String,
  processedAt: Date,
  failureReason: String,
}, { timestamps: true });

paymentSplitSchema.index({ orderId: 1 });
paymentSplitSchema.index({ vendorId: 1, payoutStatus: 1 });

module.exports = mongoose.model('PaymentSplit', paymentSplitSchema);
