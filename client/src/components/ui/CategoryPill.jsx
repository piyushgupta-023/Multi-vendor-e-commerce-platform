import { motion } from 'framer-motion';

const categoryConfig = {
  'All': { emoji: '✨', color: 'hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200' },
  'Electronics': { emoji: '⚡', color: 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200' },
  'Fashion': { emoji: '👗', color: 'hover:bg-pink-50 hover:text-pink-700 hover:border-pink-200' },
  'Home & Living': { emoji: '🏠', color: 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200' },
  'Sports & Fitness': { emoji: '🏃', color: 'hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200' },
  'Food & Gourmet': { emoji: '🍷', color: 'hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-200' },
  'Beauty & Personal Care': { emoji: '💄', color: 'hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200' },
  'Books': { emoji: '📚', color: 'hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200' },
  'Toys': { emoji: '🧸', color: 'hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200' },
};

export default function CategoryPill({ category, count, isActive = false, onClick, index = 0 }) {
  const config = categoryConfig[category] || { emoji: '🛍️', color: 'hover:bg-gray-50 hover:text-gray-700 hover:border-gray-200' };

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer shadow-sm
        ${isActive
          ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-indigo-500/25 ring-2 ring-indigo-500/20'
          : `bg-white text-gray-700 border-gray-200 ${config.color}`
        }
      `}
    >
      <span className="text-base">{config.emoji}</span>
      <span>{category}</span>
      {count !== undefined && (
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
          {count}
        </span>
      )}
    </motion.button>
  );
}
