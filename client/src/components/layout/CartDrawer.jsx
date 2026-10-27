import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  Store,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { useStore } from '../../store/useStore';

const formatPrice = (price) => `₹${Math.round(price).toLocaleString('en-IN')}`;

export default function CartDrawer() {
  const { cartOpen, setCartOpen, cartItems, cartTotal, updateQuantity, removeFromCart } = useStore();
  const navigate = useNavigate();

  const freeShippingThreshold = 999;
  const progressToFreeShipping = Math.min((cartTotal / freeShippingThreshold) * 100, 100);
  const remainingForFreeShipping = Math.max(freeShippingThreshold - cartTotal, 0);

  // Group cart items by Seller / Vendor
  const vendorGroups = useMemo(() => {
    const groups = {};
    cartItems.forEach((item) => {
      const vendorName = 
        item.vendorProfileId?.storeName || 
        item.vendorStoreName || 
        item.storeName || 
        'TechNova Electronics';
      
      if (!groups[vendorName]) {
        groups[vendorName] = {
          vendorName,
          items: [],
          subtotal: 0,
        };
      }
      groups[vendorName].items.push(item);
      groups[vendorName].subtotal += (parseFloat(item.price) || 0) * (item.quantity || 1);
    });
    return Object.values(groups);
  }, [cartItems]);

  const shippingCost = cartTotal > 999 || cartTotal === 0 ? 0 : 99;
  const estimatedTax = Math.round(cartTotal * 0.18);
  const grandTotal = cartTotal + shippingCost + estimatedTax;

  const handleProceedToCheckout = () => {
    setCartOpen(false);
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-slate-50 z-50 shadow-2xl flex flex-col font-sans"
          >
            {/* 1. Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-[#131921] text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  <ShoppingCart size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="font-extrabold text-white text-base tracking-tight flex items-center gap-2">
                    <span>Marketplace Cart</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-amber-400">
                      {cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0)} items
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Unified Multi-Vendor Split Checkout
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCartOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                aria-label="Close cart"
              >
                <X size={18} />
              </button>
            </div>

            {/* 2. Free Shipping Threshold Progress */}
            <div className="bg-amber-50/80 border-b border-amber-200/60 px-5 py-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-amber-950 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Truck size={14} className="text-amber-600" />
                  {remainingForFreeShipping > 0
                    ? `Add ${formatPrice(remainingForFreeShipping)} more for FREE Escrow Delivery!`
                    : '🎉 You unlocked FREE Prime Delivery!'}
                </span>
                <span className="text-[11px] text-amber-700 font-bold">{Math.round(progressToFreeShipping)}%</span>
              </div>
              <div className="w-full bg-amber-200/50 h-1.5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToFreeShipping}%` }}
                  transition={{ duration: 0.4 }}
                  className="bg-amber-500 h-full rounded-full"
                />
              </div>
            </div>

            {/* 3. Items List Grouped By Seller */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
                  <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-300 shadow-2xs">
                    <ShoppingBag size={40} />
                  </div>
                  <div className="max-w-xs space-y-1">
                    <p className="font-bold text-slate-900 text-base">Your MarketNest cart is empty</p>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      Discover independent makers, audio gear, and curated fashion drops on our storefront.
                    </p>
                  </div>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="mt-2 bg-amber-400 hover:bg-amber-500 text-slate-950 px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Explore Products
                  </button>
                </div>
              ) : (
                vendorGroups.map((group, groupIndex) => (
                  <div 
                    key={groupIndex}
                    className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden"
                  >
                    {/* Seller Sub-Header */}
                    <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Store size={14} className="text-indigo-600 flex-shrink-0" />
                        <span className="text-xs font-bold text-slate-800 truncate">
                          Sold by {group.vendorName}
                        </span>
                        <ShieldCheck size={12} className="text-indigo-600 flex-shrink-0" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">
                        Subtotal: <strong className="text-slate-900">{formatPrice(group.subtotal)}</strong>
                      </span>
                    </div>

                    {/* Products from this vendor */}
                    <div className="divide-y divide-slate-100">
                      {group.items.map((item) => {
                        const pId = item._id || item.id;
                        const itemPrice = parseFloat(item.price) || 0;
                        const itemQty = item.quantity || 1;
                        const itemImage = 
                          item.images?.[0]?.url || 
                          (typeof item.images?.[0] === 'string' ? item.images[0] : null) || 
                          item.image || 
                          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80';

                        return (
                          <div key={pId} className="p-3.5 flex gap-3 items-center">
                            {/* Product Thumbnail */}
                            <img
                              src={itemImage}
                              alt={item.name || item.title}
                              className="w-16 h-16 rounded-lg object-cover border border-slate-200 flex-shrink-0 bg-slate-50"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80';
                              }}
                            />

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 line-clamp-1 leading-snug">
                                {item.name || item.title}
                              </h4>
                              <p className="text-xs font-extrabold text-slate-900 mt-0.5">
                                {formatPrice(itemPrice)}
                              </p>

                              {/* Quantity Controls & Remove */}
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                                  <button
                                    onClick={() => updateQuantity(pId, itemQty - 1)}
                                    className="p-1 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                                    title="Decrease quantity"
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <span className="px-2 text-xs font-bold text-slate-800">
                                    {itemQty}
                                  </span>
                                  <button
                                    onClick={() => updateQuantity(pId, itemQty + 1)}
                                    className="p-1 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                                    title="Increase quantity"
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>

                                <button
                                  onClick={() => removeFromCart(pId)}
                                  className="text-slate-400 hover:text-rose-600 p-1 text-xs transition-colors cursor-pointer"
                                  title="Remove item"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 4. Bottom Order Summary & Proceed Action */}
            {cartItems.length > 0 && (
              <div className="bg-white border-t border-slate-200 p-4 sm:p-5 space-y-3 shadow-lg">
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Items Subtotal:</span>
                    <span className="font-bold text-slate-900">{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Estimated Shipping:</span>
                    <span className="font-bold text-emerald-600">
                      {shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Estimated GST (18%):</span>
                    <span className="font-bold text-slate-900">{formatPrice(estimatedTax)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-sm">
                    <span className="font-black text-slate-900">Total Amount:</span>
                    <span className="text-base font-black text-slate-950">
                      {formatPrice(grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <button
                  onClick={handleProceedToCheckout}
                  className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-950 font-black text-sm tracking-wide shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer group"
                >
                  <Lock size={15} />
                  <span>Proceed to Checkout ({cartItems.length} items)</span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  <span>Split payments protected by MarketNest Escrow</span>
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
