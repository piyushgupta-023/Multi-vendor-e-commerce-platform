import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Check, Heart, ShieldCheck } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function ProductCard({ product, index = 0 }) {
  const { addToCart, wishlist, toggleWishlist, cartItems } = useStore();
  const [hovered, setHovered] = useState(false);

  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
  const imageUrl = typeof primaryImage === 'string' ? primaryImage : primaryImage?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
  
  const isWishlisted = wishlist?.includes(product._id || product.id);
  const isInCart = cartItems?.some(i => (i._id || i.id) === (product._id || product.id));

  const storeName = product.vendorProfileId?.storeName || product.storeName || 'TechNova Audio';
  const price = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
  const comparePrice = product.comparePrice ? (typeof product.comparePrice === 'number' ? product.comparePrice : parseFloat(product.comparePrice)) : null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group flex flex-col bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all duration-150 overflow-hidden relative"
    >
      {/* Aspect Container & Crisp Image */}
      <div className="relative aspect-[4/4.2] w-full bg-slate-50 overflow-hidden">
        <img
          src={imageUrl}
          alt={product.name || product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
          }}
        />

        {/* Subtle Wishlist Trigger */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product._id || product.id);
          }}
          className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center transition-all z-10 cursor-pointer ${
            isWishlisted
              ? 'bg-rose-50 text-rose-600 shadow-xs'
              : 'bg-white/90 text-slate-400 hover:text-rose-600 hover:bg-white shadow-xs'
          }`}
          title="Save to wishlist"
        >
          <Heart size={13} className={isWishlisted ? 'fill-rose-600 text-rose-600' : ''} />
        </button>

        {/* Understated 'Quick Add' Button Sliding Up on Hover */}
        <div className="absolute inset-x-3 bottom-3 z-10">
          <button
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
            }}
            className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 shadow-sm cursor-pointer ${
              hovered ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0 pointer-events-none'
            } ${
              isInCart 
                ? 'bg-slate-900 text-white' 
                : 'bg-white/95 hover:bg-slate-900 text-slate-900 hover:text-white backdrop-blur border border-slate-200/80'
            }`}
          >
            {isInCart ? (
              <>
                <Check size={13} className="text-emerald-400" />
                <span>In Bag</span>
              </>
            ) : (
              <>
                <ShoppingCart size={13} />
                <span>Quick Add</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Product Metadata */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
        <div className="space-y-1">
          {/* Verified Seller Link */}
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            <span>by</span>
            <span className="text-slate-700 hover:text-indigo-600 transition-colors truncate">
              {storeName}
            </span>
            <ShieldCheck size={11} className="text-indigo-600 flex-shrink-0" />
          </div>

          {/* Bold Title */}
          <h3 
            className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors"
            title={product.name || product.title}
          >
            {product.name || product.title}
          </h3>
        </div>

        {/* Clear Price */}
        <div className="flex items-baseline gap-2 pt-1 border-t border-slate-100">
          <span className="text-sm font-bold text-slate-900 tracking-tight">
            ₹{price.toLocaleString('en-IN')}
          </span>
          {comparePrice && comparePrice > price && (
            <span className="text-xs text-slate-400 line-through font-normal">
              ₹{comparePrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
