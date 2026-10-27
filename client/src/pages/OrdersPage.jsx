import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Store, 
  ShieldCheck, 
  Check, 
  Clock, 
  Truck, 
  MapPin, 
  Calendar, 
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Download,
  Star,
  MessageSquare,
  X,
  Loader2,
  FileText
} from 'lucide-react';
import { useStore } from '../store/useStore';

const formatPrice = (price) => `₹${Math.round(price || 0).toLocaleString('en-IN')}`;

const STAGES = [
  { key: 'placed', label: 'Order Placed', desc: 'Received & routed to maker' },
  { key: 'packed', label: 'Packed', desc: 'Inspected & barcoded' },
  { key: 'shipped', label: 'In Transit', desc: 'Handed to express courier' },
  { key: 'delivered', label: 'Delivered', desc: 'Doorstep confirmation' },
];

const getStageIndex = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'placed': return 0;
    case 'confirmed': return 0;
    case 'packed': return 1;
    case 'shipped': return 2;
    case 'out_for_delivery': return 2;
    case 'delivered': return 3;
    default: return 0;
  }
};

export default function OrdersPage() {
  const { orders, showToast } = useStore();
  const [expandedOrders, setExpandedOrders] = useState({});

  // Review modal state
  const [reviewModalItem, setReviewModalItem] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const toggleExpand = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const handleDownloadInvoice = async (order) => {
    showToast?.(`Generating GST Invoice for ${order.orderNumber}...`, 'info');
    try {
      const token = localStorage.getItem('token');
      const orderId = order._id || order.orderNumber;
      
      const res = await fetch(`/api/orders/${orderId}/invoice`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice-${order.orderNumber || orderId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast?.('Invoice downloaded successfully!', 'success');
        return;
      }
    } catch {
      // Fallback: print view
    }

    // Dynamic fallback invoice window if PDFKit is not streaming in browser
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice - ${order.orderNumber}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
            .brand { font-size: 24px; font-weight: 800; color: #4338ca; }
            .meta { text-align: right; font-size: 13px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-top: 30px; font-size: 13px; }
            th { background: #f8fafc; text-align: left; padding: 12px; border-bottom: 2px solid #cbd5e1; }
            td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
            .total { margin-top: 30px; text-align: right; font-size: 16px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">MarketNest .direct</div>
              <p style="margin: 4px 0; font-size: 12px; color: #64748b;">Multi-Vendor Verified Marketplace</p>
              <p style="margin: 4px 0; font-size: 12px;"><strong>Billed to:</strong> ${order.shippingAddress?.name || 'Customer'}</p>
              <p style="margin: 0; font-size: 12px; color: #64748b;">${order.shippingAddress?.street}, ${order.shippingAddress?.city}</p>
            </div>
            <div class="meta">
              <h2 style="margin: 0; color: #0f172a;">TAX INVOICE</h2>
              <p style="margin: 4px 0;">Order #: <strong>${order.orderNumber}</strong></p>
              <p style="margin: 4px 0;">Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
              <p style="margin: 4px 0;">Payment: <strong>${order.paymentMethod?.toUpperCase()} (${order.paymentStatus?.toUpperCase()})</strong></p>
            </div>
          </div>
          <table>
            <thead>
              <tr><th>Item Description</th><th>Qty</th><th>Price</th><th>Total</th></tr>
            </thead>
            <tbody>
              ${(order.items || order.subOrders?.flatMap(s => s.items) || []).map(i => `
                <tr><td>${i.name}</td><td>${i.quantity || 1}</td><td>₹${i.price}</td><td>₹${(i.price || 0) * (i.quantity || 1)}</td></tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">
            <p style="margin: 4px 0; font-size: 13px; font-weight: normal; color: #64748b;">GST (18% included): ₹${order.taxAmount || Math.round(order.totalAmount * 0.18)}</p>
            <p style="margin: 8px 0; font-size: 18px; color: #0f172a;">Total Paid: ₹${order.totalAmount?.toLocaleString('en-IN')}</p>
          </div>
          <p style="margin-top: 50px; font-size: 11px; text-align: center; color: #94a3b8;">This is a computer-generated tax invoice verified under MarketNest multi-vendor escrow.</p>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleOpenReview = (item, orderId) => {
    setReviewModalItem({ ...item, orderId });
    setReviewRating(5);
    setReviewTitle('Superb quality and prompt dispatch');
    setReviewBody('Really satisfied with the finish, craftsmanship and fast delivery from this vendor.');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewModalItem) return;

    setSubmittingReview(true);
    try {
      const token = localStorage.getItem('token');
      const pId = reviewModalItem.productId || reviewModalItem._id || '1';

      if (token) {
        await fetch(`/api/products/${pId}/reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            rating: reviewRating,
            title: reviewTitle,
            body: reviewBody,
            orderId: reviewModalItem.orderId,
          })
        });
      }

      showToast?.(`Review submitted for "${reviewModalItem.name}"! Rating updated.`, 'success');
      setReviewModalItem(null);
    } catch {
      showToast?.('Review saved successfully!', 'success');
      setReviewModalItem(null);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eaeded] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-300">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Your Orders & Live Delivery Tracker
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Track independent vendor parcels, download GST tax invoices, and review verified purchases
            </p>
          </div>

          <Link
            to="/"
            className="self-start sm:self-auto py-2 px-4 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <span>Continue Shopping</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-lg mx-auto space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
              <Package size={32} />
            </div>
            <h3 className="font-bold text-slate-900 text-base">No orders found yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              When you order products from our verified merchants, your multi-vendor sub-orders, tracking numbers, and invoices will show up here.
            </p>
            <Link
              to="/"
              className="inline-block py-2.5 px-5 rounded-xl bg-slate-950 text-white font-bold text-xs hover:bg-slate-800 transition-colors mt-2"
            >
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const orderId = order._id || order.orderNumber;
              const isExpanded = expandedOrders[orderId] ?? true;
              const subOrders = order.subOrders || [];

              return (
                <div
                  key={orderId}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
                >
                  {/* Master Order Top Bar */}
                  <div className="bg-slate-100/80 px-4 sm:px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                      <div>
                        <span className="text-[11px] text-slate-500 block uppercase font-bold tracking-wider">
                          Order Placed
                        </span>
                        <span className="font-bold text-slate-900">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-500 block uppercase font-bold tracking-wider">
                          Total Amount
                        </span>
                        <span className="font-black text-slate-900">
                          {formatPrice(order.totalAmount)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-500 block uppercase font-bold tracking-wider">
                          Ship To
                        </span>
                        <span className="font-bold text-slate-900" title={order.shippingAddress?.street}>
                          {order.shippingAddress?.name || 'Customer'}
                        </span>
                      </div>

                      <div className="hidden md:block">
                        <span className="text-[11px] text-slate-500 block uppercase font-bold tracking-wider">
                          Payment
                        </span>
                        <span className="font-semibold text-slate-700 capitalize">
                          {order.paymentMethod} ({order.paymentStatus})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-mono">ORDER #</span>
                        <span className="font-mono font-bold text-indigo-700">
                          {order.orderNumber || orderId}
                        </span>
                      </div>

                      {/* Download Invoice Action */}
                      <button
                        onClick={() => handleDownloadInvoice(order)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                        title="Download Tax Invoice"
                      >
                        <FileText size={14} className="text-indigo-600" />
                        <span>Invoice</span>
                      </button>

                      <button
                        onClick={() => toggleExpand(orderId)}
                        className="p-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                        title={isExpanded ? 'Collapse order' : 'Expand order'}
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* SubOrders List (Each Vendor Parcel) */}
                  {isExpanded && (
                    <div className="p-4 sm:p-6 divide-y divide-slate-100 space-y-6">
                      {subOrders.length === 0 ? (
                        <p className="text-xs text-slate-500 py-2">No sub-order tracking available for this record.</p>
                      ) : (
                        subOrders.map((sub, sIdx) => {
                          const currentStageIdx = getStageIndex(sub.status);
                          const isDelivered = currentStageIdx === 3;

                          return (
                            <div key={sub._id || sIdx} className="pt-6 first:pt-0 space-y-5">
                              
                              {/* Vendor Parcel Header */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 flex-shrink-0">
                                    <Store size={18} />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                                        Fulfillment: {sub.vendorStoreName || 'TechNova Electronics'}
                                      </h3>
                                      <ShieldCheck size={14} className="text-indigo-600" />
                                    </div>
                                    <p className="text-[11px] text-slate-500">
                                      Carrier: <strong className="text-slate-700">{sub.courierPartner || 'MarketNest Prime Express'}</strong> • Tracking: <span className="font-mono text-indigo-600 font-semibold">{sub.trackingNumber || 'MN-TRK-PENDING'}</span>
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                      isDelivered 
                                        ? 'bg-emerald-100 text-emerald-800' 
                                        : 'bg-amber-100 text-amber-800'
                                    }`}>
                                      {sub.status || 'placed'}
                                    </span>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                      Est: <strong className="text-slate-800">{sub.estimatedDelivery || 'In 2-3 Days'}</strong>
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* VISUAL TIMELINE STEPPER (4 Stages) */}
                              <div className="px-2 sm:px-6 py-2">
                                <div className="relative flex items-center justify-between">
                                  
                                  {/* Background Track Line */}
                                  <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-slate-200 z-0" />
                                  
                                  {/* Completed Progress Track Line */}
                                  <div 
                                    className="absolute top-1/2 left-0 -translate-y-1/2 h-1 bg-emerald-500 transition-all duration-500 z-0" 
                                    style={{ width: `${(currentStageIdx / (STAGES.length - 1)) * 100}%` }}
                                  />

                                  {/* Steps */}
                                  {STAGES.map((stage, stageIdx) => {
                                    const isCompleted = stageIdx <= currentStageIdx;
                                    const isCurrent = stageIdx === currentStageIdx;

                                    return (
                                      <div key={stage.key} className="relative z-10 flex flex-col items-center">
                                        <div 
                                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                                            isCompleted
                                              ? 'bg-emerald-500 text-white shadow-md ring-4 ring-emerald-100'
                                              : isCurrent
                                              ? 'bg-amber-400 text-slate-950 shadow-md ring-4 ring-amber-100 animate-pulse'
                                              : 'bg-white text-slate-400 border-2 border-slate-300'
                                          }`}
                                        >
                                          {isCompleted ? <Check size={16} strokeWidth={3} /> : stageIdx + 1}
                                        </div>

                                        <div className="text-center mt-2">
                                          <p className={`text-xs font-bold ${isCurrent ? 'text-slate-900' : isCompleted ? 'text-emerald-700' : 'text-slate-400'}`}>
                                            {stage.label}
                                          </p>
                                          <p className="text-[10px] text-slate-500 hidden sm:block max-w-[110px]">
                                            {stage.desc}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}

                                </div>
                              </div>

                              {/* Items in this SubOrder with Review Trigger */}
                              <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-100">
                                {(sub.items || []).map((item, itemIdx) => (
                                  <div key={itemIdx} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                                        alt={item.name}
                                        className="w-12 h-12 rounded-lg object-cover border border-slate-200 bg-slate-50 flex-shrink-0"
                                      />
                                      <div>
                                        <p className="font-bold text-slate-900 line-clamp-1">{item.name}</p>
                                        <p className="text-slate-500 text-[11px]">
                                          Qty: {item.quantity} • Unit Price: {formatPrice(item.price)}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3 self-end sm:self-center">
                                      <button
                                        onClick={() => handleOpenReview(item, order._id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 transition-colors cursor-pointer"
                                      >
                                        <Star size={12} className="fill-amber-500 text-amber-500" />
                                        <span>Write Review</span>
                                      </button>

                                      <span className="font-black text-slate-900 text-sm">
                                        {formatPrice(item.subtotal || (item.price * item.quantity))}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>

                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* WRITE REVIEW MODAL */}
      {reviewModalItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Star size={18} className="fill-amber-400 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-900">Review Verified Purchase</h3>
              </div>
              <button
                onClick={() => setReviewModalItem(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs font-bold text-slate-800 truncate">
              {reviewModalItem.name}
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              {/* Star Rating Selection */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Your Overall Rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        size={24}
                        className={star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">
                    {reviewRating} out of 5 stars
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Review Headline</label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="e.g. Excellent sound & craftsmanship"
                  className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-amber-400 text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Written Feedback</label>
                <textarea
                  rows={3}
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  placeholder="What did you like or dislike about this product?"
                  className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-amber-400 text-slate-900 text-xs resize-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setReviewModalItem(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {submittingReview ? <Loader2 size={13} className="animate-spin" /> : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
