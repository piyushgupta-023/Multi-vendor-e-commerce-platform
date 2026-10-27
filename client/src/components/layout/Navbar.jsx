import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Search, 
  Menu, 
  X, 
  ChevronDown, 
  User, 
  Heart, 
  Store, 
  Shield, 
  LogOut, 
  Package, 
  PlusCircle,
  Settings, 
  Check,
  MapPin,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Tag,
  Zap,
  HelpCircle
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useAuth } from '../../context/AuthContext';

const searchCategories = [
  'All Categories',
  'Electronics',
  'Fashion',
  'Home & Living',
  'Sports & Fitness',
  'Beauty & Personal Care',
  'Food & Gourmet',
];

const roles = [
  { id: 'customer', label: 'Buyer View', desc: 'Browse catalog, cart & orders', icon: User, color: 'text-sky-400' },
  { id: 'vendor', label: 'Merchant Portal', desc: 'Manage products & store', icon: Store, color: 'text-amber-400' },
  { id: 'admin', label: 'Platform Admin', desc: 'Platform supervision & KYC', icon: Shield, color: 'text-purple-400' },
];

export default function Navbar() {
  const { 
    cartCount, 
    cartTotal,
    setCartOpen, 
    selectedCategory, 
    setSelectedCategory, 
    searchQuery, 
    setSearchQuery, 
    wishlist,
    showToast 
  } = useStore();
  const { user, isAuthenticated, activeRole, logout, switchActiveRole, demoLogin } = useAuth();
  const navigate = useNavigate();

  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdown, setRoleDropdown] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [navCategory, setNavCategory] = useState(selectedCategory === 'All' ? 'All Categories' : selectedCategory);

  const searchInputRef = useRef(null);
  const roleMenuRef = useRef(null);
  const userMenuRef = useRef(null);

  // Sync category dropdown with store's selectedCategory
  useEffect(() => {
    if (selectedCategory === 'All') {
      setNavCategory('All Categories');
    } else {
      setNavCategory(selectedCategory);
    }
  }, [selectedCategory]);

  // Keyboard shortcut ⌘K or / to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '/' && document.activeElement !== searchInputRef.current && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target)) {
        setRoleDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentRole = roles.find(r => r.id === (activeRole || user?.role || 'customer')) || roles[0];

  const handleRoleSelect = (roleId) => {
    switchActiveRole(roleId);
    setRoleDropdown(false);
    showToast?.(`Active perspective: ${roleId === 'vendor' ? 'Merchant' : roleId === 'admin' ? 'Admin' : 'Buyer'}`, 'info');
    if (roleId === 'vendor') {
      navigate('/vendor/dashboard');
    } else if (roleId === 'admin') {
      navigate('/admin/dashboard');
    } else if (roleId === 'customer') {
      navigate('/');
    }
  };

  const handleCategorySelect = (cat) => {
    setNavCategory(cat);
    const mapped = cat === 'All Categories' ? 'All' : cat;
    setSelectedCategory(mapped);
    const catalogEl = document.getElementById('catalog-grid');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    const mapped = navCategory === 'All Categories' ? 'All' : navCategory;
    setSelectedCategory(mapped);
    const catalogEl = document.getElementById('catalog-grid');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogout = async () => {
    setUserDropdown(false);
    await logout();
    showToast?.('Signed out successfully.', 'info');
    navigate('/');
  };

  const handleQuickDemoLogin = async (roleType) => {
    try {
      setUserDropdown(false);
      await demoLogin(roleType);
      showToast?.(`Logged in as demo ${roleType}!`, 'success');
      if (roleType === 'vendor') navigate('/vendor/dashboard');
      if (roleType === 'admin') navigate('/admin/dashboard');
    } catch {
      showToast?.('Demo login failed', 'error');
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full font-sans select-none shadow-md">
      {/* 1. PRIMARY AMAZON-STYLE TOP BAR */}
      <div className="bg-[#131921] text-white border-b border-slate-800">
        <div className="max-w-[1536px] mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
            
            {/* Left: Brand Logo & Deliver-To Location */}
            <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
              {/* Brand Logo */}
              <Link
                to="/"
                onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                className="flex items-center gap-2 group py-1 px-1 rounded-sm hover:ring-1 hover:ring-white transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 flex items-center justify-center text-slate-950 font-black shadow-xs group-hover:scale-105 transition-transform">
                  <Store size={18} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-amber-400 transition-colors">
                      MarketNest
                    </span>
                    <span className="text-[10px] font-bold text-amber-400">
                      .direct
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 tracking-wider uppercase -mt-1 hidden sm:block">
                    Multi-Vendor Prime
                  </span>
                </div>
              </Link>

              {/* Deliver To Location Pill */}
              <div 
                className="hidden lg:flex items-center gap-1.5 py-1.5 px-2 rounded-sm hover:ring-1 hover:ring-white cursor-pointer transition-all"
                title="Delivery location"
              >
                <MapPin size={16} className="text-amber-400 flex-shrink-0" />
                <div className="flex flex-col leading-tight">
                  <span className="text-[11px] text-slate-400 font-normal">Deliver to</span>
                  <span className="text-xs font-bold text-white tracking-wide">India 110001</span>
                </div>
              </div>
            </div>

            {/* Center: Comprehensive Search Bar with Category Select & Vibrant Button */}
            <form 
              onSubmit={handleSearchSubmit}
              className="flex-1 max-w-3xl hidden md:flex items-center mx-2"
            >
              <div
                className={`flex w-full rounded-lg overflow-hidden bg-white transition-all duration-150 ${
                  searchFocused
                    ? 'ring-2 ring-amber-400 shadow-lg'
                    : 'hover:ring-1 hover:ring-amber-400/50'
                }`}
              >
                {/* Category Dropdown Selector */}
                <div className="relative flex items-center bg-slate-100 hover:bg-slate-200 border-r border-slate-300 transition-colors">
                  <select
                    value={navCategory}
                    onChange={(e) => handleCategorySelect(e.target.value)}
                    className="appearance-none bg-transparent py-2.5 pl-3 pr-7 text-xs font-semibold text-slate-800 outline-none cursor-pointer"
                  >
                    {searchCategories.map((cat) => (
                      <option key={cat} value={cat} className="bg-white text-slate-900 font-normal">
                        {cat}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-2 text-slate-500 pointer-events-none" />
                </div>

                {/* Main Search Input */}
                <div className="flex-1 relative flex items-center">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search MarketNest, brand products, verified makers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    className="w-full py-2.5 px-3 text-xs text-slate-900 placeholder-slate-400 outline-none"
                  />

                  {/* Clear Query Button */}
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-1 mr-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}

                  {/* Keyboard Shortcut Badge */}
                  {!searchQuery && (
                    <div className="mr-2 hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200">
                      <span>⌘K</span>
                    </div>
                  )}
                </div>

                {/* Vibrant Search Action Button */}
                <button
                  type="submit"
                  className="bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-950 px-4 sm:px-5 flex items-center justify-center transition-colors cursor-pointer"
                  title="Search products"
                >
                  <Search size={18} strokeWidth={2.5} />
                </button>
              </div>
            </form>

            {/* Right: Role Perspective Pill, Account, Orders & Cart */}
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-shrink-0">

              {/* Role Perspective Dropdown */}
              <div className="relative" ref={roleMenuRef}>
                <button
                  onClick={() => setRoleDropdown(!roleDropdown)}
                  className="hidden sm:flex items-center gap-1.5 py-1.5 px-2.5 rounded-sm hover:ring-1 hover:ring-white transition-all text-left cursor-pointer"
                >
                  <currentRole.icon size={15} className={currentRole.color} />
                  <div className="flex flex-col leading-tight">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Perspective</span>
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      {currentRole.label.replace(' View', '').replace(' Platform', '')}
                      <ChevronDown size={11} className={`text-slate-400 transition-transform ${roleDropdown ? 'rotate-180' : ''}`} />
                    </span>
                  </div>
                </button>

                <AnimatePresence>
                  {roleDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-50 text-slate-900"
                    >
                      <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Switch Marketplace Role</p>
                      </div>

                      {roles.map((r) => {
                        const Icon = r.icon;
                        const isSelected = (activeRole || user?.role || 'customer') === r.id;
                        return (
                          <button
                            key={r.id}
                            onClick={() => handleRoleSelect(r.id)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                              isSelected ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-md flex items-center justify-center ${isSelected ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-100 text-slate-600'}`}>
                                <Icon size={14} />
                              </div>
                              <div>
                                <p className="font-bold">{r.label}</p>
                                <p className="text-[10px] text-slate-500">{r.desc}</p>
                              </div>
                            </div>
                            {isSelected && <Check size={14} className="text-amber-600 font-bold" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Account & Lists Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserDropdown(!userDropdown)}
                  className="flex items-center gap-1.5 py-1.5 px-2 rounded-sm hover:ring-1 hover:ring-white transition-all text-left cursor-pointer"
                >
                  <div className="flex flex-col leading-tight">
                    <span className="text-[11px] text-slate-400 font-normal">
                      {isAuthenticated && user ? `Hello, ${user.name.split(' ')[0]}` : 'Hello, Sign in'}
                    </span>
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      Account & Lists
                      <ChevronDown size={11} className={`text-slate-400 transition-transform ${userDropdown ? 'rotate-180' : ''}`} />
                    </span>
                  </div>
                </button>

                <AnimatePresence>
                  {userDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-50 text-slate-900"
                    >
                      {isAuthenticated && user ? (
                        <>
                          {/* User Header */}
                          <div className="px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-100 mb-2">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
                                alt={user.name}
                                className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                                <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                                {user.role || activeRole || 'Buyer'}
                              </span>
                              {user.vendorId && (
                                <span className="text-[10px] text-slate-500 font-mono">
                                  ID: {user.vendorId.slice(-6)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Authenticated Links */}
                          <div className="space-y-0.5 text-xs">
                            <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Your Account
                            </p>
                            <Link
                              to="/"
                              onClick={() => setUserDropdown(false)}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
                            >
                              <Sparkles size={14} className="text-amber-500" />
                              <span>Explore Marketplace</span>
                            </Link>

                            <Link
                              to="/orders"
                              onClick={() => setUserDropdown(false)}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
                            >
                              <Package size={14} className="text-indigo-600" />
                              <span>Your Orders & Deliveries</span>
                            </Link>

                            {(user.role === 'vendor' || activeRole === 'vendor' || user.role === 'admin') && (
                              <>
                                <p className="px-2 pt-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Merchant Controls
                                </p>
                                <Link
                                  to="/vendor/dashboard"
                                  onClick={() => setUserDropdown(false)}
                                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
                                >
                                  <Store size={14} className="text-indigo-600" />
                                  <span>Merchant Dashboard</span>
                                </Link>
                                <Link
                                  to="/vendor/products"
                                  onClick={() => setUserDropdown(false)}
                                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
                                >
                                  <Package size={14} className="text-slate-500" />
                                  <span>Inventory & Products</span>
                                </Link>
                                <Link
                                  to="/vendor/products/new"
                                  onClick={() => setUserDropdown(false)}
                                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
                                >
                                  <PlusCircle size={14} className="text-slate-500" />
                                  <span>Add New Product</span>
                                </Link>
                              </>
                            )}

                            {(user.role === 'admin' || activeRole === 'admin') && (
                              <>
                                <p className="px-2 pt-2 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-500">
                                  Admin Controls
                                </p>
                                <Link
                                  to="/admin/dashboard"
                                  onClick={() => setUserDropdown(false)}
                                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
                                >
                                  <Shield size={14} className="text-purple-600" />
                                  <span>Admin Analytics Center</span>
                                </Link>
                              </>
                            )}

                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-2 px-2.5 py-2 mt-2 border-t border-slate-100 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold cursor-pointer"
                            >
                              <LogOut size={14} />
                              <span>Sign Out</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Unauthenticated Quick Login Menu */}
                          <div className="p-3 text-center border-b border-slate-100">
                            <Link
                              to="/login"
                              onClick={() => setUserDropdown(false)}
                              className="w-full block py-2 px-4 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-xs transition-colors"
                            >
                              Sign In
                            </Link>
                            <p className="text-[11px] text-slate-500 mt-2">
                              New customer?{' '}
                              <Link
                                to="/register"
                                onClick={() => setUserDropdown(false)}
                                className="text-indigo-600 hover:underline font-semibold"
                              >
                                Start here.
                              </Link>
                            </p>
                          </div>

                          {/* 1-Click Quick Demo Switchers */}
                          <div className="p-2 space-y-1">
                            <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                              Instant 1-Click Demo Login
                            </p>
                            <button
                              onClick={() => handleQuickDemoLogin('customer')}
                              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 border border-slate-200/80 cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <User size={13} className="text-sky-500" /> Customer Demo
                              </span>
                              <span className="text-[10px] text-slate-400">Buyer</span>
                            </button>
                            <button
                              onClick={() => handleQuickDemoLogin('vendor')}
                              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 border border-slate-200/80 cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <Store size={13} className="text-amber-500" /> Vendor Demo
                              </span>
                              <span className="text-[10px] text-slate-400">Seller</span>
                            </button>
                            <button
                              onClick={() => handleQuickDemoLogin('admin')}
                              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 border border-slate-200/80 cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <Shield size={13} className="text-purple-500" /> Admin Demo
                              </span>
                              <span className="text-[10px] text-slate-400">Admin</span>
                            </button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Returns & Orders */}
              <Link
                to="/orders"
                className="hidden lg:flex flex-col py-1.5 px-2 rounded-sm hover:ring-1 hover:ring-white transition-all text-left cursor-pointer leading-tight"
                title="View Orders & Delivery Stepper"
              >
                <span className="text-[11px] text-slate-400 font-normal">Returns</span>
                <span className="text-xs font-bold text-white">& Orders</span>
              </Link>

              {/* Wishlist / Saved Items */}
              <button
                onClick={() => {
                  showToast?.(`Wishlist has ${wishlist.length} item(s)`, 'info');
                  scrollToSection('catalog-grid');
                }}
                className="hidden xl:flex items-center gap-1.5 py-1.5 px-2 rounded-sm hover:ring-1 hover:ring-white transition-all text-left cursor-pointer"
                title="View Saved Wishlist"
              >
                <div className="relative">
                  <Heart size={18} className={wishlist.length > 0 ? 'fill-rose-500 text-rose-500' : 'text-slate-300'} />
                  {wishlist.length > 0 && (
                    <span className="absolute -top-1 -right-2 text-[9px] font-bold bg-rose-500 text-white rounded-full px-1">
                      {wishlist.length}
                    </span>
                  )}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[11px] text-slate-400 font-normal">Saved</span>
                  <span className="text-xs font-bold text-white">& Wishlist</span>
                </div>
              </button>

              {/* Amazon-Style Vibrant Cart Pill */}
              <button
                onClick={() => setCartOpen(true)}
                className="flex items-center gap-2 py-1.5 px-2 sm:px-3 rounded-sm hover:ring-1 hover:ring-white transition-all cursor-pointer group"
                title="Open Shopping Cart"
              >
                <div className="relative flex items-center">
                  <ShoppingCart size={24} className="text-white group-hover:text-amber-400 transition-colors" />
                  <span className="absolute -top-1.5 left-2.5 bg-amber-400 text-slate-950 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#131921]">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                </div>
                <div className="hidden sm:flex flex-col leading-tight">
                  <span className="text-[11px] text-slate-400 font-normal">Cart</span>
                  <span className="text-xs font-bold text-white">
                    ₹{cartTotal > 0 ? (cartTotal > 9999 ? `${(cartTotal / 1000).toFixed(1)}k` : cartTotal.toLocaleString('en-IN')) : '0.00'}
                  </span>
                </div>
              </button>

              {/* Mobile Search & Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-white hover:text-amber-400"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SECONDARY SUB-NAV BAR (Amazon-Style Dark Horizontal Strip) */}
      <div className="bg-[#232f3e] text-white text-xs border-b border-slate-700/60 overflow-x-auto scrollbar-none">
        <div className="max-w-[1536px] mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-10 gap-4 min-w-max">
            
            {/* Left Nav Strip Links */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* All Categories trigger */}
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  scrollToSection('catalog-section');
                }}
                className="flex items-center gap-1.5 font-bold text-white py-1.5 px-2.5 rounded-sm hover:ring-1 hover:ring-white transition-all cursor-pointer"
              >
                <Menu size={16} />
                <span>All Categories</span>
              </button>

              <button
                onClick={() => {
                  setSelectedCategory('Electronics');
                  scrollToSection('catalog-grid');
                }}
                className="py-1.5 px-2.5 rounded-sm hover:ring-1 hover:ring-white text-slate-200 hover:text-white transition-all cursor-pointer font-medium"
              >
                Best Sellers
              </button>

              <button
                onClick={() => {
                  scrollToSection('category-feature-cards');
                }}
                className="py-1.5 px-2.5 rounded-sm hover:ring-1 hover:ring-white text-amber-300 hover:text-amber-200 transition-all cursor-pointer font-semibold flex items-center gap-1"
              >
                <Tag size={12} className="text-amber-400" />
                <span>Today's Deals</span>
              </button>

              <button
                onClick={() => {
                  scrollToSection('featured-vendors');
                }}
                className="py-1.5 px-2.5 rounded-sm hover:ring-1 hover:ring-white text-slate-200 hover:text-white transition-all cursor-pointer font-medium"
              >
                Featured Stores
              </button>

              <button
                onClick={() => {
                  setSelectedCategory('Fashion');
                  scrollToSection('catalog-grid');
                }}
                className="py-1.5 px-2.5 rounded-sm hover:ring-1 hover:ring-white text-slate-200 hover:text-white transition-all cursor-pointer font-medium"
              >
                New Releases
              </button>

              <button
                onClick={() => {
                  scrollToSection('escrow-trust');
                }}
                className="hidden lg:flex items-center gap-1 py-1.5 px-2.5 rounded-sm hover:ring-1 hover:ring-white text-slate-300 hover:text-white transition-all cursor-pointer font-medium"
              >
                <Shield size={12} className="text-emerald-400" />
                <span>Escrow Guarantee</span>
              </button>
            </div>

            {/* Right Standout Pill: Sell on MarketNest / Merchant Portal */}
            <div className="flex items-center gap-2">
              <Link
                to={isAuthenticated && (user?.role === 'vendor' || activeRole === 'vendor') ? '/vendor/dashboard' : '/register'}
                onClick={() => {
                  if (isAuthenticated) switchActiveRole('vendor');
                }}
                className="flex items-center gap-1.5 py-1 px-3 rounded-md bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-xs hover:shadow transition-all cursor-pointer"
              >
                <Store size={13} className="text-slate-950" />
                <span>Become a Vendor / Sell</span>
                <ArrowRight size={12} />
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* 3. MOBILE SEARCH & DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#131921] border-t border-slate-800 p-4 space-y-3"
          >
            {/* Mobile Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex rounded-lg overflow-hidden bg-white">
              <input
                type="text"
                placeholder="Search products, brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 py-2 px-3 text-xs text-slate-900 outline-none"
              />
              <button type="submit" className="bg-amber-400 text-slate-950 px-3">
                <Search size={16} />
              </button>
            </form>

            {/* Role switchers on mobile */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-400">Perspective:</span>
              <div className="flex gap-1">
                {roles.map(r => (
                  <button
                    key={r.id}
                    onClick={() => { handleRoleSelect(r.id); setMobileMenuOpen(false); }}
                    className={`px-2 py-1 rounded text-[10px] font-bold ${
                      (activeRole || user?.role || 'customer') === r.id
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {r.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-2">
              <button 
                onClick={() => { setSelectedCategory('All'); setMobileMenuOpen(false); }} 
                className="text-left py-1.5 text-slate-200"
              >
                All Products
              </button>
              <button 
                onClick={() => { setSelectedCategory('Electronics'); setMobileMenuOpen(false); }} 
                className="text-left py-1.5 text-slate-200"
              >
                Electronics Deals
              </button>
              <button 
                onClick={() => { setSelectedCategory('Fashion'); setMobileMenuOpen(false); }} 
                className="text-left py-1.5 text-slate-200"
              >
                Fashion Drops
              </button>
              <Link 
                to="/vendor/dashboard" 
                onClick={() => setMobileMenuOpen(false)} 
                className="text-amber-400 font-semibold py-1.5"
              >
                Merchant Portal
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
