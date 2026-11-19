import { 
  LayoutGrid, 
  Headphones, 
  Shirt, 
  Home, 
  CookingPot 
} from 'lucide-react';
import { useStore } from '../../store/useStore';

const categories = [
  { id: 'All', query: 'All', label: 'All Categories', icon: LayoutGrid },
  { id: 'Electronics', query: 'Electronics', label: 'Electronics', icon: Headphones },
  { id: 'Fashion', query: 'Fashion', label: 'Fashion', icon: Shirt },
  { id: 'Home & Living', query: 'Home', label: 'Home & Living', icon: Home },
  { id: 'Kitchen & Appliances', query: 'Appliances', label: 'Kitchen & Appliances', icon: CookingPot },
];

export default function CategorySection() {
  const { selectedCategory, setSelectedCategory, products } = useStore();

  const allItems = products || [];

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat.query);
    const catalogEl = document.getElementById('catalog-grid');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-6 w-full" id="category-nav-bar">
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = 
            (cat.id === 'All' && (!selectedCategory || selectedCategory === 'All')) ||
            selectedCategory === cat.query ||
            selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat)}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-white' : 'text-slate-500'} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
