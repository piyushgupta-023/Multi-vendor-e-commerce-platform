import { motion } from 'framer-motion';
import { Store, ArrowRight, ShieldCheck } from 'lucide-react';
import VendorCard from '../ui/VendorCard';
import { useStore } from '../../store/useStore';

export default function FeaturedVendors() {
  const { mockVendors } = useStore();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-violet-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Store size={14} /> Certified Merchants
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight">
            Featured Vendor Storefronts
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Directly supporting independent makers, certified distributors, and authorized flagship brands
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200/60 px-3 py-1.5 rounded-xl">
            <ShieldCheck size={14} /> KYC & Quality Vetted
          </span>
          <button className="text-xs font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1 cursor-pointer">
            View All Vendors <ArrowRight size={13} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockVendors.map((vendor, idx) => (
          <VendorCard key={vendor._id} vendor={vendor} index={idx} />
        ))}
      </div>
    </section>
  );
}
