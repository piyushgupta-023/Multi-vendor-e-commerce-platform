import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Plus, Minus, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { useStore } from '../../store/useStore';

const formatPrice = (price) => `₹${price.toLocaleString('en-IN')}`;

export default function CartDrawer() {
  const { cartOpen, setCartOpen, cartItems, cartTotal, updateQuantity, removeFromCart, clearCart } = useStore();

  const freeShippingThreshold = 999;
  const progressToFreeShipping = Math.min((cartTotal / freeShippingThreshold) * 100, 100);
  const remainingForFreeShipping = Math.max(freeShippingThreshold - cartTotal, 0);

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
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                  <ShoppingCart size={18} />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-base">Shopping Bag</h2>
                  <p className="text-xs text-gray-500 font-medium">
                    {cartItems.length} unique item{cartItems.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                aria-label="Close cart"
              >
                <X size={18} />
              </button>
            </div>

            {/* Free shipping progress banner */}
            <div className="bg-indigo-50/70 border-b border-indigo-100/60 px-6 py-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-900 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Truck size={14} className="text-indigo-600" />
                  {remainingForFreeShipping > 0
                    ? `Add ${formatPrice(remainingForFreeShipping)} more for FREE shipping!`
                    : '🎉 You have qualified for FREE standard delivery!'}
                </span>
                <span className="text-[11px] text-indigo-600">{Math.round(progressToFreeShipping)}%</span>
              </div>
              <div className="w-full bg-indigo-200/50 h-1.5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToFreeShipping}%` }}
                  transition={{ duration: 0.5 }}
                  className="bg-indigo-600 h-full rounded-full"
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
                  <div className="w-24 h-24 rounded-3xl bg-indigo-50 flex items-center justify-center">
                    <ShoppingBag size={44} className="text-indigo-300" />
                  </div>
                  <div className="max-w-xs">
                    <p className="font-bold text-gray-900 text-lg">Your bag is empty</p>
                    <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                      Explore top-rated products from our verified multi-vendor marketplace
                    </p>
                  </div>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-6 py-2.5 rounded-xl font-semibold text-xs shadow-md shadow-indigo-500/20"
                  >
                    Start Shopping Now
                  </button>
                </div>
              ) : (
                <AnimatePresence>
                  {cartItems.map((item) => (
                    <motion.div
                      key={item._id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex gap-3.5 p-3.5 bg-gray-50/80 hover:bg-gray-50 rounded-2xl border border-gray-100 transition-colors"
                    >
                      <div className="w-18 h-18 rounded-xl overflow-hidden bg-white border border-gray-100 flex-shrink-0 shadow-sm">
                        <img
                          src={item.images?.[0]?.url || `https://picsum.photos/seed/${item._id}/200/200`}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug">
                              {item.name}
                            </h4>
                            <button
                              onClick={() => removeFromCart(item._id)}
                              className="w-6 h-6 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors flex-shrink-0"
                              title="Remove item"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          {item.vendorProfileId?.storeName && (
                            <p className="text-[10px] text-gray-400 font-medium truncate mt-0.5">
                              Sold by: {item.vendorProfileId.storeName}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-1">
                          <span className="text-sm font-black text-indigo-600">
                            {formatPrice(item.price * item.quantity)}
                          </span>

                          <div className="flex items-center gap-2 bg-white border border-gray-200 px-1.5 py-0.5 rounded-lg shadow-2xs">
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity - 1)}
                              className="w-5 h-5 rounded hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="text-xs font-bold text-gray-800 w-4 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity + 1)}
                              className="w-5 h-5 rounded hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer Summary & Checkout */}
            {cartItems.length > 0 && (
              <div className="px-6 py-5 border-t border-gray-100 space-y-4 bg-white shadow-lg">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Subtotal</span>
                    <span className="font-semibold text-gray-800">{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Shipping</span>
                    <span className="font-semibold text-emerald-600">
                      {remainingForFreeShipping === 0 ? 'FREE' : '₹99'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-sm font-bold text-gray-900">Total Amount</span>
                    <span className="text-xl font-black text-indigo-600">
                      {formatPrice(cartTotal + (remainingForFreeShipping === 0 ? 0 : 99))}
                    </span>
                  </div>
                </div>

                <button
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.99] cursor-pointer"
                >
                  Proceed to Secure Checkout <ArrowRight size={16} />
                </button>

                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={13} className="text-emerald-500" /> 100% Buyer Protection
                  </span>
                  <button
                    onClick={clearCart}
                    className="hover:text-rose-500 transition-colors underline cursor-pointer"
                  >
                    Empty Bag
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
