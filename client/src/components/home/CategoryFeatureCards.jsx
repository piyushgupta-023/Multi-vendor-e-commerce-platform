import { Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, Star, ArrowRight, User, Store, Shield, Sparkles, ShoppingBag } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useAuth } from '../../context/AuthContext';

const electronicDeals = [
  {
    title: 'Wireless ANC Earbuds',
    tag: 'Under ₹2,999',
    img: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&auto=format&fit=crop&q=80',
    category: 'Electronics',
  },
  {
    title: 'Titanium Smartwatch',
    tag: 'Up to 40% Off',
    img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80',
    category: 'Electronics',
  },
  {
    title: 'Studio Condenser Mic',
    tag: 'Trending Now',
    img: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=300&auto=format&fit=crop&q=80',
    category: 'Electronics',
  },
  {
    title: 'GaN 100W Fast Charger',
    tag: 'From ₹999',
    img: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&auto=format&fit=crop&q=80',
    category: 'Electronics',
  },
];

const trendingApparel = [
  {
    title: 'Tailored Wool Blazer',
    tag: 'Bestseller',
    img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300&auto=format&fit=crop&q=80',
    category: 'Fashion',
  },
  {
    title: 'Scandinavian Table',
    tag: 'Handcrafted',
    img: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=300&auto=format&fit=crop&q=80',
    category: 'Home & Living',
  },
  {
    title: 'Vitamin C Radiance',
    tag: 'Clean Beauty',
    img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&auto=format&fit=crop&q=80',
    category: 'Beauty & Personal Care',
  },
  {
    title: 'Eco High-Density Mat',
    tag: 'Pro Fitness',
    img: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=300&auto=format&fit=crop&q=80',
    category: 'Sports & Fitness',
  },
];

const topVendorsSpotlight = [
  {
    name: 'TechNova Audio',
    category: 'Flagship Tech',
    rating: '4.8 ★',
    sales: '1.2k sales',
    logo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=100&auto=format&fit=crop&q=80',
  },
  {
    name: 'StyleForward Atelier',
    category: 'Indie Fashion',
    rating: '4.5 ★',
    sales: '3.4k sales',
    logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&auto=format&fit=crop&q=80',
  },
  {
    name: 'BeautyBloom Lab',
    category: 'Clean Skincare',
    rating: '4.9 ★',
    sales: '7.8k sales',
    logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100&auto=format&fit=crop&q=80',
  },
  {
    name: 'HomeBliss Teak',
    category: 'Handmade Living',
    rating: '4.6 ★',
    sales: '890 sales',
    logo: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=100&auto=format&fit=crop&q=80',
  },
];

export default function CategoryFeatureCards() {
  const { setSelectedCategory, showToast, cartCount, wishlist, setCartOpen } = useStore();
  const { user, isAuthenticated, activeRole, demoLogin, switchActiveRole } = useAuth();

  const handleFilterClick = (category) => {
    setSelectedCategory(category);
    showToast?.(`Filtered by ${category}`, 'info');
    const catalogEl = document.getElementById('catalog-grid');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleQuickDemo = async (role) => {
    try {
      await demoLogin(role);
      showToast?.(`Logged in as demo ${role}!`, 'success');
    } catch {
      showToast?.('Demo login failed', 'error');
    }
  };

  const scrollToVendors = () => {
    const el = document.getElementById('featured-vendors');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      id="category-feature-cards"
      className="relative z-20 max-w-[1536px] mx-auto px-3 sm:px-4 lg:px-6 -mt-16 sm:-mt-24 lg:-mt-28 mb-8"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* CARD 1: Deals on Indie Electronics (4-Item Mini Grid) */}
        <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md border border-slate-200/90 flex flex-col justify-between transition-shadow">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mb-3">
              Deals on Indie Electronics
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              {electronicDeals.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleFilterClick(item.category)}
                  className="group/item flex flex-col cursor-pointer"
                >
                  <div className="aspect-square bg-slate-50 rounded-lg overflow-hidden border border-slate-100 relative mb-1">
                    <img
                      src={item.img}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-800 line-clamp-1 group-hover/item:text-indigo-600 transition-colors">
                    {item.title}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600">
                    {item.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleFilterClick('Electronics')}
            className="pt-4 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer group mt-2"
          >
            <span>See all electronics deals</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* CARD 2: Top-Rated Vendor Brands */}
        <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md border border-slate-200/90 flex flex-col justify-between transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Top-Rated Vendor Brands
              </h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                KYC Vetted
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Direct storefronts with 4.5+ star verified ratings
            </p>

            <div className="space-y-2">
              {topVendorsSpotlight.map((vendor, idx) => (
                <div
                  key={idx}
                  onClick={scrollToVendors}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={vendor.logo}
                      alt={vendor.name}
                      className="w-8 h-8 rounded-md object-cover border border-slate-200 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-slate-800 truncate">{vendor.name}</span>
                        <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0" />
                      </div>
                      <span className="text-[10px] text-slate-500">{vendor.category}</span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-[11px] font-bold text-amber-600 block">{vendor.rating}</span>
                    <span className="text-[10px] text-slate-400">{vendor.sales}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={scrollToVendors}
            className="pt-4 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer group mt-2"
          >
            <span>Explore 450+ verified storefronts</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* CARD 3: Trending in Apparel & Living (4-Item Mini Grid) */}
        <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md border border-slate-200/90 flex flex-col justify-between transition-shadow">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mb-3">
              Trending in Apparel & Living
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              {trendingApparel.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleFilterClick(item.category)}
                  className="group/item flex flex-col cursor-pointer"
                >
                  <div className="aspect-square bg-slate-50 rounded-lg overflow-hidden border border-slate-100 relative mb-1">
                    <img
                      src={item.img}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-800 line-clamp-1 group-hover/item:text-indigo-600 transition-colors">
                    {item.title}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-600">
                    {item.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleFilterClick('Fashion')}
            className="pt-4 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer group mt-2"
          >
            <span>Discover designer collections</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* CARD 4: Sign in for your best experience / Quick Demo Login */}
        <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md border border-slate-200/90 flex flex-col justify-between transition-shadow">
          {isAuthenticated && user ? (
            /* Logged-In User Card */
            <div>
              <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100">
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
                  alt={user.name}
                  className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Welcome back</span>
                  <h4 className="text-sm font-bold text-slate-900 truncate">{user.name}</h4>
                  <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 mt-0.5">
                    {user.role || activeRole || 'Buyer'}
                  </span>
                </div>
              </div>

              {/* Logged In Quick Actions */}
              <div className="space-y-2 text-xs">
                {(user.role === 'vendor' || activeRole === 'vendor' || user.role === 'admin') ? (
                  <Link
                    to="/vendor/dashboard"
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Store size={15} /> Open Merchant Studio
                    </span>
                    <ArrowRight size={13} />
                  </Link>
                ) : (
                  <Link
                    to="/register"
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Store size={15} /> Apply to Sell on MarketNest
                    </span>
                    <ArrowRight size={13} />
                  </Link>
                )}

                <button
                  onClick={() => setCartOpen(true)}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag size={14} className="text-slate-400" /> Current Cart
                  </span>
                  <span className="font-bold text-slate-900">{cartCount} items</span>
                </button>

                <button
                  onClick={() => {
                    const el = document.getElementById('catalog-grid');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-500" /> Saved Wishlist
                  </span>
                  <span className="font-bold text-slate-900">{wishlist.length} saved</span>
                </button>
              </div>
            </div>
          ) : (
            /* Guest / Unauthenticated 1-Click Action Card */
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mb-1">
                Sign in for your best experience
              </h3>
              <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                Unlock instant split cart checkouts, sub-order tracking, and verified seller pricing.
              </p>

              {/* Main Sign In CTA */}
              <Link
                to="/login"
                className="w-full block py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs text-center shadow-xs transition-colors mb-3"
              >
                Sign in securely
              </Link>

              {/* 1-Click Instant Demo Login Buttons */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  1-Click Quick Demo Login:
                </span>
                <button
                  onClick={() => handleQuickDemo('customer')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <User size={13} className="text-sky-500" /> Customer Demo
                  </span>
                  <span className="text-[10px] text-slate-400">Buyer</span>
                </button>
                <button
                  onClick={() => handleQuickDemo('vendor')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Store size={13} className="text-amber-500" /> Vendor Demo
                  </span>
                  <span className="text-[10px] text-slate-400">Seller</span>
                </button>
                <button
                  onClick={() => handleQuickDemo('admin')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Shield size={13} className="text-purple-500" /> Admin Demo
                  </span>
                  <span className="text-[10px] text-slate-400">Admin</span>
                </button>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 mt-2">
            <p className="text-[11px] text-slate-500 text-center">
              New customer?{' '}
              <Link to="/register" className="text-indigo-600 font-bold hover:underline">
                Start here.
              </Link>
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
