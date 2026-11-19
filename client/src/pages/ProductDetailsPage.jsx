import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, 
  ShoppingCart, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Heart, 
  Store, 
  ChevronRight, 
  AlertCircle,
  Loader2,
  Lock,
} from 'lucide-react';
import api from '../services/api';
import { useStore } from '../store/useStore';
import { useAuth } from '../context/AuthContext';
import ProductImage from '../components/ui/ProductImage';
import { getProductImageCandidates } from '../utils/productImages';

const formatPrice = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, wishlist, toggleWishlist, showToast } = useStore();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fetch product by ID
  useEffect(() => {
    let isMounted = true;
    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/products/${id}`);
        if (!isMounted) return;
        if (res.data?.success && res.data.data) {
          setProduct(res.data.data);
          setActiveImageIndex(0);
        } else {
          setError('Product details could not be found.');
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Product not found.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProduct();
    return () => { isMounted = false; };
  }, [id]);

  // Fetch product reviews
  useEffect(() => {
    let isMounted = true;
    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await api.get(`/products/${id}/reviews`).catch(() => null);
        if (isMounted && res?.data?.success && Array.isArray(res.data.data)) {
          setReviews(res.data.data);
        }
      } catch {
        // reviews optional
      } finally {
        if (isMounted) setReviewsLoading(false);
      }
    };

    fetchReviews();
    return () => { isMounted = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="text-indigo-600 animate-spin" />
          <p className="text-xs font-semibold text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="bg-white rounded-md p-8 max-w-md w-full text-center space-y-4 border border-gray-200 shadow-sm">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-lg font-bold text-gray-900">{error || 'Product Not Found'}</h2>
          <p className="text-xs text-gray-500">The product you are looking for may have been removed or is temporarily unavailable.</p>
          <Link
            to="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const images = getProductImageCandidates(product);
  const galleryImages = images.length > 0 ? images : ['/product-placeholder.svg'];

  const isWishlisted = wishlist?.includes(product._id || product.id);
  const storeName = product.vendorProfileId?.storeName || product.vendorStoreName || product.storeName || (
    product.category === 'Electronics' ? 'TechNova Electronics' :
    product.category === 'Fashion' ? 'UrbanThread Fashion' :
    'CasaCraft Home & Kitchen'
  );
  const vendorTargetId = product.vendorProfileId?._id || product.vendorProfileId?.storeSlug || product.vendorId || storeName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  const price = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
  const comparePrice = product.comparePrice 
    ? (typeof product.comparePrice === 'number' ? product.comparePrice : parseFloat(product.comparePrice)) 
    : null;
  const discountPercent = comparePrice && comparePrice > price 
    ? Math.round(((comparePrice - price) / comparePrice) * 100) 
    : 0;

  const reviewAverage = reviews.length
    ? reviews.reduce((total, review) => total + (Number(review.rating) || 0), 0) / reviews.length
    : 0;
  const ratingAvg = Number(product.ratings?.average) || reviewAverage;
  const ratingCount = Number(product.ratings?.count) || reviews.length;
  const stock = Math.max(0, Number(product.stock) || 0);
  const maxQuantity = Math.min(stock, 10);
  const shippingInfo = product.shippingInfo || {};
  const estimatedDays = Math.max(1, Number(shippingInfo.estimatedDays) || 5);

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      await addToCart(product, quantity);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    setAddingToCart(true);
    try {
      const result = await addToCart(product, quantity);
      if (result?.success) navigate('/checkout');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast?.('Please log in to submit a product review.', 'info');
      navigate('/login');
      return;
    }
    if (!reviewTitle.trim() || !reviewBody.trim()) {
      showToast?.('Please provide both a title and review details.', 'error');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await api.post(`/products/${id}/reviews`, {
        rating: reviewRating,
        title: reviewTitle.trim(),
        body: reviewBody.trim(),
      });

      if (res.data?.success) {
        showToast?.('Review submitted successfully!', 'success');
        setReviews(prev => [res.data.data, ...prev]);
        setReviewTitle('');
        setReviewBody('');
      }
    } catch (err) {
      showToast?.(err.response?.data?.message || 'Failed to submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Convert attributes map or object to key-value array
  const rawAttrs = product.attributes;
  const attributesList = rawAttrs instanceof Map
    ? Array.from(rawAttrs.entries())
    : (rawAttrs && typeof rawAttrs === 'object' ? Object.entries(rawAttrs) : []);
  const productBrand = attributesList.find(([key]) => key.toLowerCase() === 'brand')?.[1] || storeName;
  const productTags = Array.isArray(product.tags) ? product.tags.filter(Boolean) : [];
  const dimensions = product.dimensions
    ? [
      product.dimensions.length,
      product.dimensions.width,
      product.dimensions.height,
    ].filter((value) => value !== undefined && value !== null).join(' × ')
    : '';
  const technicalDetails = [
    ...attributesList,
    ...(product.weight ? [['Weight', `${product.weight} g`]] : []),
    ...(dimensions ? [['Dimensions', `${dimensions} ${product.dimensions.unit || 'cm'}`]] : []),
    ...(product.sku ? [['Product code', product.sku]] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 py-6 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 overflow-x-auto whitespace-nowrap pb-1">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <ChevronRight size={12} className="text-gray-400" />
          <Link to="/" className="hover:text-blue-600">{product.category || 'Catalog'}</Link>
          {product.subcategory && (
            <>
              <ChevronRight size={12} className="text-gray-400" />
              <span className="hover:text-blue-600">{product.subcategory}</span>
            </>
          )}
          <ChevronRight size={12} className="text-gray-400" />
          <span className="text-gray-800 font-medium truncate max-w-sm">{product.name || product.title}</span>
        </div>

        {/* Product gallery and purchase details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ─── LEFT COLUMN: Main Image & Clickable Thumbnail Gallery (5 cols) ─── */}
          <div className="lg:col-span-6 flex flex-col-reverse sm:flex-row gap-4">
            
            {/* Clickable Thumbnail Gallery */}
            {galleryImages.length > 1 && (
              <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto max-h-[480px] scrollbar-thin">
                {galleryImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl border p-1 bg-white flex-shrink-0 cursor-pointer transition-all ${
                      activeImageIndex === idx
                        ? 'border-indigo-600 ring-2 ring-indigo-600/30 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      className="mn-product-float w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/product-placeholder.svg';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Stage Image */}
            <div className="relative aspect-square w-full rounded-2xl bg-white border border-slate-200 p-4 sm:p-8 flex items-center justify-center overflow-hidden">
              <ProductImage
                product={product}
                imageIndex={activeImageIndex}
                alt={product.name}
                className="w-full h-full object-contain max-h-[480px] hover:scale-105 transition-transform duration-300"
              />

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={() => toggleWishlist(product._id || product.id)}
                className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all z-10 cursor-pointer ${
                  isWishlisted
                    ? 'bg-red-50 text-red-600 shadow-md ring-1 ring-red-200'
                    : 'bg-white text-gray-400 hover:text-red-600 shadow-sm border border-gray-200'
                }`}
                title="Save to Wishlist"
              >
                <Heart size={18} className={isWishlisted ? 'fill-red-600 text-red-600' : ''} />
              </button>
            </div>
          </div>

          {/* Product information and purchase actions */}
          <div className="lg:col-span-6 space-y-5">
            
            {/* Title */}
            <div className="space-y-1">
              <p className="text-base sm:text-lg font-semibold text-slate-500">{productBrand}</p>
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-tight">
                {product.name || product.title}
              </h1>
              <p className="text-sm text-slate-500">{product.subcategory || product.category || 'Marketplace find'}</p>
            </div>

            {/* Clickable Sold & Fulfilled by [Vendor Name] Card */}
            <Link
              to={`/store/${vendorTargetId}`}
              className="flex items-center justify-between p-3 bg-slate-50 hover:bg-indigo-50/60 rounded-xl border border-slate-200 hover:border-indigo-200 transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100/70 text-indigo-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  <Store size={16} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Sold & Fulfilled By</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {storeName}
                    </span>
                    <ShieldCheck size={14} className="text-indigo-600 flex-shrink-0" />
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                Visit Store &rarr;
              </span>
            </Link>

            {/* Rating Summary */}
            <button
              type="button"
              onClick={() => document.getElementById('product-reviews')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2 pb-3 border-b border-slate-200 text-left"
            >
              <div className="flex items-center text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < Math.floor(ratingAvg) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-slate-900">{ratingCount > 0 ? ratingAvg.toFixed(1) : 'New'}</span>
              <span className="text-sm text-slate-500 hover:text-indigo-600 font-medium">
                {ratingCount > 0 ? `${ratingCount} ratings` : 'Be the first to rate'}
              </span>
            </button>

            {/* Price Section */}
            <div className="space-y-1 pb-4 border-b border-slate-200">
              <div className="flex items-baseline gap-2 flex-wrap">
                {discountPercent > 0 && (
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                    -{discountPercent}% OFF
                  </span>
                )}
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  ₹{price.toLocaleString('en-IN')}
                </span>
              </div>

              {comparePrice && comparePrice > price && (
                <div className="text-xs text-slate-400">
                  M.R.P.: <span className="line-through">₹{comparePrice.toLocaleString('en-IN')}</span>
                </div>
              )}

              <p className="text-xs text-slate-500">
                Inclusive of all taxes. {shippingInfo.isFreeShipping ? 'Free delivery on this product.' : 'Delivery cost shown at checkout.'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  stock > 0
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {stock > 0 ? (stock <= 5 ? `Only ${stock} left` : 'In stock') : 'Out of stock'}
                </span>
                <span className="text-sm text-slate-500">Sold by {storeName}</span>
              </div>

              {stock > 0 && (
                <div className="flex items-center gap-3">
                  <label htmlFor="quantity-select" className="text-sm font-semibold text-slate-700">Quantity</label>
                  <select
                    id="quantity-select"
                    value={quantity}
                    onChange={(event) => setQuantity(Number(event.target.value))}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-600"
                  >
                    {Array.from({ length: maxQuantity }, (_, index) => index + 1).map((count) => (
                      <option key={count} value={count}>{count}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={addingToCart || stock <= 0}
                  className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShoppingCart size={17} />
                  <span>{addingToCart ? 'Adding to bag...' : 'Add to Bag'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={addingToCart || stock <= 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-800 transition hover:border-indigo-600 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Lock size={16} />
                  <span>Buy Now</span>
                </button>
                <button
                  type="button"
                  aria-pressed={isWishlisted}
                  onClick={() => toggleWishlist(product._id || product.id)}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                    isWishlisted
                      ? 'border-rose-300 bg-rose-50 text-rose-700'
                      : 'border-slate-300 text-slate-800 hover:border-rose-300 hover:text-rose-600'
                  }`}
                >
                  <Heart size={16} className={isWishlisted ? 'fill-rose-600 text-rose-600' : ''} />
                  <span>{isWishlisted ? 'Wishlisted' : 'Wishlist'}</span>
                </button>
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-4 text-sm">
                <div className="flex items-start gap-3">
                  <Truck size={17} className="mt-0.5 shrink-0 text-indigo-600" />
                  <div>
                    <p className="font-semibold text-slate-800">
                      Delivery in {estimatedDays} {estimatedDays === 1 ? 'day' : 'days'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {shippingInfo.isFreeShipping
                        ? 'Free delivery on this product'
                        : shippingInfo.shippingCost > 0
                          ? `${formatPrice(shippingInfo.shippingCost)} delivery fee at checkout`
                          : 'Delivery charges, if any, are shown at checkout'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RotateCcw size={17} className="mt-0.5 shrink-0 text-indigo-600" />
                  <div>
                    <p className="font-semibold text-slate-800">Easy support</p>
                    <p className="text-xs text-slate-500">Contact the seller for help with this product.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck size={17} className="mt-0.5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-slate-800">Secure checkout</p>
                    <p className="text-xs text-slate-500">Your payment is protected during checkout.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <section className="grid grid-cols-1 gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Product details</h2>
            <p className="text-sm leading-6 text-slate-600">
              {product.description || 'More information about this product will be available soon.'}
            </p>
            {productTags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {productTags.map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Product information</h2>
            <dl className="grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <dt className="text-xs text-slate-500">Brand</dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-800">{productBrand}</dd>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <dt className="text-xs text-slate-500">Category</dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-800">{product.category || 'General'}</dd>
              </div>
              {technicalDetails.filter(([key]) => key.toLowerCase() !== 'brand').map(([key, value]) => (
                <div key={key} className="rounded-lg bg-slate-50 px-3 py-2">
                  <dt className="text-xs capitalize text-slate-500">{key.replace(/([A-Z])/g, ' $1')}</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-slate-800">{String(value)}</dd>
                </div>
              ))}
            </dl>
            <Link
              to={`/store/${vendorTargetId}`}
              className="inline-flex items-center gap-2 pt-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            >
              <Store size={15} />
              More from {storeName}
              <ChevronRight size={15} />
            </Link>
          </div>
        </section>

        {/* ─── BOTTOM SECTION: Customer Reviews & Submission Form ───────── */}
        <div id="product-reviews" className="scroll-mt-24 pt-10 border-t border-gray-200 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Review Summary & Write Form (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Customer Reviews</h2>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      className={i < Math.floor(ratingAvg) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                    />
                  ))}
                </div>
                <span className="text-base font-bold text-gray-900">{ratingAvg} out of 5</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{ratingCount} global customer ratings</p>
            </div>

            {/* Write a Review Box */}
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 space-y-4">
              <h3 className="text-sm font-bold text-gray-900">Review this product</h3>
              <p className="text-xs text-gray-600">Share your experience with other customers</p>

              <form onSubmit={handleSubmitReview} className="space-y-3">
                {/* Star rating selector */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Overall rating</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          size={20}
                          className={star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Headline</label>
                  <input
                    type="text"
                    placeholder="What's most important to know?"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Written review</label>
                  <textarea
                    rows={4}
                    placeholder="What did you like or dislike? What did you use this product for?"
                    value={reviewBody}
                    onChange={(e) => setReviewBody(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting Review...' : 'Submit Review'}
                </button>
              </form>
            </div>
          </div>

          {/* Customer Reviews List (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-200">
              Top reviews from verified purchases
            </h3>

            {reviewsLoading ? (
              <p className="text-sm text-slate-500 py-6">Loading reviews...</p>
            ) : reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((rev, idx) => (
                  <div key={rev._id || idx} className="space-y-2 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                        {(rev.customerId?.name || 'Customer').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold text-slate-900">
                        {rev.customerId?.name || 'Verified Customer'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={13}
                            className={i < (rev.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-slate-900">{rev.title}</span>
                    </div>

                    <div className="inline-block text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Verified Purchase
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{rev.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 py-6">
                No reviews submitted yet for this product. Be the first to share your thoughts!
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
