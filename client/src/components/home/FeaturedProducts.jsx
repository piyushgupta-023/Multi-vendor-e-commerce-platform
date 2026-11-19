import { useState, useEffect } from 'react';
import { 
  ArrowUpDown, 
  SearchX, 
  X, 
  ShieldCheck, 
  Star, 
  Filter, 
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Truck
} from 'lucide-react';
import ProductCard from '../ui/ProductCard';
import { useStore } from '../../store/useStore';

export default function FeaturedProducts() {
  const { 
    products, 
    loadingProducts,
    fetchProducts, 
    selectedCategory, 
    setSelectedCategory, 
    searchQuery, 
    setSearchQuery 
  } = useStore();
  
  const [sortBy, setSortBy] = useState('featured'); // featured | price-low | price-high | rating | newest
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  // Debounced API call when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts({
        category: selectedCategory || 'All',
        search: searchQuery,
        sort: sortBy === 'price-low' 
          ? 'price_asc' 
          : sortBy === 'price-high' 
          ? 'price_desc' 
          : sortBy === 'rating' 
          ? 'rating' 
          : sortBy === 'newest'
          ? 'newest'
          : undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        minRating: minRating || undefined,
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery, sortBy, minPrice, maxPrice, minRating, fetchProducts]);

  useEffect(() => {
    if (!filterPanelOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setFilterPanelOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [filterPanelOpen]);

  // Available categories list
  const categoryOptions = [
    'All',
    'Electronics',
    'Fashion',
    'Home & Living',
    'Kitchen & Appliances'
  ];

  const handleClearFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setSortBy('featured');
  };

  const hasActiveFilters = 
    (selectedCategory && selectedCategory !== 'All') || 
    Boolean(searchQuery) || 
    Boolean(minPrice) || 
    Boolean(maxPrice) || 
    Boolean(minRating);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full" id="catalog-grid">
      
      {/* ─── Top Control Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              {(!selectedCategory || selectedCategory === 'All') ? 'Explore Marketplace Catalog' : selectedCategory}
            </h2>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 rounded-full">
              {products.length} products
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span>Verified merchant storefronts</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck size={13} /> 100% Escrow Buyer Protection
            </span>
          </div>
        </div>

        {/* Right side: Mobile filter toggle & Sort Dropdown */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Catalog Filter Drawer Trigger */}
          <button
            onClick={() => setFilterPanelOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <SlidersHorizontal size={14} />
            <span>Filters</span>
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" aria-label="Active filters" />}
          </button>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xs">
            <ArrowUpDown size={13} className="text-slate-500" />
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent outline-none cursor-pointer"
            >
              <option value="featured">Featured Relevance</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Customer Ratings</option>
              <option value="newest">Newest Arrivals</option>
            </select>
          </div>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer ml-1"
            >
              <RotateCcw size={12} />
              <span>Clear filters</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Active Filter Chips ────────────────────────────────────────── */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs text-slate-400 font-medium">Active:</span>

          {selectedCategory && selectedCategory !== 'All' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200/80">
              <span>Category: {selectedCategory}</span>
              <button 
                onClick={() => setSelectedCategory('All')} 
                className="hover:text-indigo-900 cursor-pointer"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200">
              <span>"{searchQuery}"</span>
              <button 
                onClick={() => setSearchQuery('')} 
                className="hover:text-slate-950 cursor-pointer"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {minRating && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
              <span>{minRating}★ & above</span>
              <button 
                onClick={() => setMinRating('')} 
                className="hover:text-amber-950 cursor-pointer"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {(minPrice || maxPrice) && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
              <span>₹{minPrice || '0'} – ₹{maxPrice || '∞'}</span>
              <button 
                onClick={() => { setMinPrice(''); setMaxPrice(''); }} 
                className="hover:text-emerald-950 cursor-pointer"
              >
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      )}

      {/* ─── Full-width Product Catalog with Filter Drawer ──────────────── */}
      <div className="grid grid-cols-1 gap-6 items-start">
        
        {filterPanelOpen && (
          <div
            className="fixed inset-0 z-[60] flex justify-end bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setFilterPanelOpen(false)}
          >
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Catalog filters"
          onClick={(event) => event.stopPropagation()}
          className="relative z-10 h-full w-full max-w-md space-y-6 overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
        >
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Filter size={14} className="text-slate-600" />
              <span>Filter catalog</span>
            </h3>
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                >
                  Reset all
                </button>
              )}
              <button
                type="button"
                onClick={() => setFilterPanelOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close filters"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* 1. Category Radio Group */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
              Category
            </h4>
            <div className="space-y-1.5">
              {categoryOptions.map((cat) => (
                <label
                  key={cat}
                  className="flex items-center justify-between text-xs text-slate-700 hover:text-indigo-600 cursor-pointer group py-1"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="catalogCategory"
                      value={cat}
                      checked={(selectedCategory || 'All') === cat}
                      onChange={() => setSelectedCategory(cat)}
                      className="accent-indigo-600 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span className={(selectedCategory || 'All') === cat ? 'font-bold text-slate-950' : 'group-hover:font-medium'}>
                      {cat === 'All' ? 'All Categories' : cat}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            {/* 2. Customer Reviews Rating Filter */}
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
              Customer Reviews
            </h4>
            <div className="space-y-2 text-xs">
              {[
                { stars: 4, label: '4★ & above' },
                { stars: 3, label: '3★ & above' },
              ].map(({ stars, label }) => (
                <button
                  key={stars}
                  type="button"
                  onClick={() => setMinRating(minRating === String(stars) ? '' : String(stars))}
                  className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors text-left cursor-pointer ${
                    minRating === String(stars) ? 'bg-indigo-50 font-bold border border-indigo-200 text-indigo-900' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={13}
                        className={i < stars ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                      />
                    ))}
                    <span className="text-xs font-medium text-slate-700 ml-1">{label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            {/* 3. Price Range Filter */}
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
              Price Range (₹)
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min ₹"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none"
                />
                <span className="text-slate-400 text-xs">to</span>
                <input
                  type="number"
                  placeholder="Max ₹"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none"
                />
              </div>

              {/* Quick Price Shortcuts */}
              <div className="space-y-1 text-xs text-slate-600">
                <button
                  type="button"
                  onClick={() => { setMinPrice(''); setMaxPrice('1000'); }}
                  className="block w-full text-left hover:text-indigo-600 py-1 cursor-pointer transition"
                >
                  Under ₹1,000
                </button>
                <button
                  type="button"
                  onClick={() => { setMinPrice('1000'); setMaxPrice('3000'); }}
                  className="block w-full text-left hover:text-indigo-600 py-1 cursor-pointer transition"
                >
                  ₹1,000 - ₹3,000
                </button>
                <button
                  type="button"
                  onClick={() => { setMinPrice('3000'); setMaxPrice('10000'); }}
                  className="block w-full text-left hover:text-indigo-600 py-1 cursor-pointer transition"
                >
                  ₹3,000 - ₹10,000
                </button>
                <button
                  type="button"
                  onClick={() => { setMinPrice('10000'); setMaxPrice(''); }}
                  className="block w-full text-left hover:text-indigo-600 py-1 cursor-pointer transition"
                >
                  Above ₹10,000
                </button>
              </div>
            </div>
          </div>

          {/* 4. Delivery & Fulfillment Guarantee */}
          <div className="border-t border-slate-100 pt-4 space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Seller Standard
            </h4>
            <div className="text-[11px] text-slate-600 space-y-1.5 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-900 font-semibold">
                <Truck size={14} className="text-indigo-600" />
                <span>Express 48h Dispatch</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                All listed merchants adhere to MarketNest 48-hr SLA dispatch and verified authentic inventory.
              </p>
            </div>
          </div>

        </aside>
          </div>
        )}

        {/* ─── Product Catalog Grid Area ───────────────────────────────── */}
        <div className="w-full">
          
          {/* Animated Shimmer Skeleton Loading State */}
          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200/80 animate-pulse space-y-3">
                  <div className="w-20 h-4 bg-slate-200 rounded-full"></div>
                  <div className="aspect-square w-full bg-slate-100 rounded-xl"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-5 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-10 bg-slate-200 rounded-xl w-full mt-2"></div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            /* Real Product Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {products.map((product, idx) => (
                <ProductCard key={product._id || product.id || idx} product={product} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 p-8 space-y-4 shadow-xs">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto">
                <SearchX size={26} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">No Products Matching Criteria</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  We couldn't find items matching your current filters. Clear your filters or broaden your price range to see available products.
                </p>
              </div>
              <button
                onClick={handleClearFilters}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                Clear All Filters & Show Full Catalog
              </button>
            </div>
          )}

        </div>

      </div>

    </section>
  );
}
