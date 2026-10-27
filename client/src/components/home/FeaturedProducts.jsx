import { useState, useMemo } from 'react';
import { ArrowUpDown, SearchX } from 'lucide-react';
import ProductCard from '../ui/ProductCard';
import { useStore } from '../../store/useStore';

export default function FeaturedProducts() {
  const { products, mockProducts, selectedCategory, setSelectedCategory, searchQuery, setSearchQuery } = useStore();
  const [sortBy, setSortBy] = useState('featured'); // featured | price-low | price-high

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
    } else {
      // Featured / newest
      list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    return list;
  }, [productList, selectedCategory, searchQuery, sortBy]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="catalog-grid">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {selectedCategory === 'All' ? 'Curated Catalog' : selectedCategory}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing {filteredProducts.length} verified item{filteredProducts.length !== 1 ? 's' : ''} available for dispatch
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-slate-200/80 px-3 py-1.5 rounded-lg text-xs shadow-2xs">
            <ArrowUpDown size={13} className="text-slate-400" />
            <span className="text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-slate-700 font-medium outline-none cursor-pointer"
            >
              <option value="featured">Featured First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid or Empty State */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
            <SearchX size={24} />
          </div>
          <h3 className="font-semibold text-slate-900 text-sm">No products found</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            No items matched your current search filters. Try selecting another category or clear the search query.
          </p>
          <button
            onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
            className="mt-1 bg-slate-900 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product, idx) => (
            <ProductCard key={product._id || product.id || idx} product={product} index={idx} />
          ))}
        </div>
      )}
    </section>
  );
}
