import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  UploadCloud, 
  Image as ImageIcon, 
  Check, 
  X, 
  Plus, 
  Trash2, 
  Star, 
  RefreshCw, 
  IndianRupee, 
  Tag, 
  Layers
} from 'lucide-react';
import api from '../../api/axios';
import { useStore } from '../../store/useStore';

const CATEGORIES = [
  { name: 'Electronics', subcategories: ['Audio', 'Smartphones', 'Laptops & PCs', 'Cameras', 'Accessories'] },
  { name: 'Fashion', subcategories: ['Men Clothing', 'Women Clothing', 'Footwear', 'Watches', 'Bags & Luggage'] },
  { name: 'Home & Living', subcategories: ['Furniture', 'Decor', 'Kitchenware', 'Lighting', 'Bedding'] },
  { name: 'Sports & Fitness', subcategories: ['Exercise Gear', 'Outdoor Recreation', 'Sports Apparel', 'Supplements'] },
  { name: 'Food & Gourmet', subcategories: ['Organic Staples', 'Artisan Snacks', 'Beverages', 'Chocolates'] },
  { name: 'Beauty & Personal Care', subcategories: ['Skincare', 'Fragrances', 'Haircare', 'Bath & Body'] },
];

export default function VendorProductFormPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { showToast, addProductToStore, updateProductInStore } = useStore();

  const fileInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    description: '',
    category: 'Electronics',
    subcategory: 'Audio',
    price: '',
    comparePrice: '',
    stock: '',
    sku: '',
    weight: '0.5',
    isFeatured: true,
    tags: '',
  });

  // Images: array of { url: string, isPrimary: boolean }
  const [images, setImages] = useState([]);
  const [manualImageUrl, setManualImageUrl] = useState('');

  // Specs: array of { key: string, value: string }
  const [specs, setSpecs] = useState([
    { key: 'Brand', value: '' },
    { key: 'Warranty', value: '1 Year Manufacturer' },
  ]);

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isEditMode) return;

    let isMounted = true;
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        if (isMounted && res.data?.success) {
          const p = res.data.data;
          setFormData({
            title: p.name || p.title || '',
            summary: p.summary || p.description?.slice(0, 100) || '',
            description: p.description || '',
            category: p.category || 'Electronics',
            subcategory: p.subcategory || '',
            price: p.price !== undefined ? String(p.price) : '',
            comparePrice: (p.comparePrice || p.discountPrice) ? String(p.comparePrice || p.discountPrice) : '',
            stock: p.stock !== undefined ? String(p.stock) : '0',
            sku: p.sku || '',
            weight: p.weight ? String(p.weight) : '0.5',
            isFeatured: Boolean(p.isFeatured),
            tags: Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
          });

          if (p.images && p.images.length > 0) {
            setImages(p.images.map((img, idx) => typeof img === 'string' ? { url: img, isPrimary: idx === 0 } : img));
          }

          if (p.attributes || p.specs) {
            const rawSpecs = p.attributes || p.specs;
            const specList = [];
            if (rawSpecs instanceof Map) {
              rawSpecs.forEach((val, key) => specList.push({ key, value: val }));
            } else if (typeof rawSpecs === 'object') {
              Object.entries(rawSpecs).forEach(([key, val]) => specList.push({ key, value: String(val) }));
            }
            if (specList.length > 0) setSpecs(specList);
          }
        }
      } catch (err) {
        showToast?.('Could not load product details for editing', 'error');
        navigate('/vendor/products');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProduct();
    return () => { isMounted = false; };
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleCategoryChange = (e) => {
    const newCat = e.target.value;
    const catObj = CATEGORIES.find(c => c.name === newCat);
    setFormData(prev => ({
      ...prev,
      category: newCat,
      subcategory: catObj?.subcategories[0] || '',
    }));
  };

  // Image Upload handler
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadData = new FormData();
    Array.from(files).forEach((file) => {
      uploadData.append('images', file);
    });
    uploadData.append('folder', 'products');

    try {
      const res = await api.post('/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success && res.data.data?.urls) {
        const newUrls = res.data.data.urls.map((url, idx) => ({
          url,
          isPrimary: images.length === 0 && idx === 0,
        }));
        setImages(prev => [...prev, ...newUrls]);
        showToast?.(`${newUrls.length} image(s) processed`, 'success');
      } else {
        throw new Error(res.data?.message || 'Upload failed');
      }
    } catch (err) {
      showToast?.('Image upload failed. You can paste a public URL below.', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddManualImage = () => {
    if (!manualImageUrl.trim()) return;
    setImages(prev => [
      ...prev,
      { url: manualImageUrl.trim(), isPrimary: prev.length === 0 }
    ]);
    setManualImageUrl('');
  };

  const handleSetPrimary = (index) => {
    setImages(prev => prev.map((img, idx) => ({
      ...img,
      isPrimary: idx === index,
    })));
  };

  const handleRemoveImage = (index) => {
    setImages(prev => {
      const next = prev.filter((_, idx) => idx !== index);
      if (next.length > 0 && !next.some(img => img.isPrimary)) {
        next[0].isPrimary = true;
      }
      return next;
    });
  };

  // Specs helper
  const handleSpecChange = (index, field, val) => {
    setSpecs(prev => {
      const updated = [...prev];
      updated[index][field] = val;
      return updated;
    });
  };

  const handleAddSpec = () => {
    setSpecs(prev => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveSpec = (index) => {
    setSpecs(prev => prev.filter((_, idx) => idx !== index));
  };

  // Validation
  const validateForm = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Title is required';
    if (!formData.price || parseFloat(formData.price) <= 0) errs.price = 'Valid price required';
    if (formData.stock === '' || parseInt(formData.stock, 10) < 0) errs.stock = 'Valid stock count required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast?.('Please resolve highlighted form fields', 'error');
      return;
    }

    setSaving(true);

    const attributesObj = {};
    specs.forEach(s => {
      if (s.key.trim() && s.value.trim()) {
        attributesObj[s.key.trim()] = s.value.trim();
      }
    });

    const payload = {
      title: formData.title.trim(),
      name: formData.title.trim(),
      summary: formData.summary.trim(),
      description: formData.description.trim() || formData.summary.trim(),
      category: formData.category,
      subcategory: formData.subcategory,
      price: parseFloat(formData.price),
      discountPrice: formData.comparePrice ? parseFloat(formData.comparePrice) : undefined,
      comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : undefined,
      stock: parseInt(formData.stock, 10),
      sku: formData.sku.trim() || undefined,
      weight: parseFloat(formData.weight) || 0.5,
      isFeatured: formData.isFeatured,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      images: images.length > 0 ? images : [{ url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&fit=crop&q=80', isPrimary: true }],
      specs: attributesObj,
      attributes: attributesObj,
    };

    try {
      if (isEditMode) {
        const res = await api.put(`/products/${id}`, payload);
        if (res.data?.success) {
          updateProductInStore?.(res.data.data || { ...payload, _id: id });
          showToast?.('Product updated successfully', 'success');
          navigate('/vendor/products');
        } else {
          throw new Error(res.data?.message || 'Update failed');
        }
      } else {
        const res = await api.post('/products', payload);
        if (res.data?.success) {
          addProductToStore?.(res.data.data || payload);
          showToast?.('Product created and published to marketplace catalog', 'success');
          navigate('/vendor/products');
        } else {
          throw new Error(res.data?.message || 'Creation failed');
        }
      }
    } catch (err) {
      showToast?.(err.response?.data?.message || err.message || 'Error saving product', 'error');
    } finally {
      setSaving(false);
    }
  };

  const discountPercent = (formData.price && formData.comparePrice && parseFloat(formData.comparePrice) > parseFloat(formData.price))
    ? Math.round(((parseFloat(formData.comparePrice) - parseFloat(formData.price)) / parseFloat(formData.comparePrice)) * 100)
    : 0;

  if (loading) {
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
        <RefreshCw size={22} className="animate-spin text-indigo-500" />
        <p className="text-xs">Loading studio data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Studio Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            to="/vendor/products"
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Back to inventory"
          >
            <ArrowLeft size={15} />
          </Link>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {isEditMode ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p className="text-xs text-slate-400">
              {isEditMode ? 'Update catalog attributes and inventory counts' : 'Publish an item directly to the customer marketplace'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/vendor/products"
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-800 transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>{isEditMode ? 'Save Changes' : 'Publish Product'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Structured Two-Column Layout */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Main Details (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Card 1: Main Details */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              General Info
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Product Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Sony WH-1000XM5 Studio Headphones"
                className={`w-full bg-slate-950 border ${errors.title ? 'border-rose-500' : 'border-slate-800'} rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-600`}
              />
              {errors.title && <p className="text-[11px] text-rose-400 mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Short Summary
              </label>
              <input
                type="text"
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                placeholder="One sentence buyer-facing highlight"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Rich-Text Description
              </label>
              <textarea
                name="description"
                rows={5}
                value={formData.description}
                onChange={handleChange}
                placeholder="Full technical overview, acoustic specifications, warranty conditions, and in-box items..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-600 resize-y"
              />
            </div>
          </div>

          {/* Card 2: Organization & Categories */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Categorization & Search Index
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Primary Category <span className="text-rose-400">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleCategoryChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-600"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.name} value={c.name} className="bg-slate-900 text-white">{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Subcategory
                </label>
                <select
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-600"
                >
                  {(CATEGORIES.find(c => c.name === formData.category)?.subcategories || []).map(sub => (
                    <option key={sub} value={sub} className="bg-slate-900 text-white">{sub}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Tags (Comma-separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="e.g. hifi, wireless, bluetooth 5.3, pro"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-600"
              />
              <p className="text-[10px] text-slate-500 mt-1">Boosts Elasticsearch keyword relevance on customer search.</p>
            </div>
          </div>

          {/* Card 3: Specs & Attributes */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Specifications & Attributes
              </h3>
              <button
                type="button"
                onClick={handleAddSpec}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
              >
                <Plus size={12} /> Add Row
              </button>
            </div>

            <div className="space-y-2">
              {specs.map((s, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Attribute (e.g. Color)"
                    value={s.key}
                    onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-600"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. Midnight Black)"
                    value={s.value}
                    onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSpec(idx)}
                    className="p-2 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Pricing, Inventory, Media (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card 1: Pricing & Margins */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-3.5 shadow-sm">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Pricing & Margins
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Sale Price (₹) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs">₹</span>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="29990.00"
                  className={`w-full bg-slate-950 border ${errors.price ? 'border-rose-500' : 'border-slate-800'} rounded-lg pl-7 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-600`}
                />
              </div>
              {errors.price && <p className="text-[11px] text-rose-400 mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Compare / Base Price (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs">₹</span>
                <input
                  type="number"
                  step="0.01"
                  name="comparePrice"
                  value={formData.comparePrice}
                  onChange={handleChange}
                  placeholder="34990.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-600"
                />
              </div>
              {discountPercent > 0 && (
                <span className="inline-block text-[10px] text-emerald-400 font-medium mt-1">
                  Customer savings: {discountPercent}% off retail
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Inventory Tracker */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-3.5 shadow-sm">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Inventory Tracker
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Stock Quantity <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                placeholder="50"
                className={`w-full bg-slate-950 border ${errors.stock ? 'border-rose-500' : 'border-slate-800'} rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-600`}
              />
              {errors.stock && <p className="text-[11px] text-rose-400 mt-1">{errors.stock}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                SKU Identifier
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="PROD-AUTO"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Card 3: Image Upload Dropzone */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Product Media ({images.length})
              </h3>
              <span className="text-[10px] text-slate-400">AWS S3 & Local</span>
            </div>

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileUpload(e.dataTransfer.files);
              }}
              className="border-2 border-dashed border-slate-800 hover:border-indigo-600/60 rounded-xl p-5 text-center cursor-pointer transition-colors bg-slate-950/40"
            >
              <input
                type="file"
                multiple
                accept="image/*"
                ref={fileInputRef}
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />

              <div className="flex flex-col items-center gap-2">
                {uploading ? (
                  <RefreshCw size={20} className="animate-spin text-indigo-400" />
                ) : (
                  <UploadCloud size={22} className="text-slate-400" />
                )}
                <p className="text-xs font-medium text-slate-300">
                  {uploading ? 'Uploading to storage...' : 'Drop images here or click to browse'}
                </p>
                <p className="text-[10px] text-slate-500">PNG, JPG, WEBP up to 5MB</p>
              </div>
            </div>

            {/* Manual URL input fallback */}
            <div className="flex gap-1.5 pt-1">
              <input
                type="url"
                placeholder="Or paste public image URL"
                value={manualImageUrl}
                onChange={(e) => setManualImageUrl(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-slate-500 outline-none"
              />
              <button
                type="button"
                onClick={handleAddManualImage}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
              >
                Add
              </button>
            </div>

            {/* Thumbnails list */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-2">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`relative rounded-lg overflow-hidden border ${
                      img.isPrimary ? 'border-indigo-500 ring-1 ring-indigo-500/40' : 'border-slate-800'
                    } aspect-square group bg-slate-950`}
                  >
                    <img
                      src={img.url}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {img.isPrimary && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded text-[8px] font-bold bg-indigo-600 text-white">
                        Primary
                      </span>
                    )}

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      {!img.isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(idx)}
                          className="p-1 rounded bg-slate-800 text-white hover:text-indigo-400"
                          title="Set Primary"
                        >
                          <Star size={11} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1 rounded bg-slate-800 text-rose-400 hover:text-rose-300"
                        title="Remove"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 4: Catalog Visibility */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-2">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="isFeatured"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-800 focus:ring-indigo-500"
              />
              <label htmlFor="isFeatured" className="text-xs text-slate-300 font-medium cursor-pointer">
                Promote on Homepage Showcase
              </label>
            </div>
          </div>

        </div>

      </form>
    </div>
  );
}
