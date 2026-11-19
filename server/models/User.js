const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' },
  street: String,
  city: String,
  state: String,
  pincode: String,
  country: { type: String, default: 'India' },
  isDefault: { type: Boolean, default: false },
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
  email: { type: String, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  password: { type: String, minlength: 6, select: false },
  role: { type: String, enum: ['customer', 'vendor', 'admin'], default: 'customer' },
  avatar: { type: String, default: '' },
  googleId: { type: String },
  authProvider: { type: String, enum: ['local', 'google', 'phone', 'firebase'], default: 'local' },
  addresses: [addressSchema],
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  lastLoginAt: Date,
  refreshToken: { type: String, select: false },
}, { timestamps: true });

// Pre-save hook with Mongoose 7/8/9 async compatibility (no next callback)
userSchema.pre('save', async function() {
  if (!this.isModified('password') || !this.password) return;
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ phone: 1 }, { unique: true, sparse: true });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
