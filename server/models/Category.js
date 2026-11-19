const mongoose = require('mongoose');

const slugify = (name) => {
  const normalizedName = name.toLowerCase().trim();
  const slug = normalizedName.replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug || normalizedName.replace(/\s+/g, '-');
};

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, maxlength: 500, default: '' },
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

categorySchema.pre('validate', function() {
  if (this.isModified('name') && this.name) {
    this.slug = slugify(this.name);
  }
});

categorySchema.index({ parentCategory: 1, isActive: 1, sortOrder: 1 });

categorySchema.statics.findOrCreateByName = function(name) {
  const normalizedName = String(name).trim();
  if (!normalizedName) {
    throw new Error('Category name is required.');
  }

  const slug = slugify(normalizedName);
  return this.findOneAndUpdate(
    { slug },
    { $setOnInsert: { name: normalizedName, slug } },
    { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).catch((error) => {
    if (error.code !== 11000) throw error;
    return this.findOne({ slug });
  });
};

module.exports = mongoose.model('Category', categorySchema);
