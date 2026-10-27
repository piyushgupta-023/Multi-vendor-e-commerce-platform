import { motion } from 'framer-motion';
import { Star, ShoppingBag, ArrowRight, CheckCircle2, ShieldCheck, Package } from 'lucide-react';
import { useStore } from '../../store/useStore';

const vendorBanners = {
  'TechNova Electronics': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
  'StyleForward Fashion': 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&auto=format&fit=crop&q=80',
  'HomeBliss Living': 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&auto=format&fit=crop&q=80',
  'FitLife Sports': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
  'GourmetKart Foods': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
  'BeautyBloom Cosmetics': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
};

const vendorProductCounts = {
  'TechNova Electronics': '85+ Products',
  'StyleForward Fashion': '140+ Products',
  'HomeBliss Living': '65+ Products',
  'FitLife Sports': '90+ Products',
  'GourmetKart Foods': '110+ Products',
  'BeautyBloom Cosmetics': '125+ Products',
};

export default function VendorCard({ vendor, index = 0 }) {
  const { setSearchQuery, setSelectedCategory, showToast } = useStore();

  const bannerImg = vendorBanners[vendor.storeName] || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80';
  const productCount = vendorProductCounts[vendor.storeName] || '50+ Products';

  const handleVisitStore = () => {
    setSearchQuery(vendor.storeName);
    setSelectedCategory('All');
    showToast?.(`Viewing items sold by ${vendor.storeName}`, 'info');
    const el = document.getElementById('catalog-grid');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.08, 0.4), duration: 0.35 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 border border-slate-200/80 flex flex-col"
    >
      {/* Visual Cover Banner */}
      <div className="h-28 relative overflow-hidden bg-slate-900">
        <img
          src={bannerImg}
          alt={vendor.storeName}
          className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />
        
        {/* Category Pill Tag */}
        <div className="absolute top-2.5 right-3">
          <span className="bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/20">
            {vendor.category}
          </span>
        </div>
      </div>

      {/* Profile & Info Container */}
      <div className="px-5 pb-5 pt-0 flex-1 flex flex-col">
        {/* Circular Logo & Visit Store CTA */}
        <div className="flex items-end justify-between -mt-10 mb-3">
          <div className="relative w-16 h-16 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-white flex-shrink-0">
            <img
              src={vendor.logo}
              alt={vendor.storeName}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
            />
          </div>

          <button
            onClick={handleVisitStore}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-amber-400 group-hover:bg-amber-400 px-3.5 py-1.5 rounded-xl transition-all duration-200 shadow-2xs cursor-pointer"
          >
            <span>Visit Store</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Store Title & Verified Checkmark */}
        <div className="flex items-center gap-1.5">
          <h3 className="font-bold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
            {vendor.storeName}
          </h3>
          <ShieldCheck size={15} className="text-indigo-600 flex-shrink-0" title="Verified Merchant" />
        </div>

        {/* Bio Description */}
        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed flex-1">
          {vendor.storeDescription}
        </p>

        {/* Stats Row: Rating, Sales & Product Count */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1 text-slate-800 font-bold">
            <Star size={13} className="fill-amber-400 text-amber-400" />
            <span>{vendor.rating}</span>
            <span className="text-slate-400 font-normal">/ 5.0</span>
          </div>

          <div className="flex items-center gap-1 text-slate-500 font-medium">
            <Package size={13} className="text-indigo-500" />
            <span>{productCount}</span>
          </div>

          <div className="flex items-center gap-1 text-slate-500">
            <ShoppingBag size={12} className="text-slate-400" />
            <span>{vendor.totalSales?.toLocaleString()} sold</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
