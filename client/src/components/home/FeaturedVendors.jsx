import { motion } from 'framer-motion';
import { Store, ArrowRight, ShieldCheck, Award, Sparkles } from 'lucide-react';
import VendorCard from '../ui/VendorCard';
import { useStore } from '../../store/useStore';

export default function FeaturedVendors() {
  const { mockVendors, setSearchQuery, setSelectedCategory } = useStore();

  const handleViewAll = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    const el = document.getElementById('catalog-grid');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="max-w-[1536px] mx-auto px-3 sm:px-4 lg:px-6 py-10" id="featured-vendors">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1.5">
            <Award size={15} />
            <span>Certified Merchant Storefronts & Brands</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Featured Merchant Storefronts
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Directly supporting independent makers, certified electronics distributors, and bespoke studio artisans with transparent escrow routing.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>100% Tax & KYC Vetted</span>
          </span>
          <button
            onClick={handleViewAll}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer group"
          >
            <span>Browse All Makers</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {mockVendors.map((vendor, idx) => (
          <VendorCard key={vendor._id || idx} vendor={vendor} index={idx} />
        ))}
      </div>
    </section>
  );
}
