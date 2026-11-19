import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  CreditCard, 
  Banknote, 
  Truck, 
  Store, 
  CheckCircle2, 
  ArrowRight, 
  Lock, 
  Package, 
  Loader2,
  Tag,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const formatPrice = (price) => `₹${Math.round(price || 0).toLocaleString('en-IN')}`;

// Utility to load official Razorpay SDK script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CheckoutPage() {
  const { cartItems, cartTotal, addOrder, showToast } = useStore();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const [shippingAddress, setShippingAddress] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    street: user?.addresses?.[0]?.street || '',
    city: user?.addresses?.[0]?.city || '',
    state: user?.addresses?.[0]?.state || '',
    pincode: user?.addresses?.[0]?.pincode || '',
    country: 'India',
  });

  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay' | 'cod'
  const [pincodeStatus, setPincodeStatus] = useState('');

  // Pre-load Razorpay SDK script on component mount
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  // Update address from user when user loads
  useEffect(() => {
    if (user) {
      setShippingAddress((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone || user.phone || '',
        street: prev.street || user.addresses?.[0]?.street || '',
        city: prev.city || user.addresses?.[0]?.city || '',
        state: prev.state || user.addresses?.[0]?.state || '',
        pincode: prev.pincode || user.addresses?.[0]?.pincode || '',
      }));
    }
  }, [user]);

  // Group cart items by vendor for the order summary breakdown
  const vendorGroups = useMemo(() => {
    const groups = {};
    cartItems.forEach((item) => {
      const p = item.productId && typeof item.productId === 'object' ? item.productId : item;
      const vendorName = item.vendorStoreName || p.vendorProfileId?.storeName || item.storeName || (
        p.category === 'Electronics' ? 'TechNova Electronics' :
        p.category === 'Fashion' ? 'UrbanThread Fashion' :
        'CasaCraft Home & Kitchen'
      );
      const vId = item.vendorId || p.vendorId || 'vendor_default';

      if (!groups[vendorName]) {
        groups[vendorName] = {
          vendorName,
          vendorId: vId,
          items: [],
          subtotal: 0,
        };
      }
      const itemPrice = parseFloat(item.price || p.price) || 0;
      const itemQty = item.quantity || 1;
      groups[vendorName].items.push({ ...item, price: itemPrice, quantity: itemQty });
      groups[vendorName].subtotal += itemPrice * itemQty;
    });
    return Object.values(groups);
  }, [cartItems]);

  const itemsSellingTotal = cartTotal || 0;
  const itemsMrpTotal = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const p = item.productId && typeof item.productId === 'object' ? item.productId : item;
      const mrp = p.comparePrice ? parseFloat(p.comparePrice) : (parseFloat(p.price || item.price || 0) * 1.35);
      const qty = item.quantity || 1;
      return acc + (mrp * qty);
    }, 0);
  }, [cartItems]);

  const productSavings = Math.max(0, Math.round(itemsMrpTotal - itemsSellingTotal));
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const discountedSubtotal = Math.max(0, itemsSellingTotal - discountAmount);
  const shippingCost = discountedSubtotal >= 1000 || discountedSubtotal === 0 ? 0 : 40;
  const platformSecurityFee = discountedSubtotal > 0 ? 15 : 0;
  const grandTotal = discountedSubtotal + shippingCost + platformSecurityFee;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));

    if (name === 'pincode') {
      const pincode = value.replace(/\D/g, '').slice(0, 6);
      setPincodeStatus('');
      if (pincode.length === 6) {
        api.get(`/location/pincode/${pincode}`)
          .then((res) => {
            if (res.data?.success && res.data.data) {
              const location = res.data.data;
              setShippingAddress((prev) => ({
                ...prev,
                pincode,
                city: prev.city || location.district || '',
                state: prev.state || location.state || '',
              }));
              setPincodeStatus('PIN code verified');
            }
          })
          .catch((err) => {
            setPincodeStatus(err.response?.data?.message || 'Could not verify PIN code');
          });
      }
    }
  };

  // Real coupon validation API
  const handleApplyCoupon = async (e) => {
    e?.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    const codeUpper = couponCode.toUpperCase().trim();

    try {
      const res = await api.post('/coupons/validate', { code: codeUpper, subtotal: cartTotal });
      if (res.data?.success && res.data.data) {
        setAppliedCoupon({
          code: res.data.data.code,
          discountAmount: res.data.data.discountAmount,
          description: res.data.data.description,
        });
        showToast(`Coupon "${codeUpper}" applied! Saved ${formatPrice(res.data.data.discountAmount)}`, 'success');
      } else {
        showToast(res.data?.message || 'Invalid coupon code', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Invalid coupon code. Try WELCOME20 or PRIME10', 'error');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    showToast('Coupon removed', 'info');
  };

  // Main checkout submission handler
  const handleCheckout = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      showToast('Please sign in or create an account to place your order.', 'info');
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }

    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.pincode || !shippingAddress.phone) {
      showToast('Please fill in complete shipping address and contact details.', 'error');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(shippingAddress.phone.replace(/\D/g, '').slice(-10))) {
      showToast('Please enter a valid 10-digit Indian mobile number.', 'error');
      return;
    }
    if (!/^\d{6}$/.test(shippingAddress.pincode)) {
      showToast('Please enter a valid 6-digit PIN code.', 'error');
      return;
    }

    if (cartItems.length === 0) {
      showToast('Your shopping cart is empty.', 'error');
      navigate('/');
      return;
    }

    setLoading(true);

    try {
      // 1. Prepare items payload for multi-vendor checkout
      const orderItems = cartItems.map((item) => {
        const p = item.productId && typeof item.productId === 'object' ? item.productId : item;
        return {
          productId: p._id || p.id || item.productId,
          vendorId: item.vendorId || p.vendorId,
          name: p.name || p.title || item.name,
          image: p.images?.[0]?.url || item.image || (typeof p.images?.[0] === 'string' ? p.images[0] : ''),
          price: parseFloat(item.price || p.price) || 0,
          quantity: item.quantity || 1,
        };
      });

      // 2. Create master Order and vendor SubOrders in MongoDB
      const checkoutPayload = {
        shippingAddress,
        paymentMethod,
        couponApplied: appliedCoupon ? { code: appliedCoupon.code, discountAmount: appliedCoupon.discountAmount } : null,
        items: orderItems,
      };

      const checkoutRes = await api.post('/orders/checkout', checkoutPayload);

      if (!checkoutRes.data?.success || !checkoutRes.data.data?.order) {
        throw new Error(checkoutRes.data?.message || 'Failed to create order on server');
      }

      const createdOrder = checkoutRes.data.data.order;
      const subOrders = checkoutRes.data.data.subOrders || [];

      // 3. Cash on Delivery Flow
      if (paymentMethod === 'cod') {
        addOrder({ ...createdOrder, subOrders });
        showToast('Order confirmed via Cash on Delivery!', 'success');
        navigate('/orders');
        return;
      }

      // 4. Razorpay Payment Flow
      // Create Razorpay order on server
      const rzpOrderRes = await api.post(`/payments/razorpay/create-order/${createdOrder._id}`);
      if (!rzpOrderRes.data?.success || !rzpOrderRes.data.data) {
        throw new Error(rzpOrderRes.data?.message || 'Failed to initialize payment gateway with server');
      }

      const { razorpayOrderId, amount, currency, keyId } = rzpOrderRes.data.data;

      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded || !window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      // Launch official Razorpay Checkout modal
      const options = {
        key: keyId || '',
        amount,
        currency: currency || 'INR',
        name: 'MarketNest Marketplace',
        description: `Payment for Order ${createdOrder.orderNumber}`,
        order_id: razorpayOrderId,
        prefill: {
          name: shippingAddress.name || user?.name || '',
          email: user?.email || '',
          contact: shippingAddress.phone || user?.phone || '',
        },
        theme: {
          color: '#4f46e5',
        },
        handler: async (response) => {
          try {
            setLoading(true);
            // Verify HMAC SHA-256 signature with backend
            const verifyRes = await api.post('/payments/razorpay/verify', {
              orderId: createdOrder._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data?.success) {
              showToast('Payment verified successfully! Welcome to MarketNest Orders.', 'success');
              addOrder({
                ...createdOrder,
                paymentStatus: 'paid',
                subOrders,
              });
              navigate('/orders');
            } else {
              showToast('Payment signature verification failed. Please contact support.', 'error');
            }
          } catch (verifyErr) {
            showToast(verifyErr.response?.data?.message || 'Payment verification failed on server.', 'error');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            showToast('Payment window dismissed. Your order remains pending.', 'info');
            setLoading(false);
          },
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', (resp) => {
        showToast(`Payment failed: ${resp.error?.description || 'Transaction unsuccessful'}`, 'error');
        setLoading(false);
      });
      rzpInstance.open();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'An error occurred during checkout.';
      showToast(errorMsg, 'error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-5 flex items-center gap-2 text-xs leading-5 text-slate-500">
          <Link to="/" className="hover:text-indigo-600">Home</Link>
          <span>/</span>
          <Link to="/cart" className="hover:text-indigo-600">Cart</Link>
          <span>/</span>
          <span className="font-semibold text-slate-900">Secure Checkout</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Forms */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. Shipping Address Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-950 text-white text-xs flex items-center justify-center font-bold">1</span>
                  <span>Delivery Address</span>
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  <Truck size={14} />
                  <span>Doorstep Courier</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={shippingAddress.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Aarav Sharma"
                    className="w-full p-2.5 rounded-lg border border-slate-300 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={shippingAddress.phone}
                    onChange={handleInputChange}
                    required
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="e.g. 9820012345"
                    className="w-full p-2.5 rounded-lg border border-slate-300 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Street Address, Apt / Floor</label>
                  <input
                    type="text"
                    name="street"
                    value={shippingAddress.street}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. 42 Palm Avenue, Silver Heights, Apt 4B"
                    className="w-full p-2.5 rounded-lg border border-slate-300 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={shippingAddress.city}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Mumbai"
                    className="w-full p-2.5 rounded-lg border border-slate-300 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={shippingAddress.state}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Maharashtra"
                    className="w-full p-2.5 rounded-lg border border-slate-300 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">PIN Code</label>
                  <input
                    type="text"
                    name="pincode"
                    value={shippingAddress.pincode}
                    onChange={handleInputChange}
                    required
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="e.g. 400050"
                    className="w-full p-2.5 rounded-lg border border-slate-300 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-900 font-mono"
                  />
                  {pincodeStatus && (
                    <p className={`mt-1.5 text-[11px] font-semibold ${pincodeStatus === 'PIN code verified' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {pincodeStatus}
                    </p>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={shippingAddress.country}
                    disabled
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-100 text-slate-600 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* 2. Payment Method Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-950 text-white text-xs flex items-center justify-center font-bold">2</span>
                  <span>Payment Gateway & Protection</span>
                </h2>
                <span className="text-[11px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Escrow Buyer Protection
                </span>
              </div>

              <div className="space-y-3">
                {/* Official Razorpay Option */}
                <label
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'razorpay'
                      ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${paymentMethod === 'razorpay' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 text-sm">Razorpay Official Gateway</p>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                          UPI · Cards · NetBanking
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Instant signature verification with automated escrow payout routing</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                </label>

                {/* Cash on Delivery */}
                <label
                  onClick={() => setPaymentMethod('cod')}
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${paymentMethod === 'cod' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Banknote size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Cash on Delivery (COD)</p>
                      <p className="text-xs text-slate-500">Pay cash or scan QR at your doorstep upon parcel arrival</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                </label>
              </div>
            </div>

            {/* 3. Multi-Vendor Sub-Orders Breakdown */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-950 text-white text-xs flex items-center justify-center font-bold">3</span>
                  <span>Items Dispatched by Vendor ({vendorGroups.length} Packages)</span>
                </h2>
              </div>

              {vendorGroups.map((group, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-900 text-xs">
                        Package {idx + 1}: Sold by <span className="text-indigo-600 font-extrabold">{group.vendorName}</span>
                      </span>
                      <ShieldCheck size={14} className="text-indigo-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">Subtotal: {formatPrice(group.subtotal)}</span>
                  </div>

                  <div className="space-y-2">
                    {group.items.map((item, iIdx) => (
                      <div key={iIdx} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image || item.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                            alt={item.name}
                            className="w-10 h-10 object-cover rounded-md border border-slate-100"
                          />
                          <div>
                            <p className="font-bold text-slate-900 line-clamp-1">{item.name}</p>
                            <p className="text-slate-500 text-[11px]">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                          </div>
                        </div>
                        <span className="font-bold text-slate-950">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Right Column: Order Summary & Place Order */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 sticky top-6 space-y-6">
              
              <h3 className="text-base font-black text-slate-900 pb-3 border-b border-slate-100">
                Order Summary
              </h3>

              {/* Coupon Form */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Apply Promo Code</label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-emerald-600" />
                      <div>
                        <span className="font-black text-emerald-900 font-mono">{appliedCoupon.code}</span>
                        <p className="text-[10px] text-emerald-700">{appliedCoupon.description}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="e.g. WELCOME20"
                      className="flex-1 p-2 rounded-lg border border-slate-300 text-xs font-mono uppercase outline-none focus:border-indigo-600"
                    />
                    <button
                      type="submit"
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                    >
                      {couponLoading ? <Loader2 size={13} className="animate-spin" /> : 'Apply'}
                    </button>
                  </form>
                )}
              </div>

              {/* Enterprise Financial Calculation Lines */}
              <div className="space-y-2.5 text-xs pt-2 border-t border-slate-100">
                <div className="flex justify-between text-slate-600">
                  <span>Items Total (MRP):</span>
                  <span className="font-semibold text-slate-900">{formatPrice(itemsMrpTotal)}</span>
                </div>

                {productSavings > 0 && (
                  <div className="flex justify-between text-green-700 font-semibold">
                    <span>Product Discount:</span>
                    <span>-{formatPrice(productSavings)}</span>
                  </div>
                )}

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Coupon Savings ({appliedCoupon?.code}):</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Estimated Delivery:</span>
                  <span className="font-semibold text-slate-900">
                    {shippingCost === 0 ? <span className="text-green-700 font-bold">FREE</span> : formatPrice(shippingCost)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Platform Security Fee:</span>
                  <span className="font-semibold text-slate-900">{formatPrice(platformSecurityFee)}</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-black text-slate-900">Total Order Amount:</span>
                  <span className="text-xl font-black text-slate-950 tracking-tight">{formatPrice(grandTotal)}</span>
                </div>

                {(productSavings > 0 || discountAmount > 0) && (
                  <div className="p-2 bg-green-50 rounded-lg text-center text-xs font-bold text-green-800 border border-green-200">
                    🎉 Total Savings: {formatPrice(productSavings + discountAmount)}
                  </div>
                )}
              </div>

              {/* Place Order CTA */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={loading || cartItems.length === 0}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <Lock size={15} />
                    <span>Place Order & Pay {formatPrice(grandTotal)}</span>
                  </>
                )}
              </button>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>100% Buyer Protection</span>
                </div>
                <p>Your payment is retained in automated escrow and credited to merchants upon delivery confirmation.</p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
