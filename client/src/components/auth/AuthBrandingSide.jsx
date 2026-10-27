import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Layers, 
  Lock, 
  Star,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';

export default function AuthBrandingSide() {
  const valueProps = [
    {
      title: 'Verified Sellers',
      description: '100% vetted vendors with guaranteed authentic merchandise, rigorous KYC checks, and manufacturer warranties.',
      icon: ShieldCheck,
    },
    {
      title: 'Instant SubOrder Routing',
      description: 'One single shopping cart automatically splits and routes per-vendor suborders with independent real-time delivery tracking.',
      icon: Layers,
    },
    {
      title: 'Escrow Buyer Protection',
      description: 'Secure split checkout via Razorpay & Stripe Connect with automated payouts and escrow protection.',
      icon: Lock,
    },
  ];

  return (
    <div className="hidden lg:flex flex-col justify-between bg-slate-900 p-12 lg:p-16 text-white relative overflow-hidden border-r border-slate-800">
      {/* Top Branding */}
      <div className="relative z-10">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:bg-indigo-500 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
              <path d="M2 7h20" />
            </svg>
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white block">
              MarketNest
            </span>
          </div>
        </Link>
      </div>

      {/* Center Value Propositions */}
      <div className="relative z-10 my-10 space-y-8">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 block mb-2">
            Multi-Vendor Commerce Engine
          </span>
          <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
            Start Selling or Shopping in Minutes.
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2.5 leading-relaxed max-w-md font-normal">
            Join thousands of shoppers and top-rated merchants trading on India’s modern multi-vendor commerce engine.
          </p>
        </div>

        {/* 3 Value Props with generous vertical space-y-6 */}
        <div className="space-y-6 pt-2">
          {valueProps.map((vp, idx) => {
            const Icon = vp.icon;
            return (
              <div key={idx} className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center flex-shrink-0 text-slate-300">
                  <Icon size={17} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white tracking-wide">
                    {vp.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    {vp.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Social-Proof Testimonial Card */}
      <div className="relative z-10 p-5 rounded-xl bg-slate-800/80 border border-slate-700/80 shadow-sm">
        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          "MarketNest’s instant split payments and automated suborder fulfillment boosted our direct customer reach by 340% in our first quarter."
        </p>

        <div className="flex items-center gap-3 pt-3 border-t border-slate-700">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80"
            alt="Ananya Verma"
            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-600 flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">Ananya Verma</p>
            <p className="text-[11px] text-slate-400 truncate">Founder, TechNova Audio</p>
          </div>
          <span className="ml-auto text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
            ₹18.4L+ Sales
          </span>
        </div>
      </div>
    </div>
  );
}
