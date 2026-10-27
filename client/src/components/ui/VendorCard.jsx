import { motion } from 'framer-motion';
import { Star, ShoppingBag, ArrowRight, CheckCircle2 } from 'lucide-react';

const categoryColors = {
  'Electronics': 'from-blue-600 via-indigo-600 to-indigo-800',
  'Fashion': 'from-rose-500 via-pink-600 to-purple-700',
  'Home & Living': 'from-emerald-600 via-teal-600 to-cyan-800',
  'Sports & Fitness': 'from-amber-500 via-orange-600 to-red-700',
  'Food & Gourmet': 'from-yellow-500 via-amber-600 to-orange-700',
  'Beauty & Personal Care': 'from-purple-600 via-violet-600 to-fuchsia-800',
};

export default function VendorCard({ vendor, index = 0 }) {
  const gradient = categoryColors[vendor.category] || 'from-indigo-600 via-purple-600 to-violet-800';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index * 0.08, 0.4), duration: 0.4 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 border border-gray-100 flex flex-col cursor-pointer"
    >
      {/* Decorative Banner */}
      <div className={`h-24 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,white,transparent)]" />
        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-sm" />
        <div className="absolute -top-4 -left-4 w-20 h-20 rounded-full bg-white/10 blur-sm" />
        <div className="absolute top-2 right-3">
          <span className="bg-black/20 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/20">
            {vendor.category}
          </span>
        </div>
      </div>

      {/* Profile & Info */}
      <div className="px-5 pb-5 pt-0 flex-1 flex flex-col">
        <div className="flex items-end justify-between -mt-9 mb-3">
          <div className="w-16 h-16 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-white flex-shrink-0">
            <img
              src={vendor.logo}
              alt={vendor.storeName}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
            />
          </div>
          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-xl transition-all duration-200"
          >
            Visit Store <ArrowRight size={12} />
          </motion.button>
        </div>

        <div className="flex items-center gap-1.5">
          <h3 className="font-bold text-gray-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
            {vendor.storeName}
          </h3>
          <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
        </div>

        <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed flex-1">
          {vendor.storeDescription}
        </p>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-1 text-gray-700 font-semibold">
            <Star size={13} className="fill-amber-400 text-amber-400" />
            <span>{vendor.rating}</span>
            <span className="text-gray-400 font-normal">/ 5.0</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500">
            <ShoppingBag size={13} className="text-gray-400" />
            <span>{vendor.totalSales?.toLocaleString()} sales</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
