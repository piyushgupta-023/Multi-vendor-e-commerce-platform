import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Check, Heart, ShieldCheck, Star, Zap } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function ProductCard({ product, index = 0 }) {
  const { addToCart, wishlist, toggleWishlist, cartItems, setSearchQuery, setSelectedCategory, showToast } = useStore();
  const [justAdded, setJustAdded] = useState(false);

  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
  const imageUrl = typeof primaryImage === 'string' ? primaryImage : primaryImage?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
  
  const isWishlisted = wishlist?.includes(product._id || product.id);
  const cartItem = cartItems?.find(i => (i._id || i.id) === (product._id || product.id));
  const isInCart = Boolean(cartItem);

  const storeName = product.vendorProfileId?.storeName || product.storeName || 'TechNova Electronics';
  const price = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
  const comparePrice = product.comparePrice 
    ? (typeof product.comparePrice === 'number' ? product.comparePrice : parseFloat(product.comparePrice)) 
    : (product.discountPrice ? parseFloat(product.discountPrice) : null);

  const discountPercent = comparePrice && comparePrice > price 
    ? Math.round(((comparePrice - price) / comparePrice) * 100) 
    : 0;

  const ratingAvg = product.ratings?.average || 4.7;
  const ratingCount = product.ratings?.count || 128;
  const stock = product.stock !== undefined ? product.stock : 25;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleVendorFilter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSearchQuery(storeName);
    setSelectedCategory('All');
    showToast?.(`Filtering by vendor: ${storeName}`, 'info');
  };

  return (
    <div className="group flex flex-col bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 hover:shadow-lg transition-all duration-200 overflow-hidden relative">
      
      {/* 1. Image Container with Badges */}
      <div className="relative aspect-[4/3.8] w-full bg-slate-50 overflow-hidden">
        <img
          src={imageUrl}
          alt={product.name || product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
          }}
        />

        {/* Deal / Discount Badge */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {discountPercent > 0 ? (
            <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-xs uppercase tracking-wider flex items-center gap-0.5">
              <Zap size={10} className="fill-white" />
              <span>{discountPercent}% OFF</span>
            </span>
          ) : product.isFeatured ? (
            <span className="bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
              Featured Pick
            </span>
          ) : null}
        </div>

        {/* Wishlist Heart Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product._id || product.id);
          }}
          className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center transition-all z-10 cursor-pointer ${
            isWishlisted
              ? 'bg-rose-50 text-rose-600 shadow-sm ring-1 ring-rose-200'
              : 'bg-white/90 text-slate-400 hover:text-rose-600 hover:bg-white shadow-xs'
          }`}
          title="Save to wishlist"
        >
          <Heart size={14} className={isWishlisted ? 'fill-rose-600 text-rose-600' : ''} />
        </button>
      </div>

      {/* 2. Product Details Container */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-1.5">
          {/* Sold By Vendor Link */}
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            <span>Sold by</span>
            <button
              onClick={handleVendorFilter}
              className="font-semibold text-slate-700 hover:text-indigo-600 transition-colors truncate max-w-[140px] text-left cursor-pointer"
            >
              {storeName}
            </button>
            <ShieldCheck size={12} className="text-indigo-600 flex-shrink-0" />
          </div>

          {/* Product Title (2-line clamp) */}
          <h3 
            className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors"
            title={product.name || product.title}
          >
            {product.name || product.title}
          </h3>

          {/* Amazon-Style Star Rating */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <div className="flex items-center gap-0.5 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  className={i < Math.floor(ratingAvg) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                />
              ))}
            </div>
            <span className="text-[11px] font-bold text-slate-800">{ratingAvg}</span>
            <span className="text-[10px] text-slate-400">({ratingCount})</span>
          </div>

          {/* Stock Availability */}
          <div className="text-[10px] font-semibold">
            {stock <= 5 ? (
              <span className="text-rose-600">Only {stock} left in stock - order soon</span>
            ) : (
              <span className="text-emerald-700">In Stock · Verified Dispatch</span>
            )}
          </div>
        </div>

        {/* 3. Pricing & Vibrant Amazon Add to Cart Button */}
        <div className="pt-2 border-t border-slate-100 space-y-2.5">
          {/* Price & Savings Display */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-base sm:text-lg font-black text-slate-950 tracking-tight">
              ₹{price.toLocaleString('en-IN')}
            </span>
            {comparePrice && comparePrice > price && (
              <span className="text-xs text-slate-400 line-through">
                ₹{comparePrice.toLocaleString('en-IN')}
              </span>
            )}
            {discountPercent > 0 && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                Save ₹{(comparePrice - price).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Active Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
              justAdded
                ? 'bg-emerald-600 text-white'
                : isInCart
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                : 'bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-950'
            }`}
          >
            {justAdded ? (
              <>
                <Check size={14} className="stroke-[3]" />
                <span>Added to Cart!</span>
              </>
            ) : isInCart ? (
              <>
                <Check size={14} className="stroke-[2.5]" />
                <span>In Cart ({cartItem.quantity})</span>
              </>
            ) : (
              <>
                <ShoppingCart size={14} />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
