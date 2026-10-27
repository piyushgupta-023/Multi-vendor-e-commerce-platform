import { 
  LayoutGrid, 
  Headphones, 
  Shirt, 
  Home, 
  Sparkles, 
  Dumbbell, 
  UtensilsCrossed 
} from 'lucide-react';
import { useStore } from '../../store/useStore';

const categories = [
  { id: 'All', label: 'All Categories', icon: LayoutGrid },
  { id: 'Electronics', label: 'Audio & Tech', icon: Headphones },
  { id: 'Fashion', label: "Apparel & Fashion", icon: Shirt },
  { id: 'Home & Living', label: 'Home & Living', icon: Home },
  { id: 'Beauty & Personal Care', label: 'Beauty & Wellness', icon: Sparkles },
  { id: 'Sports & Fitness', label: 'Sports & Fitness', icon: Dumbbell },
  { id: 'Food & Gourmet', label: 'Artisan Gourmet', icon: UtensilsCrossed },
];

export default function CategorySection() {
  const { selectedCategory, setSelectedCategory, products, mockProducts } = useStore();

  const allItems = products || mockProducts || [];

  const getCategoryCount = (catId) => {
    if (catId === 'All') return allItems.length;
    return allItems.filter(p => (p.category || '').toLowerCase() === catId.toLowerCase()).length;
  };

  return (
    <div className="max-w-[1536px] mx-auto px-3 sm:px-4 lg:px-6 pt-6 pb-2" id="catalog-section">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id || (cat.id === 'All' && (!selectedCategory || selectedCategory === 'All'));
          const count = getCategoryCount(cat.id);

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-950 text-white shadow-sm ring-1 ring-slate-900'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-amber-400' : 'text-slate-500'} />
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-slate-800 text-amber-300' : 'bg-slate-100 text-slate-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
