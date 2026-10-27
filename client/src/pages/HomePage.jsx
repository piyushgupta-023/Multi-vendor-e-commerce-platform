import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, ArrowUpRight, CheckCircle2, RefreshCw } from 'lucide-react';
import HeroBanner from '../components/home/HeroBanner';
import CategorySection from '../components/home/CategorySection';
import FeaturedProducts from '../components/home/FeaturedProducts';
import FeaturedVendors from '../components/home/FeaturedVendors';
import { useStore } from '../store/useStore';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { role: storeRole, setRole: setStoreRole, showToast } = useStore();
  const { activeRole, switchActiveRole } = useAuth();

  const role = activeRole || storeRole || 'customer';
  const setRole = (newRole) => {
    setStoreRole?.(newRole);
    switchActiveRole?.(newRole);
    showToast?.(`Active perspective: ${newRole === 'vendor' ? 'Merchant' : newRole === 'admin' ? 'Admin' : 'Buyer'}`, 'info');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Subtle Perspective Alert Bar (only if not Buyer) */}
      {role !== 'customer' && (
        <div className="bg-slate-900 text-white text-xs py-2 px-4 flex items-center justify-center gap-2 border-b border-slate-800">
          <span className="text-slate-300">
            Viewing storefront as <strong className="text-white capitalize">{role === 'vendor' ? 'Merchant' : 'Admin'}</strong>
          </span>
          <button
            onClick={() => setRole('customer')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline ml-2 cursor-pointer"
          >
            Switch to Buyer View
          </button>
        </div>
      )}

      {/* Hero Section */}
      <HeroBanner />

      {/* Category Pills Bar */}
      <CategorySection />

      {/* Catalog Grid */}
      <FeaturedProducts />

      {/* Minimalist Merchant Callout Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-8 sm:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-2 max-w-xl">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
              For Independent Makers
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Scale your brand with automated split fulfillment.
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Launch your dedicated storefront on MarketNest. Gain immediate access to thousands of qualified buyers with unified inventory management and instant payouts.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              to="/vendor/dashboard"
              onClick={() => setRole('vendor')}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              Open Merchant Store
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Vetted Vendors */}
      <FeaturedVendors />

      {/* Trust & Guarantee Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 w-full border-t border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3">
              <ShieldCheck size={18} />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">Escrow Buyer Protection</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Transactions remain secure in escrow until the vendor fulfills delivery and the customer confirms receipt.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mb-3">
              <RefreshCw size={18} />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">Direct Merchant Payouts</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Automated multi-vendor payment splitting via Razorpay Route and Stripe Connect with clear settlement schedules.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-3">
              <CheckCircle2 size={18} />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">100% Genuine Certified</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every merchant undergoes comprehensive KYC and tax identification verification prior to product publishing.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
