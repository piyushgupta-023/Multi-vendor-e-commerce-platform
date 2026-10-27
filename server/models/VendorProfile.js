const mongoose = require('mongoose');

const bankDetailsSchema = new mongoose.Schema({
  accountHolderName: String,
  accountNumber: String,
  ifscCode: String,
  bankName: String,
  upiId: String,
}, { _id: false });

const vendorProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  storeName: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
  storeSlug: { type: String, unique: true, lowercase: true },
  storeDescription: { type: String, maxlength: 1000 },
  logo: { type: String, default: '' },
  banner: { type: String, default: '' },
  category: { type: String },
  commissionRate: { type: Number, default: 10, min: 0, max: 50 }, // percentage
  bankDetails: bankDetailsSchema,
  payoutSchedule: { type: String, enum: ['weekly', 'biweekly', 'monthly'], default: 'monthly' },
  totalEarnings: { type: Number, default: 0 },
  pendingPayout: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalSales: { type: Number, default: 0 },
  isApproved: { type: Boolean, default: false },
  approvedAt: Date,
  rejectionReason: String,
  gstNumber: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' },
  },
}, { timestamps: true });

vendorProfileSchema.pre('save', function(next) {
  if (this.isModified('storeName')) {
    this.storeSlug = this.storeName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  next();
});

vendorProfileSchema.index({ userId: 1 });
vendorProfileSchema.index({ isApproved: 1 });
vendorProfileSchema.index({ storeSlug: 1 });

module.exports = mongoose.model('VendorProfile', vendorProfileSchema);
