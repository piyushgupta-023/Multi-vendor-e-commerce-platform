import { Zap, ShieldCheck, Truck, Clock, RefreshCw, Mail, ArrowRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-white mt-20 border-t border-slate-900">
      {/* Value Proposition Highlights Banner */}
      <div className="border-b border-slate-900 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                <Truck size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Free Express Shipping</h4>
                <p className="text-[11px] text-slate-400">On all eligible orders over ₹999</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">100% Authentic Guarantee</h4>
                <p className="text-[11px] text-slate-400">Directly from vetted merchant partners</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                <RefreshCw size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">7-Day Easy Returns</h4>
                <p className="text-[11px] text-slate-400">Hassle-free doorstep pickup</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">24/7 Dedicated Support</h4>
                <p className="text-[11px] text-slate-400">Live chat & express email assistance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <Zap size={18} className="fill-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                MarketNest
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              The premier next-generation multi-vendor e-commerce marketplace connecting discerning customers with certified merchants, artisan makers, and official brand outlets worldwide.
            </p>

            <div className="pt-2">
              <p className="text-xs font-bold text-white mb-2">Subscribe to Exclusive Drops & Deals</p>
              <div className="flex items-center max-w-sm bg-slate-900 border border-slate-800 rounded-xl overflow-hidden focus-within:border-indigo-500 transition-colors">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="w-full bg-transparent px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none"
                />
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2.5 transition-colors cursor-pointer">
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
              Explore Collections
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><a href="#products" className="hover:text-indigo-400 transition-colors">Electronics & Gadgets</a></li>
              <li><a href="#products" className="hover:text-indigo-400 transition-colors">Fashion & Streetwear</a></li>
              <li><a href="#products" className="hover:text-indigo-400 transition-colors">Home & Living Décor</a></li>
              <li><a href="#products" className="hover:text-indigo-400 transition-colors">Sports & Activewear</a></li>
              <li><a href="#products" className="hover:text-indigo-400 transition-colors">Beauty & Personal Care</a></li>
              <li><a href="#products" className="hover:text-indigo-400 transition-colors">Artisanal Gourmet</a></li>
            </ul>
          </div>

          {/* Merchant / Vendor Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
              Sell on MarketNest
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Become a Verified Seller</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Vendor Dashboard Demo</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Commission & Fee Matrix</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Fulfilled by MarketNest</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Merchant Code of Conduct</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Vendor API Documentation</a></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
              Customer Experience
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Track Package Status</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Help Center & FAQ</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Buyer Protection Program</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Shipping Rates & Policies</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Report a Vendor Issue</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Security & Bug Bounty</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal & Payment Badges */}
        <div className="border-t border-slate-900 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} MarketNest Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Cookie Preferences</a>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400 font-medium">Secured with 256-Bit TLS Encryption</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
