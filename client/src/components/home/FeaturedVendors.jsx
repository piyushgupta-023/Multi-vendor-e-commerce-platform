import { Store, ArrowRight, ShieldCheck } from 'lucide-react';
import VendorCard from '../ui/VendorCard';
import { useStore } from '../../store/useStore';

export default function FeaturedVendors() {
  const { vendors, setSearchQuery, setSelectedCategory } = useStore();

  const handleBrowseAll = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    const el = document.getElementById('catalog-grid');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Display top 3 merchant storefronts
  const displayVendors = (vendors && vendors.length > 0) 
    ? vendors.slice(0, 3) 
    : [
        {
          _id: 'technova-electronics',
          storeName: 'TechNova Electronics',
          category: 'Electronics',
          rating: 4.8,
          logo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=300&h=300&fit=crop&q=80',
          storeDescription: 'Authorized flagship electronics, high-fidelity wireless audio, noise-cancelling headphones, and smart home speakers.'
        },
        {
          _id: 'urbanthread-fashion',
          storeName: 'UrbanThread Fashion',
          category: 'Fashion',
          rating: 4.7,
          logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop&q=80',
          storeDescription: 'Curated contemporary apparel, bespoke leather jackets, tailored outerwear, and minimalist titanium watches.'
        },
        {
          _id: 'casacraft-home-kitchen',
          storeName: 'CasaCraft Home & Kitchen',
          category: 'Home & Living',
          rating: 4.9,
          logo: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=300&fit=crop&q=80',
          storeDescription: 'Artisan handcrafted solid wood furniture, bespoke home décor, and high-performance lifestyle kitchen appliances.'
        }
      ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full" id="featured-vendors-section">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider mb-2">
            <ShieldCheck size={16} />
            <span>Vetted Merchant Network</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Verified Merchant Stores
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Browse certified independent makers, electronics engineers, and design studios with direct fulfillment and escrow protection.
          </p>
        </div>

        <button
          onClick={handleBrowseAll}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto group"
        >
          <span>Explore All Stores</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* 3 Equal-Width Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayVendors.map((vendor, idx) => (
          <VendorCard key={vendor._id || idx} vendor={vendor} />
        ))}
      </div>
    </section>
  );
}
