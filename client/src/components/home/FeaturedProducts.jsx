import { useState, useMemo } from 'react';
import { ArrowUpDown, SearchX, X, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import ProductCard from '../ui/ProductCard';
import { useStore } from '../../store/useStore';

export default function FeaturedProducts() {
  const { 
    products, 
    mockProducts, 
    selectedCategory, 
    setSelectedCategory, 
    searchQuery, 
    setSearchQuery 
  } = useStore();
  const [sortBy, setSortBy] = useState('featured'); // featured | price-low | price-high | rating

  const productList = products || mockProducts || [];

  const filteredProducts = useMemo(() => {
    let list = [...productList];

    // Filter by category
    if (selectedCategory && selectedCategory !== 'All') {
      list = list.filter((p) => (p.category || '').toLowerCase() === selectedCategory.toLowerCase());
    }

    // Filter by search query
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) =>
        (p.name || p.title || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.vendorProfileId?.storeName || p.storeName || '').toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'price-low') {
      list.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.ratings?.average || 0) - (a.ratings?.average || 0));
    } else {
      // Featured
      list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    return list;
  }, [productList, selectedCategory, searchQuery, sortBy]);

  return (
    <section className="max-w-[1536px] mx-auto px-3 sm:px-4 lg:px-6 py-8" id="catalog-grid">
      
      {/* Header, Active Filters, and Sort Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              {selectedCategory === 'All' ? 'Marketplace Catalog' : selectedCategory}
            </h2>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredProducts.length} items
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span>Dispatched directly by verified makers</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck size={13} /> Free Escrow Protection
            </span>
          </div>
        </div>

        {/* Filter Chips & Sort Dropdown */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Active category chip */}
          {selectedCategory && selectedCategory !== 'All' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
              <span>{selectedCategory}</span>
              <button 
                onClick={() => setSelectedCategory('All')} 
                className="hover:text-indigo-900 cursor-pointer ml-1"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {/* Active search chip */}
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200">
              <span>Search: "{searchQuery}"</span>
              <button 
                onClick={() => setSearchQuery('')} 
                className="hover:text-amber-950 cursor-pointer ml-1"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {/* Sort Menu */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs shadow-2xs">
            <ArrowUpDown size={13} className="text-slate-400" />
            <span className="text-slate-500 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-slate-800 font-bold outline-none cursor-pointer"
            >
              <option value="featured">Featured First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Customer Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid or Empty State */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-1">
            <SearchX size={26} />
          </div>
          <h3 className="font-bold text-slate-900 text-base">No items matched your search</h3>
          <p className="text-xs text-slate-500 max-w-md leading-relaxed">
            We couldn't find any products matching your current filters. Try searching for "Headphones", "Blazer", "Table", or reset your filters.
          </p>
          <button
            onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
            className="mt-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
          {filteredProducts.map((product, idx) => (
            <ProductCard key={product._id || product.id || idx} product={product} index={idx} />
          ))}
        </div>
      )}
    </section>
  );
}
