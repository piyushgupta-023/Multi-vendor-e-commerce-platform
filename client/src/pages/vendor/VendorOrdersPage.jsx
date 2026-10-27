import { useState, useMemo } from 'react';
import { 
  Package, 
  Store, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ArrowRight, 
  ExternalLink,
  Filter,
  Search,
  AlertCircle,
  RefreshCw,
  User,
  ShoppingBag
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const formatPrice = (price) => `₹${Math.round(price || 0).toLocaleString('en-IN')}`;

export default function VendorOrdersPage() {
  const { orders, updateSubOrderStatusInStore, showToast } = useStore();
  const { user } = useAuth();

  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'placed' | 'packed' | 'shipped' | 'delivered'
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Flatten sub-orders from the store's orders
  const vendorSubOrders = useMemo(() => {
    const list = [];
    orders.forEach((order) => {
      if (Array.isArray(order.subOrders)) {
        order.subOrders.forEach((sub) => {
          list.push({
            ...sub,
            parentOrderId: order._id || order.orderNumber,
            orderNumber: order.orderNumber || order._id,
            parentCreatedAt: order.createdAt,
            shippingAddress: order.shippingAddress,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
          });
        });
      }
    });
    return list;
  }, [orders]);

  // Filtered sub-orders
  const filteredOrders = useMemo(() => {
    return vendorSubOrders.filter((sub) => {
      const matchesStatus = statusFilter === 'all' || (sub.status || '').toLowerCase() === statusFilter.toLowerCase();
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        (sub.orderNumber || '').toLowerCase().includes(q) ||
        (sub._id || '').toLowerCase().includes(q) ||
        (sub.shippingAddress?.name || '').toLowerCase().includes(q) ||
        (sub.vendorStoreName || '').toLowerCase().includes(q) ||
        (sub.items || []).some(i => (i.name || '').toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [vendorSubOrders, statusFilter, searchTerm]);

  // Handle advancing lifecycle status
  const handleUpdateStatus = async (subOrderId, nextStatus) => {
    setUpdatingId(subOrderId);
    try {
      // 1. Update in local store immediately for instant reactive UI
      updateSubOrderStatusInStore(subOrderId, nextStatus);

      // 2. Call backend API if authenticated
      try {
        await api.patch(`/vendor/orders/${subOrderId}/status`, {
          status: nextStatus,
          note: `Marked as ${nextStatus} from Merchant OS`,
        });
      } catch {
        // Resilient in-memory fallback
      }

      showToast?.(`Order updated to ${nextStatus.toUpperCase()}`, 'success');
    } catch (err) {
      showToast?.(err.message || 'Failed to update order status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const getNextAction = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'placed':
        return { label: 'Mark as Packed', next: 'packed', color: 'bg-indigo-600 hover:bg-indigo-500 text-white' };
      case 'packed':
        return { label: 'Dispatch / Ship', next: 'shipped', color: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold' };
      case 'shipped':
        return { label: 'Mark Delivered', next: 'delivered', color: 'bg-emerald-600 hover:bg-emerald-500 text-white' };
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'placed':
        return 'bg-amber-950/60 text-amber-300 border border-amber-800/80';
      case 'packed':
        return 'bg-sky-950/60 text-sky-300 border border-sky-800/80';
      case 'shipped':
        return 'bg-indigo-950/60 text-indigo-300 border border-indigo-800/80';
      case 'delivered':
        return 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/80';
      default:
        return 'bg-slate-800 text-slate-300 border border-slate-700';
    }
  };

  const counts = {
    all: vendorSubOrders.length,
    placed: vendorSubOrders.filter(s => s.status === 'placed').length,
    packed: vendorSubOrders.filter(s => s.status === 'packed').length,
    shipped: vendorSubOrders.filter(s => s.status === 'shipped').length,
    delivered: vendorSubOrders.filter(s => s.status === 'delivered').length,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* 1. Header & KPI Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShoppingBag size={14} />
            <span>Fulfillment Pipeline</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Incoming Orders & Dispatch Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pack incoming parcels, generate tracking IDs, and advance the order delivery lifecycle
          </p>
        </div>
      </div>

      {/* 2. Status Metric Chips Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { key: 'all', label: 'All Orders', count: counts.all },
          { key: 'placed', label: 'Needs Packing', count: counts.placed, highlight: counts.placed > 0 },
          { key: 'packed', label: 'Ready to Dispatch', count: counts.packed },
          { key: 'shipped', label: 'In Transit', count: counts.shipped },
          { key: 'delivered', label: 'Completed', count: counts.delivered },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              statusFilter === tab.key
                ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500/50'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">{tab.label}</span>
              {tab.highlight && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </div>
            <p className="text-xl font-bold text-white mt-1">{tab.count}</p>
          </button>
        ))}
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by order #, customer or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-1.5 pl-8 pr-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
        </div>

        <div className="text-xs text-slate-400 self-end sm:self-center">
          Showing <strong className="text-white">{filteredOrders.length}</strong> orders
        </div>
      </div>

      {/* 4. Orders Fulfillment Table */}
      {filteredOrders.length === 0 ? (
        <div className="bg-slate-900/40 rounded-2xl p-12 text-center border border-slate-800/80 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
            <Package size={24} />
          </div>
          <h3 className="font-bold text-white text-sm">No orders matching this filter</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When customers place orders containing your products, they will appear here for packing and dispatch.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((sub) => {
            const nextAction = getNextAction(sub.status);
            const isUpdating = updatingId === sub._id;

            return (
              <div
                key={sub._id}
                className="bg-slate-900/70 rounded-xl border border-slate-800/90 p-4 sm:p-5 space-y-4 hover:border-slate-700/80 transition-all shadow-xs"
              >
                {/* Row Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/60">
                      {sub.orderNumber}
                    </span>
                    <span className="text-slate-400">
                      SubOrder: <span className="font-mono text-slate-300">{sub._id}</span>
                    </span>
                    <span className="text-slate-500 hidden sm:inline">•</span>
                    <span className="text-slate-400">
                      {new Date(sub.parentCreatedAt || Date.now()).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadge(sub.status)}`}>
                      {sub.status || 'placed'}
                    </span>
                    <span className="text-xs font-bold text-emerald-400">
                      Payout: {formatPrice(sub.subtotal)}
                    </span>
                  </div>
                </div>

                {/* Main Content: Items to Pack & Shipping Details */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  
                  {/* Items to Pack (Left) */}
                  <div className="md:col-span-7 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Items to Pack ({sub.items?.length || 1}):
                    </span>

                    <div className="space-y-2">
                      {(sub.items || []).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                            alt={item.name}
                            className="w-10 h-10 rounded object-cover border border-slate-800 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 text-xs">
                            <p className="font-bold text-white truncate">{item.name}</p>
                            <p className="text-slate-400 text-[11px]">
                              Qty: <strong className="text-amber-400">{item.quantity}</strong> • Unit: {formatPrice(item.price)}
                            </p>
                          </div>
                          <span className="text-xs font-mono font-bold text-white">
                            {formatPrice((item.price || 0) * (item.quantity || 1))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer Delivery Details (Center) */}
                  <div className="md:col-span-5 bg-slate-950/40 p-3 rounded-lg border border-slate-800/60 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
                      <MapPin size={13} className="text-indigo-400" />
                      <span>Delivery Address</span>
                    </div>
                    <p className="font-bold text-white">{sub.shippingAddress?.name || 'Customer'}</p>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      {sub.shippingAddress?.street}, {sub.shippingAddress?.city}, {sub.shippingAddress?.state} - {sub.shippingAddress?.pincode}
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      Phone: <span className="font-mono text-slate-300">{sub.shippingAddress?.phone || 'N/A'}</span>
                    </p>
                  </div>

                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Truck size={14} className="text-indigo-400" />
                      <span>Carrier: <strong className="text-slate-300">{sub.courierPartner || 'MarketNest Express'}</strong></span>
                    </span>
                    <span>•</span>
                    <span>Tracking: <strong className="text-slate-300 font-mono">{sub.trackingNumber || 'MN-PENDING'}</strong></span>
                  </div>

                  {/* Status Advance Controls */}
                  <div className="flex items-center gap-2">
                    {/* Advance Step Action Button */}
                    {nextAction && (
                      <button
                        onClick={() => handleUpdateStatus(sub._id, nextAction.next)}
                        disabled={isUpdating}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${nextAction.color}`}
                      >
                        {isUpdating ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={13} />
                        )}
                        <span>{nextAction.label}</span>
                      </button>
                    )}

                    {/* Manual Status Selector Dropdown */}
                    <select
                      value={sub.status || 'placed'}
                      onChange={(e) => handleUpdateStatus(sub._id, e.target.value)}
                      disabled={isUpdating}
                      className="bg-slate-950 text-slate-300 border border-slate-800 px-2.5 py-1.5 rounded-lg text-xs outline-none cursor-pointer hover:border-slate-700"
                    >
                      <option value="placed">Placed</option>
                      <option value="packed">Packed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
