import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../store/useStore';

export default function HeroBanner() {
  const { switchActiveRole } = useAuth();
  const { showToast } = useStore();

  const handleSellClick = () => {
    switchActiveRole('vendor');
    showToast?.('Switched to Merchant perspective', 'info');
  };

  return (
    <section className="relative overflow-hidden bg-white border-b border-slate-100 py-16 sm:py-20 lg:py-24">
      {/* Subtle background surface grid */}
      <div 
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #0f172a 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          
          {/* Subtle Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
            <span>Curated Multi-Vendor Marketplace</span>
          </div>

          {/* High-Impact Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.12]">
            The modern standard for indie brands and direct makers.
          </h1>

          {/* Clean Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
            Discover verified independent manufacturers, bespoke craft studios, and premier electronics dealers with split-escrow buyer protection.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                const el = document.getElementById('catalog-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore Catalog</span>
              <ArrowRight size={14} />
            </button>

            <Link
              to="/vendor/dashboard"
              onClick={handleSellClick}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold border border-slate-200/90 transition-all flex items-center justify-center gap-1.5"
            >
              <span>Sell on MarketNest</span>
              <ArrowUpRight size={14} className="text-slate-400" />
            </Link>
          </div>

          {/* Crisp Social Metrics Bar */}
          <div className="pt-10 sm:pt-12 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-2xl mx-auto">
            <div className="text-center sm:text-left sm:pl-4 sm:border-l border-slate-200 first:border-l-0">
              <p className="text-2xl font-bold text-slate-900 tracking-tight">450+</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Verified Brands & Makers</p>
            </div>

            <div className="text-center sm:text-left sm:pl-4 sm:border-l border-slate-200">
              <p className="text-2xl font-bold text-slate-900 tracking-tight">99.4%</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">On-Time Fulfillment Rate</p>
            </div>

            <div className="text-center sm:text-left sm:pl-4 sm:border-l border-slate-200">
              <p className="text-2xl font-bold text-slate-900 tracking-tight">Bank-Grade</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Escrow Buyer Protection</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
