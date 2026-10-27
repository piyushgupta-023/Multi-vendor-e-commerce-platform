import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight, ShieldCheck, Zap, Sparkles, Star } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useAuth } from '../../context/AuthContext';

const slides = [
  {
    id: 'tech',
    tag: 'Next-Gen Flagship Audio & Ecosystem',
    tagBadge: 'Limited Time Deal · Up to 50% Off',
    title: 'Precision Acoustics & Smart Ecosystems.',
    desc: 'Wireless ANC headphones, spatial audio monitors, and ultra-fast GaN power stations direct from certified distributors.',
    category: 'Electronics',
    ctaText: 'Shop Tech Deals',
    ctaSub: 'From ₹1,499 with Free 2-Day Escrow Delivery',
    bgGradient: 'from-slate-950 via-slate-900 to-indigo-950',
    accentColor: 'text-amber-400',
    badgeBg: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
    primaryImage: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1200&auto=format&fit=crop&q=80',
    trustPills: ['Verified Distributors', '1-Year Warranty', 'Split-Escrow Pay']
  },
  {
    id: 'fashion',
    tag: 'Curated Designer Fashion & Indie Drops',
    tagBadge: 'Exclusive Autumn Drops · Curated Runway',
    title: 'Artisanal Tailoring & Contemporary Streetwear.',
    desc: 'Handcrafted heavyweight blazers, minimalist Japanese denim, and sustainable organic separates from vetted indie labels.',
    category: 'Fashion',
    ctaText: 'Explore Fashion Drops',
    ctaSub: 'Direct-from-atelier pricing with 100% genuine guarantee',
    bgGradient: 'from-slate-950 via-purple-950 to-slate-900',
    accentColor: 'text-purple-300',
    badgeBg: 'bg-purple-400/20 text-purple-200 border-purple-400/40',
    primaryImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=80',
    trustPills: ['Indie Designers', 'Ethically Sourced', 'Zero Markup']
  },
  {
    id: 'home',
    tag: 'Artisan Handcrafted Living & Kitchen Essentials',
    tagBadge: 'Direct Maker Trust · 0% Middleman',
    title: 'Scandinavian Living & Japandi Studio Ceramics.',
    desc: 'Solid kiln-dried teak furniture, matte ceramic serveware, and hand-woven textiles made to elevate your mindful sanctuary.',
    category: 'Home & Living',
    ctaText: 'Shop Home & Living',
    ctaSub: 'Direct from studio workshops with insured freight delivery',
    bgGradient: 'from-slate-950 via-emerald-950 to-slate-900',
    accentColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40',
    primaryImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&auto=format&fit=crop&q=80',
    trustPills: ['Master Craft Studios', 'Natural Teak & Clay', 'Damage Protection']
  }
];

export default function HeroBanner() {
  const { setSelectedCategory, showToast } = useStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);

  // Auto-play every 4 seconds unless paused
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleCtaClick = (category) => {
    setSelectedCategory(category);
    showToast?.(`Filtering catalog: ${category}`, 'info');
    const catalogEl = document.getElementById('catalog-grid');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Touch / swipe handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) handleNext();
    else if (diff < -50) handlePrev();
    touchStartX.current = null;
  };

  const slide = slides[currentSlide];

  return (
    <section
      className="relative overflow-hidden select-none bg-slate-950"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Dynamic Slide Background with Smooth Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={`relative min-h-[480px] sm:min-h-[520px] lg:min-h-[560px] bg-gradient-to-r ${slide.bgGradient} flex items-center`}
        >
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.08),transparent_60%)] pointer-events-none" />

          {/* Background Image Container with Soft Dark Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src={slide.primaryImage}
              alt={slide.title}
              className="w-full h-full object-cover object-center lg:object-right opacity-35 mix-blend-luminosity transform scale-105"
            />
            {/* Vignette Gradients */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/40" />
          </div>

          {/* Main Slide Content */}
          <div className="relative z-10 max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-10 py-12 lg:py-16 w-full">
            <div className="max-w-2xl space-y-4 sm:space-y-6">
              
              {/* Badge Tag */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="flex flex-wrap items-center gap-2"
              >
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${slide.badgeBg}`}>
                  <Zap size={13} className="fill-current" />
                  {slide.tagBadge}
                </span>
                <span className="hidden sm:inline-block text-xs font-semibold text-slate-300">
                  {slide.tag}
                </span>
              </motion.div>

              {/* High-Impact Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]"
              >
                {slide.title}
              </motion.h1>

              {/* Subtitle Description */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal max-w-xl"
              >
                {slide.desc}
              </motion.p>

              {/* Action Buttons & Pricing Microcopy */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3.5"
              >
                <button
                  onClick={() => handleCtaClick(slide.category)}
                  className="px-6 py-3 rounded-lg bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer group"
                >
                  <span>{slide.ctaText}</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <ShieldCheck size={16} className="text-emerald-400 flex-shrink-0" />
                  <span>{slide.ctaSub}</span>
                </div>
              </motion.div>

              {/* Trust Badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="pt-2 flex items-center gap-4 text-[11px] font-semibold text-slate-400"
              >
                {slide.trustPills.map((pill, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>{pill}</span>
                  </div>
                ))}
              </motion.div>

            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide Navigation Arrow Buttons (Left & Right) */}
      <button
        onClick={handlePrev}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-16 sm:w-12 sm:h-24 bg-black/30 hover:bg-black/60 text-white flex items-center justify-center rounded-r-lg backdrop-blur-xs transition-colors cursor-pointer group"
        title="Previous banner"
      >
        <ChevronLeft size={28} className="group-hover:-translate-x-0.5 transition-transform" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-16 sm:w-12 sm:h-24 bg-black/30 hover:bg-black/60 text-white flex items-center justify-center rounded-l-lg backdrop-blur-xs transition-colors cursor-pointer group"
        title="Next banner"
      >
        <ChevronRight size={28} className="group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Slide Indicator Dots */}
      <div className="absolute bottom-16 sm:bottom-20 inset-x-0 z-20 flex items-center justify-center gap-2">
        {slides.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => setCurrentSlide(idx)}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              currentSlide === idx
                ? 'w-8 h-2 bg-amber-400 shadow-md shadow-amber-400/50'
                : 'w-2 h-2 bg-white/40 hover:bg-white/80'
            }`}
            title={`Slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* Amazon-Style Bottom Gradient Fade (Blends seamlessly into the marketplace card background) */}
      <div className="absolute bottom-0 inset-x-0 h-28 sm:h-36 bg-gradient-to-t from-[#eaeded] via-[#eaeded]/70 to-transparent pointer-events-none z-10" />
    </section>
  );
}
