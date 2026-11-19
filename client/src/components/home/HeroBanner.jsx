import { ArrowRight, BadgeCheck, Sparkles, Store, Truck } from 'lucide-react';
import { useStore } from '../../store/useStore';
import ProductImage from '../ui/ProductImage';

const formatPrice = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

export default function HeroBanner() {
  const { setSelectedCategory, products } = useStore();
  const spotlightProducts = products.slice(0, 3);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const shopCollection = () => {
    setSelectedCategory('All');
    scrollTo('catalog-grid');
  };

  return (
    <section className="mn-hero relative isolate overflow-hidden text-slate-900">
      <div className="mn-hero-glow mn-hero-glow--one" aria-hidden="true" />
      <div className="mn-hero-glow mn-hero-glow--two" aria-hidden="true" />
      <div className="mn-hero-grid" aria-hidden="true" />

      <div className="relative mx-auto grid min-h-[620px] max-w-7xl items-center gap-8 px-5 py-12 sm:px-8 sm:py-16 lg:min-h-[660px] lg:grid-cols-[1fr_1.05fr] lg:gap-4 lg:px-10">
        <div className="relative z-10 max-w-2xl">
          <div className="mn-hero-badge mb-7 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold tracking-wide">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-40" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-700" />
            </span>
            YOUR NEXT GREAT FIND IS HERE
            <Sparkles size={14} className="text-amber-700" />
          </div>

          <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Good things,
            <span className="block font-medium italic text-amber-800">from good people.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-stone-600 sm:text-lg">
            Discover thoughtful finds from independent Indian stores. The little details,
            the makers behind them, and everything worth bringing home.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={shopCollection}
              className="mn-hero-primary inline-flex items-center gap-3 rounded-full px-6 py-3.5 text-sm font-bold transition"
            >
              Explore the collection
              <ArrowRight size={17} />
            </button>
            <button
              type="button"
              onClick={() => scrollTo('featured-vendors-section')}
              className="mn-hero-secondary inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition"
            >
              <Store size={16} />
              Meet the makers
            </button>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-xs font-medium text-stone-600">
            <span className="inline-flex items-center gap-2">
              <BadgeCheck size={16} className="text-amber-800" />
              Independent stores, verified
            </span>
            <span className="inline-flex items-center gap-2">
              <Truck size={16} className="text-amber-800" />
              Easy delivery & returns
            </span>
          </div>
        </div>

        <div className="mn-hero-stage relative mx-auto h-[390px] w-full max-w-[560px] sm:h-[480px]">
          <div className="mn-hero-plinth" aria-hidden="true" />
          <div className="mn-hero-orb" aria-hidden="true" />
          <div className="mn-hero-glass-panel mn-hero-glass-panel--back" aria-hidden="true" />
          <div className="mn-hero-glass-panel mn-hero-glass-panel--front" aria-hidden="true" />

          {spotlightProducts.map((product, index) => {
            const name = product.name || product.title || 'Featured product';
            const price = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;

            return (
              <div
                className={`mn-hero-product mn-hero-product--${index + 1}`}
                key={product._id || product.id || name}
              >
                <div className="mn-hero-product-image">
                  <ProductImage
                    product={product}
                    alt={name}
                    className="mn-product-float h-full w-full object-contain p-3"
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                </div>
                <div className="min-w-0 px-1 pb-1">
                  <p className="line-clamp-1 text-xs font-semibold text-stone-800">{name}</p>
                  <p className="mt-1 text-sm font-extrabold text-amber-900">{formatPrice(price)}</p>
                </div>
              </div>
            );
          })}

          <div className="mn-hero-stamp">
            <Sparkles size={13} />
            Curated for you
          </div>
        </div>
      </div>
    </section>
  );
}
