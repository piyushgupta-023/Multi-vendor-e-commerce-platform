import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, CheckCircle2, RefreshCw, Store, Zap, Sparkles } from 'lucide-react';
import HeroBanner from '../components/home/HeroBanner';
import CategoryFeatureCards from '../components/home/CategoryFeatureCards';
import CategorySection from '../components/home/CategorySection';
import FeaturedProducts from '../components/home/FeaturedProducts';
import FeaturedVendors from '../components/home/FeaturedVendors';
import { useStore } from '../store/useStore';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { role: storeRole, setRole: setStoreRole, showToast } = useStore();
  const { user, activeRole, switchActiveRole } = useAuth();

  const role = activeRole || storeRole || user?.role || 'customer';

  const handleRoleToggle = (newRole) => {
    setStoreRole?.(newRole);
    switchActiveRole?.(newRole);
    showToast?.(`Switched to ${newRole === 'vendor' ? 'Merchant' : newRole === 'admin' ? 'Admin' : 'Buyer'} perspective`, 'info');
  };

  return (
    <div className="min-h-screen bg-[#eaeded] flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      
      {/* 1. Perspective Banner (if in Merchant or Admin view) */}
      {role !== 'customer' && (
        <div className="bg-slate-950 text-white text-xs py-2 px-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2 max-w-[1536px] mx-auto w-full">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-slate-300">
              Active Marketplace Perspective:{' '}
              <strong className="text-amber-400 uppercase font-black tracking-wide">
                {role === 'vendor' ? 'Merchant / Seller' : 'Platform Administrator'}
              </strong>
            </span>
            <button
              onClick={() => handleRoleToggle('customer')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold underline ml-3 cursor-pointer"
            >
              Switch back to Buyer View
            </button>
          </div>
        </div>
      )}

      {/* 2. Dynamic Auto-Sliding Rich Hero Carousel */}
      <HeroBanner />

      {/* 3. Amazon-Style 4-Quadrant Category Feature Cards (Overlapping Hero) */}
      <CategoryFeatureCards />

      {/* 4. Category Pills Filter Bar */}
      <CategorySection />

      {/* 5. High-Density Product Catalog Grid */}
      <FeaturedProducts />

      {/* 6. Multi-Vendor Storefronts Showcase */}
      <FeaturedVendors />

      {/* 7. Seller Onboarding Callout Banner */}
      <section className="max-w-[1536px] mx-auto px-3 sm:px-4 lg:px-6 py-6 w-full">
        <div className="rounded-2xl border border-slate-300/80 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-10 shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute right-0 top-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-2 max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold">
              <Store size={13} />
              <span>Independent Maker Program</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Sell to Millions. Maintain Direct Customer Relationships.
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              MarketNest gives verified makers dedicated storefronts, automated payment splits via Razorpay Route & Stripe Connect, and zero hidden platform fees.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0 relative z-10 w-full sm:w-auto">
            <Link
              to="/vendor/dashboard"
              onClick={() => handleRoleToggle('vendor')}
              className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black shadow-md transition-all text-center"
            >
              Open Merchant Store
            </Link>
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all text-center"
            >
              Apply as Maker
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Trust & Buyer Escrow Guarantee Strip */}
      <section className="max-w-[1536px] mx-auto px-3 sm:px-4 lg:px-6 py-10 w-full" id="escrow-trust">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 flex-shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Escrow Buyer Protection</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Funds are held safely in escrow until the vendor fulfills delivery and you confirm condition of the package.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 flex-shrink-0">
              <RefreshCw size={22} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Multi-Vendor Split Fulfillment</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Orders with multiple sellers are automatically broken into trackable sub-orders with independent tracking IDs.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 flex-shrink-0">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">100% Genuine Certified</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Every merchant must pass identity, business registration, and bank verification before listing products.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
