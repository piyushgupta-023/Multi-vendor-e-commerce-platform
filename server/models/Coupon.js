const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ['percentage', 'fixed'], required: true },
  value: { type: Number, required: true, min: 0 },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount: { type: Number }, // cap for percentage discounts
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = platform-wide
  applicableCategories: [String],
  usageLimit: { type: Number, default: null }, // null = unlimited
  usedCount: { type: Number, default: 0 },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  perUserLimit: { type: Number, default: 1 },
  expiresAt: { type: Date },
  isActive: { type: Boolean, default: true },
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, expiresAt: 1 });
couponSchema.index({ vendorId: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
