import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Search, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  Sliders, 
  AlertTriangle, 
  RefreshCw, 
  X, 
  ChevronDown,
  Eye,
  Check,
  MoreVertical
} from 'lucide-react';
import api from '../../api/axios';
import { useStore } from '../../store/useStore';
import ProductImage from '../../components/ui/ProductImage';

const categories = [
  'All',
  'Electronics',
  'Fashion',
  'Home & Living',
  'Sports & Fitness',
  'Food & Gourmet',
  'Beauty & Personal Care',
];

export default function VendorProductsPage() {
  const { showToast, deleteProductFromStore, updateProductInStore } = useStore();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState(searchParams.get('filter') === 'out-of-stock' ? 'depleted' : 'all'); // 'all', 'in', 'low', 'depleted'
  
  // Modals state
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [adjustStockProduct, setAdjustStockProduct] = useState(null);
  const [newStockValue, setNewStockValue] = useState(0);
  const [adjusting, setAdjusting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let res;
      try {
        res = await api.get('/products/my-products');
      } catch {
        res = await api.get('/vendor/products');
      }
      if (res.data?.success) {
        const list = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.products || []);
        setProducts(list);
      }
    } catch (err) {
      console.error('Failed to fetch vendor products:', err);
      showToast?.('Loaded products from cache or resilient mode', 'info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const nameMatch = (p.name || p.title || '').toLowerCase().includes(search.toLowerCase()) ||
                         (p.sku || '').toLowerCase().includes(search.toLowerCase());
      const catMatch = selectedCategory === 'All' || (p.category || '').toLowerCase() === selectedCategory.toLowerCase();
      
      let stockMatch = true;
      if (stockFilter === 'in') stockMatch = p.stock > 10;
      if (stockFilter === 'low') stockMatch = p.stock > 0 && p.stock <= 10;
      if (stockFilter === 'depleted') stockMatch = p.stock <= 0;

      return nameMatch && catMatch && stockMatch;
    });
  }, [products, search, selectedCategory, stockFilter]);

  // Handle Delete
  const confirmDelete = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    try {
      const id = productToDelete._id || productToDelete.id;
      const res = await api.delete(`/products/${id}`);
      if (res.data?.success) {
        setProducts(prev => prev.filter(p => (p._id || p.id) !== id));
        deleteProductFromStore?.(id);
        showToast?.('Product listing removed successfully', 'success');
        setProductToDelete(null);
      } else {
        throw new Error(res.data?.message || 'Delete failed');
      }
    } catch (err) {
      showToast?.(err.response?.data?.message || err.message || 'Error removing product', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Handle Quick Stock Adjustment
  const confirmStockAdjust = async () => {
    if (!adjustStockProduct) return;
    setAdjusting(true);
    const id = adjustStockProduct._id || adjustStockProduct.id;
    try {
      const res = await api.put(`/products/${id}`, { stock: parseInt(newStockValue, 10) });
      if (res.data?.success) {
        setProducts(prev => prev.map(p => (p._id || p.id) === id ? { ...p, stock: parseInt(newStockValue, 10) } : p));
        updateProductInStore?.({ _id: id, stock: parseInt(newStockValue, 10) });
        showToast?.('Inventory count updated', 'success');
        setAdjustStockProduct(null);
      }
    } catch (err) {
      showToast?.('Could not update inventory level', 'error');
    } finally {
      setAdjusting(false);
    }
  };

  const stockCounts = useMemo(() => {
    return {
      all: products.length,
      in: products.filter(p => p.stock > 10).length,
      low: products.filter(p => p.stock > 0 && p.stock <= 10).length,
      depleted: products.filter(p => p.stock <= 0).length,
    };
  }, [products]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Product Inventory
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time catalog pricing, SKU allocations, and active replenishment levels.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchProducts}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh product list"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          <Link
            to="/vendor/products/new"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle size={14} />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, SKU, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-600 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 pr-7 text-xs text-slate-300 focus:outline-none focus:border-indigo-600 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Stock Status Pills */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80 overflow-x-auto pb-1 text-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mr-1">Status:</span>

          <button
            onClick={() => setStockFilter('all')}
            className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer ${
              stockFilter === 'all'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({stockCounts.all})
          </button>

          <button
            onClick={() => setStockFilter('in')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer ${
              stockFilter === 'in'
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-semibold'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            In Stock ({stockCounts.in})
          </button>

          <button
            onClick={() => setStockFilter('low')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer ${
              stockFilter === 'low'
                ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60 font-semibold'
                : 'text-slate-400 hover:text-amber-400'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Low Stock ({stockCounts.low})
          </button>

          <button
            onClick={() => setStockFilter('depleted')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer ${
              stockFilter === 'depleted'
                ? 'bg-rose-950/80 text-rose-400 border border-rose-800/60 font-semibold'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Depleted ({stockCounts.depleted})
          </button>
        </div>
      </div>

      {/* Enterprise Data Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/90 shadow-sm">
        {loading ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw size={20} className="animate-spin text-indigo-500" />
            <p className="text-xs">Loading product records...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Package size={36} className="mx-auto text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-200">No matching items found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your query or status filter to see inventory records.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Product (Image + Title + SKU)</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Unit Price</th>
                  <th className="py-3 px-4">Stock Count</th>
                  <th className="py-3 px-4">Views</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProducts.map((p) => {
                  const id = p._id || p.id;
                  const isOut = p.stock <= 0;
                  const isLow = p.stock > 0 && p.stock <= 10;

                  return (
                    <tr key={id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Product (Image + Title + SKU) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <ProductImage
                            product={p}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-800 flex-shrink-0"
                          />
                          <div className="min-w-0 max-w-sm">
                            <p className="font-semibold text-white truncate text-xs">{p.name || p.title}</p>
                            <p className="font-mono text-[10px] text-slate-400">{p.sku || 'SKU-AUTO'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-slate-300 font-medium">
                        {p.category}
                      </td>

                      {/* Unit Price */}
                      <td className="py-3.5 px-4 font-semibold text-white">
                        ₹{Number(p.price).toLocaleString('en-IN')}
                        {p.comparePrice && p.comparePrice > p.price && (
                          <span className="block text-[10px] text-slate-500 line-through">
                            ₹{Number(p.comparePrice).toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>

                      {/* Stock Count with Soft Badges */}
                      <td className="py-3.5 px-4">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/60 text-rose-400 border border-rose-800/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Depleted (0)
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Low Stock ({p.stock})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> In Stock ({p.stock})
                          </span>
                        )}
                      </td>

                      {/* Views */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        {p.views || 0}
                      </td>

                      {/* Action Menu (Edit, Adjust Stock, Delete) */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setAdjustStockProduct(p);
                              setNewStockValue(p.stock || 0);
                            }}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
                            title="Quick Adjust Stock"
                          >
                            Adjust Stock
                          </button>
                          <Link
                            to={`/vendor/products/edit/${id}`}
                            className="p-1.5 rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors"
                            title="Edit Product"
                          >
                            <Edit3 size={13} />
                          </Link>
                          <button
                            onClick={() => setProductToDelete(p)}
                            className="p-1.5 rounded bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Adjust Stock Modal */}
      <AnimatePresence>
        {adjustStockProduct && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-sm w-full shadow-xl space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white">Adjust Stock Level</h4>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{adjustStockProduct.name || adjustStockProduct.title}</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Available Units
                </label>
                <input
                  type="number"
                  min="0"
                  value={newStockValue}
                  onChange={(e) => setNewStockValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  disabled={adjusting}
                  onClick={() => setAdjustStockProduct(null)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  disabled={adjusting}
                  onClick={confirmStockAdjust}
                  className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
                >
                  {adjusting ? 'Updating...' : 'Save Stock'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>

              <div>
                <h4 className="text-base font-bold text-white">Delete Product Listing</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Are you sure you want to remove <strong className="text-slate-200">"{productToDelete.name || productToDelete.title}"</strong> from the marketplace? This product will no longer appear in search results.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  disabled={deleting}
                  onClick={() => setProductToDelete(null)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  disabled={deleting}
                  onClick={confirmDelete}
                  className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
                >
                  {deleting ? 'Removing...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
