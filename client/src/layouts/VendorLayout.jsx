import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Package, 
  PlusCircle, 
  ShoppingBag, 
  Settings, 
  ArrowLeft, 
  Menu, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Bell, 
  ShieldCheck, 
  LogOut,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../store/useStore';
import api from '../api/axios';

export default function VendorLayout() {
  const { user, logout, switchActiveRole } = useAuth();
  const { showToast } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [vendorProfile, setVendorProfile] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchVendorData = async () => {
      try {
        const res = await api.get('/vendor/profile');
        if (isMounted && res.data?.success) {
          setVendorProfile(res.data.data?.profile || res.data.data);
        }
      } catch (err) {
        console.warn('Could not fetch vendor profile for layout:', err.message);
      }
    };
    fetchVendorData();
    return () => { isMounted = false; };
  }, [location.pathname]);

  const navItems = [
    { name: 'Overview', path: '/vendor/dashboard', icon: LayoutDashboard },
    { name: 'Product Inventory', path: '/vendor/products', icon: Package },
    { name: 'Add New Product', path: '/vendor/products/new', icon: PlusCircle },
    { name: 'Orders', path: '/vendor/orders', icon: ShoppingBag, badge: 'Live' },
    { name: 'Store Settings', path: '/vendor/settings', icon: Settings },
  ];

  const handleSwitchToStorefront = () => {
    switchActiveRole('customer');
    showToast?.('Returned to Customer Storefront', 'info');
    navigate('/');
  };

  const handleLogout = async () => {
    await logout();
    showToast?.('Signed out of Merchant Portal', 'info');
    navigate('/login');
  };

  const storeName = vendorProfile?.storeName || user?.storeName || 'TechNova Audio';
  const storeLogo = vendorProfile?.logo || user?.avatar || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=120&h=120&fit=crop&q=80';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-x-hidden font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Collapsible Dark-Slate Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-slate-800/80 bg-slate-900/95 transition-all duration-200 relative z-30 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
          <Link to="/" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs flex-shrink-0">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
                <path d="M2 7h20" />
              </svg>
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-white">
                  MarketNest
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 -mt-0.5">
                  Merchant OS
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        </div>

        {/* Store Identifier Mini Card */}
        <div className={`p-3.5 border-b border-slate-800/70 ${sidebarCollapsed ? 'text-center' : ''}`}>
          <div className="flex items-center gap-3">
            <img
              src={storeLogo}
              alt={storeName}
              className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700 flex-shrink-0"
              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=120&h=120&fit=crop&q=80'; }}
            />
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{storeName}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Verified Merchant</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isOrders = item.path === '/vendor/orders';
            const isActive = location.pathname === item.path || (item.path !== '/vendor/dashboard' && !isOrders && location.pathname.startsWith(item.path));

            if (isOrders) {
              return (
                <button
                  key={item.path}
                  onClick={() => showToast?.('Order management & split tracking active (Step 5/6 pipeline)', 'info')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors ${
                    sidebarCollapsed ? 'justify-center' : ''
                  }`}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <div className="flex items-center justify-between w-full">
                      <span>{item.name}</span>
                      <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                        {item.badge}
                      </span>
                    </div>
                  )}
                </button>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive: navActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    navActive || isActive
                      ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`
                }
                title={sidebarCollapsed ? item.name : undefined}
              >
                <Icon size={16} className="flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-800/80 space-y-1">
          <button
            onClick={handleSwitchToStorefront}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
            title="Switch to Storefront"
          >
            <ArrowLeft size={14} className="text-slate-400 flex-shrink-0" />
            {!sidebarCollapsed && <span>← Switch to Storefront</span>}
          </button>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 transition-colors cursor-pointer ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
            title="Sign out of Merchant OS"
          >
            <LogOut size={14} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
            />
            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 25, stiffness: 240 }}
              className="fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 z-50 p-4 flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-bold text-white text-sm">MarketNest Merchant</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="py-3 space-y-1 flex-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${
                          isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`
                      }
                    >
                      <Icon size={16} />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-1">
                <button
                  onClick={handleSwitchToStorefront}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  <ArrowLeft size={14} />
                  ← Switch to Storefront
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/20"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {/* Top Bar */}
        <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              <Menu size={16} />
            </button>
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-semibold text-white tracking-tight">{storeName}</span>
              {/* 'Verified Merchant' green dot pill */}
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Verified Merchant</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Action Button (+ New Product) */}
            <Link
              to="/vendor/products/new"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle size={14} />
              <span>+ New Product</span>
            </Link>

            {/* Notification Bell */}
            <button
              onClick={() => showToast?.('Webhook and inventory event listeners connected', 'info')}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
              title="Notifications"
            >
              <Bell size={15} />
            </button>

            {/* Profile Avatar */}
            <img
              src={storeLogo}
              alt={storeName}
              className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-700"
            />
          </div>
        </header>

        {/* Main View Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
