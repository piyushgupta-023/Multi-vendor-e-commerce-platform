import { useStore } from '../../store/useStore';

const categories = [
  { id: 'All', label: 'All Products' },
  { id: 'Electronics', label: 'Audio & Tech' },
  { id: 'Fashion', label: "Men's Studio" },
  { id: 'Home & Living', label: 'Living & Decor' },
  { id: 'Beauty & Personal Care', label: 'Wellness' },
  { id: 'Sports & Fitness', label: 'Sports & Active' },
  { id: 'Food & Gourmet', label: 'Artisan Gourmet' },
];

export default function CategorySection() {
  const { selectedCategory, setSelectedCategory } = useStore();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4" id="catalog-section">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-100">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id || (cat.id === 'All' && selectedCategory === 'All');
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/60'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
