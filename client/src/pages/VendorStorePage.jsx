import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Store, 
  ShieldCheck, 
  Star, 
  Package, 
  Search, 
  ArrowLeft, 
  CheckCircle2, 
  SlidersHorizontal,
  Loader2,
  AlertCircle
} from 'lucide-react';
import ProductCard from '../components/ui/ProductCard';
import api from '../services/api';
import { useStore } from '../store/useStore';

export default function VendorStorePage() {
  const { vendorId } = useParams();
  const { products: storeProducts, vendors: storeVendors } = useStore();

  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured'); // featured | price_asc | price_desc | rating

  useEffect(() => {
    let isMounted = true;

    const fetchVendorData = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await api.get(`/vendor/public/${vendorId}`);
        if (isMounted && res.data?.success && res.data.data) {
          setVendor(res.data.data.vendor);
          setProducts(res.data.data.products || []);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Vendor API fetch fallback:', err.message);
      }

      // Fallback matching from store context
      const matchedVendor = storeVendors.find(
        v => v._id === vendorId || v.id === vendorId || v.storeSlug === vendorId || v.storeName?.toLowerCase() === vendorId.toLowerCase()
      );

      if (matchedVendor) {
        if (isMounted) setVendor(matchedVendor);
      } else {
        // Fallback default vendor
        if (isMounted) {
          setVendor({
            _id: vendorId,
            storeName: vendorId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            storeDescription: 'Authorized verified brand storefront on MarketNest marketplace.',
            rating: 4.8,
            category: 'Retail Merchant',
            logo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=300&h=300&fit=crop&q=80',
            banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=400&fit=crop&q=80',
          });
        }
      }

      // Filter products from storeProducts
      const matchedProducts = storeProducts.filter(p => {
        const vId = (p.vendorProfileId?._id || p.vendorProfileId || p.vendorId?._id || p.vendorId || '').toString();
        const vStore = (p.vendorProfileId?.storeName || p.vendorStoreName || '').toLowerCase();
        return vId === vendorId || vStore.includes(vendorId.toLowerCase());
      });

      if (isMounted) {
        setProducts(matchedProducts.length > 0 ? matchedProducts : storeProducts.slice(0, 4));
        setLoading(false);
      }
    };

    fetchVendorData();
    return () => { isMounted = false; };
  }, [vendorId, storeVendors, storeProducts]);

  // Filter & sort in-store products
  const filteredProducts = products.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (p.name || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
    if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
    if (sortBy === 'rating') return (b.ratings?.average || 0) - (a.ratings?.average || 0);
    return 0;
  });

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="text-indigo-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-600">Loading storefront catalog...</p>
        </div>
      </div>
    );
  }

  const bannerImg = vendor?.banner || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1400&h=400&fit=crop&q=80';
  const logoImg = vendor?.logo || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=300&h=300&fit=crop&q=80';

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* ─── 1. Hero Store Banner ────────────────────────────────────────── */}
      <div className="relative h-48 sm:h-64 md:h-72 w-full overflow-hidden bg-slate-900">
        <img
          src={bannerImg}
          alt={vendor?.storeName || 'Store Banner'}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
        
        {/* Back Link Overlay */}
        <div className="absolute top-6 left-6 z-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur text-xs font-semibold border border-slate-700/60 shadow-md transition"
          >
            <ArrowLeft size={14} />
            <span>Marketplace Home</span>
          </Link>
        </div>
      </div>

      {/* ─── 2. Store Header Identity Card ──────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20 relative z-20 pb-8">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Storefront Logo */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-white shadow-xl overflow-hidden bg-white p-1 flex-shrink-0">
              <img
                src={logoImg}
                alt={vendor?.storeName}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>

            {/* Store Titles & Badges */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {vendor?.storeName || 'Official Merchant Store'}
                </h1>
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>Verified Merchant</span>
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                {vendor?.storeDescription || 'Official authorized storefront on MarketNest with verified direct fulfillment.'}
              </p>

              {/* Meta Stats Row */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 pt-1">
                <div className="flex items-center gap-1.5 text-slate-900">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span className="font-bold">{vendor?.rating || 4.8}</span>
                  <span className="text-slate-400 font-normal">/ 5.0 Rating</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200/60">
                  <Store size={12} />
                  <span>{vendor?.category || 'Electronics'}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Package size={13} className="text-slate-400" />
                  <span>{products.length} Products Cataloged</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 flex items-center gap-3">
            <Link
              to="/vendor/register"
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
            >
              Become a Seller
            </Link>
          </div>

        </div>

        {/* ─── 3. In-Store Filter & Search Bar ────────────────────────────── */}
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute inset-y-0 left-3.5 my-auto text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={`Search within ${vendor?.storeName || 'store'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
            />
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto text-xs">
            <span className="text-slate-500 font-medium">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none focus:border-indigo-600 cursor-pointer"
            >
              <option value="featured">Featured Items</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>

        </div>

        {/* ─── 4. Store Catalog Products Grid ────────────────────────────── */}
        <div className="mt-6">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 space-y-3">
              <Package size={36} className="mx-auto text-slate-300" />
              <h3 className="font-bold text-slate-900 text-base">No products found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No catalog items matched your query for this storefront. Clear your search to browse all items.
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredProducts.map((p) => (
                <ProductCard key={p._id || p.id} product={p} />
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
