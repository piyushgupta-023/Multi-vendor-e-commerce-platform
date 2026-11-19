import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Star, Check, ShoppingCart, Sparkles } from 'lucide-react';
import { useStore } from '../../store/useStore';
import ProductImage from './ProductImage';

export default function ProductCard({ product }) {
  const { addToCart, setCartOpen } = useStore();
  const [justAdded, setJustAdded] = useState(false);
  const navigate = useNavigate();

  const productId = product._id || product.id;
  const price = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
  const comparePrice = product.comparePrice 
    ? (typeof product.comparePrice === 'number' ? product.comparePrice : parseFloat(product.comparePrice)) 
    : (product.discountPrice ? parseFloat(product.discountPrice) : null);

  const discountPercent = comparePrice && comparePrice > price 
    ? Math.round(((comparePrice - price) / comparePrice) * 100) 
    : 0;

  const ratingAvg = product.ratings?.average || 4.7;
  const ratingCount = product.ratings?.count || 142;
  const isBestSeller = product.isFeatured || ratingAvg >= 4.8 || ratingCount >= 300;
  const isLimitedDeal = discountPercent >= 20;

  const vendorName = product.vendorProfileId?.storeName || product.vendorStoreName || product.storeName || (
    product.category === 'Electronics' ? 'TechNova Electronics' :
    product.category === 'Fashion' ? 'UrbanThread Fashion' :
    'CasaCraft Home & Kitchen'
  );
  const vendorTargetId = product.vendorProfileId?._id || product.vendorProfileId?.storeSlug || product.vendorId || vendorName.toLowerCase().replace(/[^a-z0-9]/g, '-');

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const result = await addToCart(product, 1);
    if (!result?.success) return;
    setJustAdded(true);
    setCartOpen(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div 
      onClick={() => navigate(`/products/${productId}`)}
      className="mn-product-card group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-4 flex flex-col justify-between h-full cursor-pointer"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-2.5 min-h-[22px]">
          {isBestSeller ? (
            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-indigo-100">
              <Sparkles size={11} className="text-indigo-600" />
              <span>Best Seller</span>
            </span>
          ) : isLimitedDeal ? (
            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-rose-100">
              <span>Limited Deal</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-indigo-100">
              <span>{product.category || 'Featured'}</span>
            </span>
          )}

          {discountPercent > 0 && (
            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md font-semibold text-[11px]">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Square Aspect Ratio Image Container */}
        <div className="mn-product-image-stage aspect-square w-full bg-slate-50 rounded-xl overflow-hidden p-3 flex items-center justify-center relative mb-3">
          <ProductImage
            product={product}
            alt={product.name || product.title}
            className="mn-product-float object-contain max-h-full max-w-full group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>

        {/* Product Title */}
        <h4 
          className="line-clamp-2 text-[13px] font-medium text-slate-900 min-h-[2.5rem] leading-5 group-hover:text-indigo-600 transition-colors"
          title={product.name || product.title}
        >
          {product.name || product.title}
        </h4>

        {/* Star Rating Row */}
        <div className="flex items-center gap-1.5 my-2">
          <div className="flex items-center text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={13}
                className={i < Math.floor(ratingAvg) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
              />
            ))}
          </div>
          <span className="text-xs font-bold text-slate-800">{ratingAvg}</span>
          <span className="text-xs text-slate-400 font-medium">
            ({ratingCount})
          </span>
        </div>

        {/* Clickable Seller Link */}
        <div className="flex items-center text-[11px] text-slate-500 mb-2 truncate">
          <span>Sold by: </span>
          <Link
            to={`/store/${vendorTargetId}`}
            onClick={(e) => e.stopPropagation()}
            className="ml-1 font-semibold text-indigo-600 hover:text-indigo-800 hover:underline truncate"
          >
            {vendorName}
          </Link>
        </div>

        {/* Price Row */}
        <div className="flex items-baseline gap-2 flex-wrap mb-1">
          <span className="text-base font-semibold text-slate-900">
            ₹{price.toLocaleString('en-IN')}
          </span>
          {comparePrice && comparePrice > price && (
            <span className="text-xs text-slate-400 line-through">
              ₹{comparePrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>

      {/* Add to Cart Button Anchored at Bottom */}
      <button
        type="button"
        onClick={handleAddToCart}
        className={`w-full mt-3 py-2.5 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer ${
          justAdded
            ? 'bg-emerald-600 shadow-emerald-500/20'
            : 'bg-slate-900 hover:bg-indigo-600 hover:shadow-indigo-500/25'
        }`}
      >
        {justAdded ? (
          <>
            <Check size={14} className="text-white" />
            <span>Added to Cart</span>
          </>
        ) : (
          <>
            <ShoppingCart size={14} />
            <span>Add to Cart</span>
          </>
        )}
      </button>
    </div>
  );
}
