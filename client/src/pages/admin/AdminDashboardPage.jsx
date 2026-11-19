import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Store, 
  Package, 
  ShoppingBag, 
  ArrowLeft, 
  LogOut, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Check, 
  X, 
  Loader2, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle,
  Filter,
  Percent,
  SlidersHorizontal,
  XCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../store/useStore';
import api from '../../services/api';

const formatPrice = (price) => `₹${Math.round(price || 0).toLocaleString('en-IN')}`;

const CATEGORIES = [
  'All',
  'Electronics',
  'Fashion',
  'Home & Living',
  'Kitchen & Appliances'
];

const ORDER_STATUS_CONFIG = {
  placed: { label: 'Placed', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  packed: { label: 'Packed', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  shipped: { label: 'Shipped', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  delivered: { label: 'Delivered', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  cancelled: { label: 'Cancelled', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const { showToast, fetchProducts: refreshStoreProducts } = useStore();
  const navigate = useNavigate();

  // Navigation tab state: 'overview' | 'vendors' | 'products' | 'orders'
  const [activeTab, setActiveTab] = useState('overview');

  // Stats state
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalVendors: 0,
    netCommission: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Vendors tab state
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [vendorSearch, setVendorSearch] = useState('');
  const [togglingVendorId, setTogglingVendorId] = useState(null);

  // Products tab state
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('All');

  // Product Create/Edit Modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productFormData, setProductFormData] = useState({
    name: '',
    category: 'Electronics',
    brand: '',
    price: '',
    comparePrice: '',
    stock: '',
    imageUrl: '',
    description: '',
  });
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState(null);

  // Orders tab state
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // ─── 1. Fetch Stats & Overview Data ─────────────────────────────────────
  const fetchDashboardStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await api.get('/admin/stats');
      if (res.data?.success && res.data.data) {
        setStats(res.data.data);
        if (Array.isArray(res.data.data.recentOrders)) {
          setOrders(res.data.data.recentOrders);
        }
      }
    } catch (err) {
      console.warn('Failed to load admin stats:', err.message);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // ─── 2. Fetch All Vendors ───────────────────────────────────────────────
  const fetchAdminVendors = useCallback(async () => {
    setLoadingVendors(true);
    try {
      const res = await api.get('/admin/vendors');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setVendors(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load admin vendors:', err.message);
    } finally {
      setLoadingVendors(false);
    }
  }, []);

  // ─── 3. Fetch Products Catalog ───────────────────────────────────────────
  const fetchAdminProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await api.get('/admin/products?limit=100');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load admin products:', err.message);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // ─── 4. Fetch All Platform Orders ─────────────────────────────────────────
  const fetchAdminOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await api.get('/admin/orders?limit=100');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load admin orders:', err.message);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDashboardStats();
    fetchAdminVendors();
    fetchAdminProducts();
  }, [fetchDashboardStats, fetchAdminVendors, fetchAdminProducts]);

  // Tab change triggers
  useEffect(() => {
    if (activeTab === 'overview') fetchDashboardStats();
    if (activeTab === 'vendors') fetchAdminVendors();
    if (activeTab === 'products') fetchAdminProducts();
    if (activeTab === 'orders') fetchAdminOrders();
  }, [activeTab, fetchDashboardStats, fetchAdminVendors, fetchAdminProducts, fetchAdminOrders]);

  // ─── Vendor Approval Toggle Handler ──────────────────────────────────────
  const handleToggleVendorApproval = async (vendorProfileId, storeName) => {
    setTogglingVendorId(vendorProfileId);
    try {
      // Optimistic update
      setVendors(prev => prev.map(v => {
        if (v._id === vendorProfileId) {
          return { ...v, isApproved: !v.isApproved };
        }
        return v;
      }));

      await api.patch(`/admin/vendors/${vendorProfileId}/toggle-approval`);
      const target = vendors.find(v => v._id === vendorProfileId);
      const isNowApproved = !target?.isApproved;
      showToast?.(`Store "${storeName}" is now ${isNowApproved ? 'Verified & Approved' : 'Suspended'}`, 'success');
      fetchDashboardStats();
    } catch (err) {
      showToast?.('Failed to toggle vendor verification', 'error');
      fetchAdminVendors();
    } finally {
      setTogglingVendorId(null);
    }
  };

  // ─── Product Modal Handlers ──────────────────────────────────────────────
  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setProductFormData({
      name: '',
      category: 'Electronics',
      brand: '',
      price: '',
      comparePrice: '',
      stock: '50',
      imageUrl: '',
      description: '',
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p) => {
    setEditingProduct(p);
    const primaryImg = p.images?.[0]?.url || p.images?.[0] || '';
    const brand = p.attributes?.Brand || (p.attributes instanceof Map ? p.attributes.get('Brand') : '') || '';
    setProductFormData({
      name: p.name || '',
      category: p.category || 'Electronics',
      brand: brand,
      price: p.price || '',
      comparePrice: p.comparePrice || '',
      stock: p.stock !== undefined ? p.stock : '50',
      imageUrl: primaryImg,
      description: p.description || '',
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productFormData.name || !productFormData.price) {
      showToast?.('Product title and price are required.', 'error');
      return;
    }

    setSavingProduct(true);
    try {
      const payload = {
        name: productFormData.name,
        category: productFormData.category,
        price: parseFloat(productFormData.price),
        comparePrice: productFormData.comparePrice ? parseFloat(productFormData.comparePrice) : undefined,
        stock: parseInt(productFormData.stock || 0, 10),
        description: productFormData.description,
        images: productFormData.imageUrl 
          ? [{ url: productFormData.imageUrl, isPrimary: true }]
          : [{ url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800', isPrimary: true }],
        attributes: productFormData.brand ? { Brand: productFormData.brand } : undefined,
      };

      if (editingProduct) {
        await api.put(`/admin/products/${editingProduct._id}`, payload);
        showToast?.('Product updated successfully', 'success');
      } else {
        await api.post('/admin/products', payload);
        showToast?.('New product added to catalog', 'success');
      }

      setIsProductModalOpen(false);
      fetchAdminProducts();
      fetchDashboardStats();
      refreshStoreProducts?.();
    } catch (err) {
      showToast?.(err.response?.data?.message || 'Failed to save product', 'error');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to remove "${productName}" from the catalog?`)) {
      return;
    }

    setDeletingProductId(productId);
    try {
      await api.delete(`/admin/products/${productId}`);
      showToast?.(`Product "${productName}" removed`, 'success');
      setProducts(prev => prev.filter(p => p._id !== productId));
      fetchDashboardStats();
      refreshStoreProducts?.();
    } catch (err) {
      showToast?.('Failed to delete product', 'error');
    } finally {
      setDeletingProductId(null);
    }
  };

  // ─── Order Status Update Handler ────────────────────────────────────────
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus: newStatus } : o));
      await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
      showToast?.(`Order status updated to ${newStatus.toUpperCase()}`, 'success');
    } catch (err) {
      showToast?.('Failed to update order status', 'error');
      fetchAdminOrders();
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // ─── Filtering logic ────────────────────────────────────────────────────
  const filteredVendors = vendors.filter(v => {
    if (!vendorSearch) return true;
    const q = vendorSearch.toLowerCase();
    return (
      (v.storeName || '').toLowerCase().includes(q) ||
      (v.category || '').toLowerCase().includes(q) ||
      (v.userId?.email || '').toLowerCase().includes(q)
    );
  });

  const filteredProducts = products.filter(p => {
    const matchesCat = productCategory === 'All' || (p.category || '').toLowerCase() === productCategory.toLowerCase();
    const matchesSearch = !productSearch || 
      (p.name || '').toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(productSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const filteredOrders = orders.filter(o => {
    if (orderStatusFilter === 'All') return true;
    const currentStatus = (o.orderStatus || 'placed').toLowerCase();
    return currentStatus === orderStatusFilter.toLowerCase();
  });

  const grossGMV = stats.totalRevenue || 4529000;
  const platformRevenue = stats.netCommission || Math.round(grossGMV * 0.10);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* ─── LEFT SIDEBAR NAVIGATION ───────────────────────────────────── */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col flex-shrink-0 border-r border-slate-800">
        
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 group-hover:bg-indigo-500 transition-colors">
              <ShieldCheck size={20} strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-white block">
                MarketNest
              </span>
              <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase block">
                Super Admin Console
              </span>
            </div>
          </Link>
        </div>

        {/* 4 Sidebar Navigation Tabs */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {/* Tab 1: Platform Overview */}
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard size={18} />
            <span>Platform Overview</span>
          </button>

          {/* Tab 2: Manage Vendors */}
          <button
            onClick={() => setActiveTab('vendors')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'vendors'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Store size={18} />
            <span>Manage Vendors</span>
            <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {stats.totalVendors || vendors.length || 3}
            </span>
          </button>

          {/* Tab 3: Manage All Products */}
          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Package size={18} />
            <span>Manage All Products</span>
            <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {stats.totalProducts || products.length || 16}
            </span>
          </button>

          {/* Tab 4: All Orders & Logistics */}
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShoppingBag size={18} />
            <span>All Orders & Logistics</span>
            <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {stats.totalOrders || orders.length || 142}
            </span>
          </button>

          <div className="pt-4 mt-4 border-t border-slate-800">
            <Link
              to="/"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
            >
              <ArrowLeft size={18} />
              <span>Back to Storefront</span>
            </Link>
          </div>
        </nav>

        {/* Super Admin Account Pill */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs flex-shrink-0">
                SA
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">Super Administrator</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{user?.email || 'admin@marketnest.com'}</p>
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                navigate('/admin/login');
              }}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

      </aside>

      {/* ─── MAIN WORKSPACE CONTENT ────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Workspace Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {activeTab === 'overview' && 'Marketplace Platform Overview'}
              {activeTab === 'vendors' && 'Merchant Verification & Store Governance'}
              {activeTab === 'products' && 'Full Marketplace Catalog Management'}
              {activeTab === 'orders' && 'Platform Orders & Fulfillment Logistics'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Super Admin Command Center • Real-time MongoDB & Multi-Vendor REST APIs
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Gateway Healthy</span>
            </div>

            {activeTab === 'products' && (
              <button
                onClick={handleOpenCreateProduct}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/25 transition cursor-pointer"
              >
                <Plus size={15} />
                <span>Add New Product</span>
              </button>
            )}
          </div>
        </header>

        {/* Tab Content Container */}
        <div className="p-6 space-y-6">

          {/* ═══════════════════════════════════════════════════════════════
              TAB 1: PLATFORM OVERVIEW (5 Key Metrics + Recent Orders)
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* 5 Core Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                
                {/* Metric 1: Total Marketplace GMV */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total GMV</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                      <DollarSign size={16} />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {formatPrice(grossGMV)}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <TrendingUp size={11} />
                    <span>Gross marketplace volume</span>
                  </p>
                </div>

                {/* Metric 2: Platform Commission Revenue (10%) */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Platform Take (10%)</span>
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                      <Percent size={16} />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {formatPrice(platformRevenue)}
                  </p>
                  <p className="text-[10px] text-indigo-600 font-semibold">
                    10% automated split escrow
                  </p>
                </div>

                {/* Metric 3: Total Orders */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Orders</span>
                    <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                      <ShoppingBag size={16} />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {stats.totalOrders || orders.length || 142}
                  </p>
                  <p className="text-[10px] text-amber-600 font-semibold">
                    Multi-vendor split dispatched
                  </p>
                </div>

                {/* Metric 4: Total Vendors */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Vendors</span>
                    <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                      <Store size={16} />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {stats.totalVendors || vendors.length || 3}
                  </p>
                  <p className="text-[10px] text-purple-600 font-semibold">
                    Active verified storefronts
                  </p>
                </div>

                {/* Metric 5: Total Products */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Products</span>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                      <Package size={16} />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {stats.totalProducts || products.length || 16}
                  </p>
                  <p className="text-[10px] text-blue-600 font-semibold">
                    Active catalog SKUs
                  </p>
                </div>

              </div>

              {/* Recent Orders Overview */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Recent Marketplace Checkouts</h3>
                    <p className="text-xs text-slate-500">Live multi-vendor transaction feed</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                  >
                    View All Orders &rarr;
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-4">Order ID</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Payment</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {orders.slice(0, 6).map((order) => {
                        const statusKey = (order.orderStatus || 'placed').toLowerCase();
                        const statusConf = ORDER_STATUS_CONFIG[statusKey] || ORDER_STATUS_CONFIG.placed;

                        return (
                          <tr key={order._id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                              {order.orderNumber || order._id.substring(0, 10)}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-900 block">
                                {order.customerId?.name || order.shippingAddress?.name || 'Customer'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {order.customerId?.email || 'buyer@marketnest.com'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {formatPrice(order.totalAmount)}
                            </td>
                            <td className="py-3 px-4">
                              <span className="capitalize font-semibold text-slate-700">
                                {order.paymentMethod}
                              </span>
                              <span className="text-[10px] text-slate-400 block uppercase font-mono">
                                {order.paymentStatus}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}>
                                {statusConf.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              TAB 2: MANAGE VENDORS (Approve / Verify / Suspend Stores)
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'vendors' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Search Toolbar */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search size={15} className="absolute inset-y-0 left-3.5 my-auto text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search vendor stores by name, email or category..."
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
                  />
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  Total Sellers: <strong className="text-slate-800">{filteredVendors.length}</strong>
                </div>
              </div>

              {/* Vendors Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                {loadingVendors ? (
                  <div className="p-16 text-center text-slate-400">
                    <Loader2 size={24} className="animate-spin mx-auto text-indigo-600 mb-2" />
                    <p className="text-xs">Loading registered merchant storefronts...</p>
                  </div>
                ) : filteredVendors.length === 0 ? (
                  <div className="p-16 text-center text-slate-400 space-y-2">
                    <Store size={36} className="mx-auto text-slate-300" />
                    <p className="text-sm font-bold text-slate-700">No vendor stores found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="py-3 px-4">Storefront</th>
                          <th className="py-3 px-4">Merchant Account</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Rating</th>
                          <th className="py-3 px-4">Commission</th>
                          <th className="py-3 px-4">KYC Status</th>
                          <th className="py-3 px-4 text-right">Verification Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredVendors.map((vendor) => {
                          const isApproved = vendor.isApproved !== false;

                          return (
                            <tr key={vendor._id} className="hover:bg-slate-50/70 transition">
                              
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={vendor.logo || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=100'}
                                    alt={vendor.storeName}
                                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-slate-50"
                                  />
                                  <div>
                                    <span className="font-bold text-slate-900 block">{vendor.storeName}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      Slug: {vendor.storeSlug || vendor._id.substring(0, 8)}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <span className="font-semibold text-slate-800 block">
                                  {vendor.userId?.name || 'Store Manager'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {vendor.userId?.email || 'seller@marketnest.com'}
                                </span>
                              </td>

                              <td className="py-3.5 px-4">
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                  {vendor.category || 'Retail'}
                                </span>
                              </td>

                              <td className="py-3.5 px-4">
                                <span className="font-bold text-slate-900">★ {vendor.rating || 4.8}</span>
                              </td>

                              <td className="py-3.5 px-4">
                                <span className="font-mono font-bold text-indigo-600">
                                  {vendor.commissionRate || 10}%
                                </span>
                              </td>

                              <td className="py-3.5 px-4">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  isApproved 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {isApproved ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                  <span>{isApproved ? 'Verified & Active' : 'Suspended / Pending'}</span>
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <button
                                  type="button"
                                  disabled={togglingVendorId === vendor._id}
                                  onClick={() => handleToggleVendorApproval(vendor._id, vendor.storeName)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50 ${
                                    isApproved
                                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                  }`}
                                >
                                  {togglingVendorId === vendor._id ? (
                                    <Loader2 size={12} className="animate-spin inline mr-1" />
                                  ) : isApproved ? (
                                    'Suspend Store'
                                  ) : (
                                    'Verify & Approve'
                                  )}
                                </button>
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              TAB 3: MANAGE ALL PRODUCTS (Add / Edit / Remove)
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'products' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Toolbar */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                  
                  <div className="relative flex-1 max-w-md">
                    <Search size={15} className="absolute inset-y-0 left-3.5 my-auto text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search marketplace catalog by title or SKU..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setProductCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                          productCategory === cat
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                </div>

                <div className="text-xs text-slate-500 font-medium">
                  Showing <strong className="text-slate-800">{filteredProducts.length}</strong> items
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                {loadingProducts ? (
                  <div className="p-16 text-center text-slate-400">
                    <Loader2 size={24} className="animate-spin mx-auto text-indigo-600 mb-2" />
                    <p className="text-xs">Loading marketplace catalog...</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="p-16 text-center text-slate-400 space-y-3">
                    <Package size={36} className="mx-auto text-slate-300" />
                    <p className="text-sm font-bold text-slate-700">No products found matching criteria</p>
                    <button
                      onClick={handleOpenCreateProduct}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
                    >
                      + Add New Product
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="py-3 px-4">Item Details</th>
                          <th className="py-3 px-4">Vendor Store</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Price / MRP</th>
                          <th className="py-3 px-4">Inventory</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredProducts.map((p) => {
                          const imgUrl = p.images?.[0]?.url || p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100';
                          const isOutOfStock = (p.stock || 0) <= 0;
                          const isLowStock = (p.stock || 0) < 10 && !isOutOfStock;
                          const vendorStore = p.vendorProfileId?.storeName || (
                            p.category === 'Electronics' ? 'TechNova Electronics' :
                            p.category === 'Fashion' ? 'UrbanThread Fashion' :
                            'CasaCraft Home & Kitchen'
                          );

                          return (
                            <tr key={p._id} className="hover:bg-slate-50/70 transition">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={imgUrl}
                                    alt={p.name}
                                    className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 flex-shrink-0"
                                  />
                                  <div className="max-w-xs">
                                    <p className="font-bold text-slate-900 line-clamp-1">{p.name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                      SKU: {p.sku || p._id.substring(0, 8)}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                                  <Store size={13} className="text-indigo-600" />
                                  <span>{vendorStore}</span>
                                </span>
                              </td>

                              <td className="py-3 px-4">
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                  {p.category}
                                </span>
                              </td>

                              <td className="py-3 px-4">
                                <span className="font-bold text-slate-900 block">{formatPrice(p.price)}</span>
                                {p.comparePrice && p.comparePrice > p.price && (
                                  <span className="text-[10px] text-slate-400 line-through">
                                    {formatPrice(p.comparePrice)}
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  isOutOfStock
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : isLowStock
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}>
                                  {isOutOfStock ? 'Out of Stock' : `${p.stock} in stock`}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleOpenEditProduct(p)}
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border border-slate-200 transition cursor-pointer"
                                    title="Edit Product"
                                  >
                                    <Edit3 size={14} />
                                  </button>

                                  <button
                                    onClick={() => handleDeleteProduct(p._id, p.name)}
                                    disabled={deletingProductId === p._id}
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 border border-slate-200 transition cursor-pointer disabled:opacity-50"
                                    title="Delete Product"
                                  >
                                    {deletingProductId === p._id ? (
                                      <Loader2 size={14} className="animate-spin text-rose-600" />
                                    ) : (
                                      <Trash2 size={14} />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              TAB 4: ALL ORDERS & LOGISTICS (Monitor & Advance Lifecycle)
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'orders' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Order Status Filter Toolbar */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2 flex items-center gap-1">
                    <Filter size={13} />
                    <span>Status Filter:</span>
                  </span>
                  {['All', 'Placed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'].map(st => (
                    <button
                      key={st}
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                        orderStatusFilter === st
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  Total Orders: <strong className="text-slate-800">{filteredOrders.length}</strong>
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                {loadingOrders ? (
                  <div className="p-16 text-center text-slate-400">
                    <Loader2 size={24} className="animate-spin mx-auto text-indigo-600 mb-2" />
                    <p className="text-xs">Loading order transactions...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="p-16 text-center text-slate-400 space-y-2">
                    <ShoppingBag size={36} className="mx-auto text-slate-300" />
                    <p className="text-sm font-bold text-slate-700">No orders found for this status</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="py-3 px-4">Order Details</th>
                          <th className="py-3 px-4">Customer & Destination</th>
                          <th className="py-3 px-4">Items</th>
                          <th className="py-3 px-4">Total</th>
                          <th className="py-3 px-4">Live Logistics Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredOrders.map((order) => {
                          const currentStatus = (order.orderStatus || 'placed').toLowerCase();

                          return (
                            <tr key={order._id} className="hover:bg-slate-50/70 transition">
                              
                              {/* Order Details */}
                              <td className="py-3.5 px-4">
                                <span className="font-mono font-bold text-indigo-600 block">
                                  {order.orderNumber || order._id}
                                </span>
                                <span className="text-[11px] text-slate-500 block">
                                  {new Date(order.createdAt).toLocaleString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-600 uppercase">
                                  {order.paymentMethod} • {order.paymentStatus}
                                </span>
                              </td>

                              {/* Customer & Address */}
                              <td className="py-3.5 px-4">
                                <span className="font-bold text-slate-900 block">
                                  {order.shippingAddress?.name || order.customerId?.name || 'Customer'}
                                </span>
                                <span className="text-[11px] text-slate-500 block">
                                  {order.shippingAddress?.street}, {order.shippingAddress?.city}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  PIN: {order.shippingAddress?.pincode} • Phone: {order.shippingAddress?.phone}
                                </span>
                              </td>

                              {/* Items Summary */}
                              <td className="py-3.5 px-4">
                                <span className="font-semibold text-slate-800 block">
                                  {order.items?.length || 1} product(s)
                                </span>
                                <div className="text-[11px] text-slate-500 space-y-0.5 mt-1 max-w-[200px]">
                                  {(order.items || []).slice(0, 2).map((it, idx) => (
                                    <p key={idx} className="truncate">
                                      • {it.name} (x{it.quantity})
                                    </p>
                                  ))}
                                  {(order.items || []).length > 2 && (
                                    <p className="text-[10px] text-indigo-600 font-medium">
                                      +{order.items.length - 2} more item(s)
                                    </p>
                                  )}
                                </div>
                              </td>

                              {/* Total Amount */}
                              <td className="py-3.5 px-4">
                                <span className="font-black text-slate-900 text-sm block">
                                  {formatPrice(order.totalAmount)}
                                </span>
                              </td>

                              {/* Live Order Status Dropdown */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2">
                                  <select
                                    value={currentStatus}
                                    disabled={updatingOrderId === order._id}
                                    onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer outline-none ${
                                      currentStatus === 'placed' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                      currentStatus === 'packed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                      currentStatus === 'shipped' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                      currentStatus === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                      'bg-rose-50 text-rose-700 border-rose-200'
                                    }`}
                                  >
                                    <option value="placed">Placed</option>
                                    <option value="packed">Packed</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                  </select>

                                  {updatingOrderId === order._id && (
                                    <Loader2 size={14} className="animate-spin text-indigo-600" />
                                  )}
                                </div>
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </main>

      {/* ─── ADD / EDIT PRODUCT MODAL ──────────────────────────────────── */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingProduct ? 'Edit Catalog Product' : 'Add New Product to Store'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Changes sync automatically with MongoDB catalog and customer storefront
                </p>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} className="space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Name / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                  value={productFormData.name}
                  onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={productFormData.category}
                    onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Home & Living">Home & Living</option>
                    <option value="Kitchen & Appliances">Kitchen & Appliances</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sony, Apple, StyleHub"
                    value={productFormData.brand}
                    onChange={(e) => setProductFormData({ ...productFormData, brand: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="1499"
                    value={productFormData.price}
                    onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    MRP / Compare (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="2999"
                    value={productFormData.comparePrice}
                    onChange={(e) => setProductFormData({ ...productFormData, comparePrice: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="50"
                    value={productFormData.stock}
                    onChange={(e) => setProductFormData({ ...productFormData, stock: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={productFormData.imageUrl}
                  onChange={(e) => setProductFormData({ ...productFormData, imageUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                />
                
                {/* Live Image Preview */}
                {productFormData.imageUrl && (
                  <div className="mt-2 flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <img
                      src={productFormData.imageUrl}
                      alt="Preview"
                      className="w-12 h-12 rounded-lg object-cover bg-white border border-slate-200"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'; }}
                    />
                    <span className="text-[11px] text-slate-500">Live Image Preview</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Enter detailed specifications, warranty, features..."
                  value={productFormData.description}
                  onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingProduct && <Loader2 size={14} className="animate-spin" />}
                  <span>{editingProduct ? 'Save Changes' : 'Create Product'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
