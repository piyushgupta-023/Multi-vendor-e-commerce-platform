import { Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, RefreshCw, Store, ArrowRight } from 'lucide-react';
import HeroBanner from '../components/home/HeroBanner';
import CategorySection from '../components/home/CategorySection';
import FeaturedProducts from '../components/home/FeaturedProducts';
import FeaturedVendors from '../components/home/FeaturedVendors';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* 1. Dynamic Modern Hero Banner */}
      <HeroBanner />

      {/* 2. Category Navigation Bar Pills */}
      <CategorySection />

      {/* 3. Product Catalog Grid with Sidebar Filters */}
      <FeaturedProducts />

      {/* 4. Verified Merchant Storefronts */}
      <FeaturedVendors />

      {/* 5. Clean, Spacious 'Sell on MarketNest' CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="mn-merchant-cta rounded-[2rem] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 my-12 border">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/55 text-amber-900 text-xs font-semibold border border-white/75">
              <Store size={13} />
              <span>MarketNest Merchant Ecosystem</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Sell Directly to Thousands of Buyers
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              List your products across Tech, Fashion, and Home Living. Enjoy automated multi-vendor order routing, real-time analytics, and guaranteed escrow settlements.
            </p>
          </div>

          <div className="flex-shrink-0 w-full sm:w-auto">
            <Link
              to="/vendor/register"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-amber-900 hover:bg-amber-950 text-white text-sm font-semibold transition-all shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Apply as a Merchant</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Modern Trust & Guarantee Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full" id="escrow-trust">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="flex items-start gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600 flex-shrink-0 shadow-xs">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Escrow Buyer Protection</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Funds are retained securely in escrow until each merchant fulfills delivery and you confirm the package.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-600 flex-shrink-0 shadow-xs">
              <RefreshCw size={22} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Smart Split Routing</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Cart items from multiple vendors are automatically partitioned into distinct sub-orders with independent tracking.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 flex-shrink-0 shadow-xs">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">100% Verified Merchants</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Every merchant undergoes strict business and tax verification before their catalog is enabled for checkout.
              </p>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
