const mongoose = require('mongoose');

const dimensionsSchema = new mongoose.Schema({
  length: Number,
  width: Number,
  height: Number,
  unit: { type: String, default: 'cm' },
}, { _id: false });

const productSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vendorProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorProfile' },
  name: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 5000 },
  price: { type: Number, required: true, min: 0 },
  comparePrice: { type: Number, min: 0 }, // MRP / original price
  costPrice: { type: Number, min: 0 }, // for profit calculation
  category: { type: String, required: true, index: true },
  subcategory: { type: String, index: true },
  tags: [{ type: String, lowercase: true }],
  images: [{ url: String, key: String, isPrimary: { type: Boolean, default: false } }],
  stock: { type: Number, required: true, min: 0, default: 0 },
  sku: { type: String, unique: true, sparse: true },
  weight: { type: Number }, // in grams
  dimensions: dimensionsSchema,
  ratings: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
  },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  elasticsearchId: { type: String }, // ES document ID
  attributes: { type: Map, of: String }, // flexible key-value (size, color, brand, etc.)
  shippingInfo: {
    isFreeShipping: { type: Boolean, default: false },
    shippingCost: { type: Number, default: 0 },
    estimatedDays: { type: Number, default: 5 },
  },
  totalSold: { type: Number, default: 0 },
}, { timestamps: true });

productSchema.index({ vendorId: 1 });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' }); // MongoDB text search fallback
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
