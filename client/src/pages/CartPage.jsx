import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ShieldCheck, 
  ArrowRight, 
  Store
} from 'lucide-react';
import { useStore } from '../store/useStore';
import ProductImage from '../components/ui/ProductImage';

const formatPrice = (price) => `₹${Math.round(price || 0).toLocaleString('en-IN')}`;

export default function CartPage() {
  const { cartItems, cartCount, cartTotal, updateQuantity, removeFromCart, clearCart } = useStore();
  const navigate = useNavigate();

  // Financial calculations
  const itemsSellingTotal = cartTotal || 0;
  
  // Calculate MRP sum from items
  const itemsMrpTotal = cartItems.reduce((acc, item) => {
    const p = item.productId && typeof item.productId === 'object' ? item.productId : item;
    const mrp = p.comparePrice || (p.price ? p.price * 1.35 : 0);
    const qty = item.quantity || 1;
    return acc + (mrp * qty);
  }, 0);

  const productSavings = Math.max(0, Math.round(itemsMrpTotal - itemsSellingTotal));
  const deliveryFee = itemsSellingTotal >= 1000 || itemsSellingTotal === 0 ? 0 : 40;
  const platformSecurityFee = itemsSellingTotal > 0 ? 15 : 0;
  const grandTotal = Math.max(0, itemsSellingTotal + deliveryFee + platformSecurityFee);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-lg w-full text-center space-y-4 shadow-xs border border-slate-200">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100">
            <ShoppingCart size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Your Shopping Cart is Empty</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Discover verified products from independent makers and artisans. Add your favorites to begin checkout.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <span>Explore Catalog</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Shopping Cart</h1>
            <p className="text-sm text-slate-500 mt-1">{cartCount} items from verified merchants</p>
          </div>
          <button
            onClick={clearCart}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Clear Cart</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Multi-Vendor Split Shipments (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {(() => {
              const vendorShipments = {};
              cartItems.forEach((item) => {
                const p = item.productId && typeof item.productId === 'object' ? item.productId : item;
                const storeName = item.vendorStoreName || p.vendorProfileId?.storeName || (
                  p.category === 'Electronics' ? 'TechNova Electronics' :
                  p.category === 'Fashion' ? 'UrbanThread Fashion' :
                  'CasaCraft Home & Kitchen'
                );
                if (!vendorShipments[storeName]) {
                  vendorShipments[storeName] = [];
                }
                vendorShipments[storeName].push(item);
              });

              return Object.entries(vendorShipments).map(([storeName, packageItems], packageIdx) => (
                <div key={storeName} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  
                  {/* Package Shipment Header */}
                  <div className="bg-slate-50 px-4 sm:px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                        {packageIdx + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        Package {packageIdx + 1}: Sold by <span className="text-indigo-600 font-black">{storeName}</span>
                      </span>
                      <ShieldCheck size={14} className="text-indigo-600" />
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {packageItems.length} item(s) • Direct Vendor Dispatch
                    </span>
                  </div>

                  {/* Items in this Package */}
                  <div className="p-4 sm:p-5 divide-y divide-slate-100">
                    {packageItems.map((item, idx) => {
                      const p = item.productId && typeof item.productId === 'object' ? item.productId : item;
                      const pId = p._id || p.id || item.productId;
                      const itemPrice = parseFloat(item.price || p.price) || 0;
                      const comparePrice = p.comparePrice ? parseFloat(p.comparePrice) : Math.round(itemPrice * 1.35);

                      return (
                        <div
                          key={pId || idx}
                          className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-4">
                            <Link to={`/products/${pId}`} className="shrink-0">
                              <ProductImage
                                product={{ ...p, image: item.image || p.image }}
                                alt={p.name || item.name}
                                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-slate-200 bg-slate-50"
                              />
                            </Link>

                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                <Store size={12} className="text-indigo-600" />
                                <span>{storeName}</span>
                              </div>
                              <Link
                                to={`/products/${pId}`}
                                className="text-sm sm:text-base font-semibold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-2 max-w-md"
                              >
                                {p.name || item.name || 'Product'}
                              </Link>
                              <div className="flex items-baseline gap-2">
                                <span className="text-base font-bold text-slate-950">
                                  {formatPrice(itemPrice)}
                                </span>
                                {comparePrice > itemPrice && (
                                  <span className="text-sm text-slate-400 line-through">
                                    {formatPrice(comparePrice)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                              <button
                                type="button"
                                onClick={() => updateQuantity(pId, Math.max(0, item.quantity - 1))}
                                className="p-1.5 px-2 hover:bg-slate-200 text-slate-700 cursor-pointer"
                              >
                                <Minus size={13} />
                              </button>
                              <span className="px-3 text-sm font-semibold text-slate-900 bg-white border-x border-slate-300">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(pId, item.quantity + 1)}
                                className="p-1.5 px-2 hover:bg-slate-200 text-slate-700 cursor-pointer"
                              >
                                <Plus size={13} />
                              </button>
                            </div>

                            <div className="text-right min-w-[80px]">
                              <div className="text-base font-bold text-slate-950">
                                {formatPrice(itemPrice * item.quantity)}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFromCart(pId)}
                                className="text-xs text-rose-600 hover:underline cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              ));
            })()}
          </div>

          {/* Enterprise Order Breakdown Card (4 cols) */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs sticky top-6 space-y-5">
              <h3 className="text-base font-black text-slate-900 pb-3 border-b border-slate-100">
                Order Billing Summary
              </h3>

              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Items Total (MRP):</span>
                  <span className="font-semibold text-slate-900">{formatPrice(itemsMrpTotal)}</span>
                </div>

                {productSavings > 0 && (
                  <div className="flex justify-between text-green-700 font-semibold">
                    <span>Product Discount:</span>
                    <span>-{formatPrice(productSavings)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Estimated Delivery:</span>
                  <span className="font-semibold text-slate-900">
                    {deliveryFee === 0 ? <span className="text-green-700 font-bold">FREE</span> : formatPrice(deliveryFee)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Platform Security Fee:</span>
                  <span className="font-semibold text-slate-900">{formatPrice(platformSecurityFee)}</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline text-slate-900">
                  <span className="font-semibold text-sm">Total order amount</span>
                  <span className="text-xl font-bold text-slate-950">{formatPrice(grandTotal)}</span>
                </div>

                {productSavings > 0 && (
                  <div className="p-2 bg-green-50 rounded-lg text-center text-xs font-bold text-green-800 border border-green-200">
                    🎉 You will save {formatPrice(productSavings)} on this order!
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate('/checkout')}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={15} />
              </button>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Escrow Buyer Guarantee</span>
                </div>
                <p>Protected payment disbursement to sellers upon confirmed delivery & inspection.</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
