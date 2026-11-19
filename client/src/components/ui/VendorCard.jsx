import { Link, useNavigate } from 'react-router-dom';
import { Star, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function VendorCard({ vendor }) {
  const navigate = useNavigate();
  const vendorTargetId = vendor._id || vendor.id || vendor.storeSlug || (vendor.storeName || '').toLowerCase().replace(/[^a-z0-9]/g, '-');

  const handleVisitStore = (e) => {
    e?.stopPropagation();
    navigate(`/store/${vendorTargetId}`);
  };

  return (
    <div 
      onClick={handleVisitStore}
      className="mn-vendor-card group bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer"
    >
      <div>
        {/* Header: Logo, Category Tag & Verification */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl border border-slate-200 shadow-sm overflow-hidden bg-white p-1 flex-shrink-0">
            <img
              src={vendor.logo || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200&auto=format&fit=crop&q=80'}
              alt={vendor.storeName}
              className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/product-placeholder.svg';
              }}
            />
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-indigo-100">
              {vendor.category || 'Retail Merchant'}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>Verified Seller</span>
            </span>
          </div>
        </div>

        {/* Store Name & Description */}
        <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors flex items-center gap-1.5 mb-1.5">
          <span>{vendor.storeName}</span>
        </h3>
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
          {vendor.storeDescription || `Official creator and licensed distributor on MarketNest.`}
        </p>
      </div>

      {/* Footer: Rating & Visit Storefront Link */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <Star size={14} className="fill-amber-400 text-amber-400" />
          <span>{vendor.rating || 4.8}</span>
          <span className="text-slate-400 font-normal">/ 5.0</span>
        </div>

        <Link
          to={`/store/${vendorTargetId}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-all group-hover:translate-x-0.5 cursor-pointer"
        >
          <span>Visit Store &rarr;</span>
        </Link>
      </div>
    </div>
  );
}
