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
  Store, 
  Shield, 
  LogOut, 
  Package, 
  MapPin, 
  ShoppingBag,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const searchCategories = [
  'All',
  'Electronics',
  'Fashion',
  'Home & Living',
  'Kitchen & Appliances',
];

const DEFAULT_DELIVERY_LOCATION = {
  pincode: '110001',
  district: 'Central Delhi',
  state: 'Delhi',
};

export default function Navbar() {
  const { 
    cartCount, 
    cartTotal,
    selectedCategory, 
    setSelectedCategory, 
    searchQuery, 
    setSearchQuery, 
    clearCart
  } = useStore();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [searchFocused, setSearchFocused] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState('All');
  const [deliveryLocation, setDeliveryLocation] = useState(() => {
    try {
      const savedLocation = localStorage.getItem('marketnest_delivery_location');
      return savedLocation
        ? { ...DEFAULT_DELIVERY_LOCATION, ...JSON.parse(savedLocation) }
        : DEFAULT_DELIVERY_LOCATION;
    } catch {
      return DEFAULT_DELIVERY_LOCATION;
    }
  });
  const [locationPin, setLocationPin] = useState(deliveryLocation.pincode);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  const searchInputRef = useRef(null);
  const userMenuRef = useRef(null);

  // Sync internal category with store
  useEffect(() => {
    setSelectedCat(selectedCategory || 'All');
  }, [selectedCategory]);

  // Keyboard shortcut (⌘K or /) to focus search
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

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setSelectedCategory(selectedCat);
    const catalogEl = document.getElementById('catalog-grid');
    if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCategoryNavClick = (cat) => {
    setSelectedCat(cat);
    setSelectedCategory(cat);
    const catalogEl = document.getElementById('catalog-grid');
    if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
  };

  const openLocationDialog = () => {
    setLocationPin(deliveryLocation.pincode);
    setLocationError('');
    setLocationDialogOpen(true);
  };

  const handleLocationSubmit = async (e) => {
    e.preventDefault();
    const pincode = locationPin.trim();
    if (!/^\d{6}$/.test(pincode)) {
      setLocationError('Enter a valid 6-digit Indian PIN code.');
      return;
    }

    setLocationLoading(true);
    setLocationError('');
    try {
      const response = await api.get(`/location/pincode/${pincode}`);
      if (!response.data?.success || !response.data.data) {
        setLocationError(response.data?.message || 'Could not verify this PIN code.');
        return;
      }

      const nextLocation = response.data.data;
      localStorage.setItem('marketnest_delivery_location', JSON.stringify(nextLocation));
      setDeliveryLocation(nextLocation);
      setLocationDialogOpen(false);
    } catch (error) {
      setLocationError(error.response?.data?.message || 'Could not verify this PIN code. Please try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleLogout = async () => {
    setUserDropdown(false);
    clearCart?.();
    await logout();
    navigate('/');
  };

  const isVendor = user?.role === 'vendor';
  const isAdmin = user?.role === 'admin';

  return (
    <header className="market-glass-header sticky top-0 z-50 w-full font-sans select-none shadow-sm">
      {/* ─── 1. MODERN ENTERPRISE PRIMARY TOP BAR (Deep Slate 900) ─────────── */}
      <div className="market-glass-topbar bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
            
            {/* Left: Modern Brand Logo + Delivery Location */}
            <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
              {/* Brand Logo with Electric Indigo Dot */}
              <Link
                to="/"
                onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                className="flex items-center gap-2.5 group transition-transform duration-200 active:scale-95"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 group-hover:bg-indigo-500 transition-colors">
                  <ShoppingBag size={18} strokeWidth={2.5} />
                </div>
                <div className="flex items-center">
                  <span className="mn-brand-title text-xl font-black tracking-tight text-white group-hover:text-indigo-200 transition-colors">
                    MarketNest
                  </span>
                  <span className="w-2 h-2 rounded-full bg-indigo-500 ml-1.5 animate-pulse" />
                </div>
              </Link>

              {/* Modern Deliver To Pill */}
              <button
                type="button"
                onClick={openLocationDialog}
                className="hidden xl:flex items-center gap-2 py-1.5 px-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs hover:border-slate-500 transition cursor-pointer text-left"
                title="Change delivery PIN code"
              >
                <MapPin size={15} className="text-indigo-400 flex-shrink-0" />
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Deliver to</span>
                  <span className="text-xs font-bold text-slate-100 truncate max-w-[150px]">
                    {deliveryLocation.district}, {deliveryLocation.state} {deliveryLocation.pincode}
                  </span>
                </div>
              </button>
            </div>

            {/* Center: Modern Rounded-XL Search Bar */}
            <form 
              onSubmit={handleSearchSubmit}
              className="flex-1 max-w-2xl hidden md:flex items-center mx-2"
            >
              <div
                className={`flex w-full items-center bg-slate-800/90 rounded-xl border transition-all duration-200 ${
                  searchFocused
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-slate-800 shadow-sm'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                {/* Category Dropdown */}
                <div className="relative flex items-center border-r border-slate-700/80">
                  <select
                    value={selectedCat}
                    onChange={(e) => {
                      setSelectedCat(e.target.value);
                      setSelectedCategory(e.target.value);
                    }}
                    className="appearance-none bg-transparent py-2 pl-3 pr-7 text-xs font-semibold text-slate-300 outline-none cursor-pointer hover:text-white"
                  >
                    {searchCategories.map((cat) => (
                      <option key={cat} value={cat} className="bg-slate-900 text-slate-100">
                        {cat === 'All' ? 'All Categories' : cat}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 text-slate-400 pointer-events-none" />
                </div>

                {/* Main Search Text Input */}
                <div className="flex-1 relative flex items-center">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search over 10,000+ verified products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    className="w-full py-2 px-3 text-sm text-slate-100 placeholder-slate-400 outline-none bg-transparent"
                  />

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-1 mr-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Electric Indigo Search Action Button */}
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-1.5 mx-1.5 flex items-center justify-center transition-all shadow-sm font-semibold cursor-pointer active:scale-95"
                  title="Search MarketNest"
                >
                  <Search size={16} strokeWidth={2.5} />
                </button>
              </div>
            </form>

            {/* Right Side: Role Shortcuts, User Dropdown, Orders, Cart */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">

              {/* Role-Based Shortcut: Become a Seller */}
              {!isVendor && (
                <Link
                  to="/vendor/register"
                  className="hidden lg:flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 text-xs font-semibold transition"
                >
                  <Store size={14} className="text-indigo-400" />
                  <span>Become a Seller</span>
                </Link>
              )}

              {/* Role-Based Shortcut: Vendor Console */}
              {isVendor && (
                <Link
                  to="/vendor/dashboard"
                  className="hidden lg:flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 hover:bg-indigo-900/60 text-xs font-semibold transition"
                >
                  <Store size={14} />
                  <span>Vendor Console</span>
                </Link>
              )}

              {/* Role-Based Shortcut: Admin Center */}
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="hidden lg:flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-purple-950/60 text-purple-300 border border-purple-800/60 hover:bg-purple-900/60 text-xs font-semibold transition"
                >
                  <Shield size={14} />
                  <span>Admin Center</span>
                </Link>
              )}

              {/* Accounts & Lists Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserDropdown(!userDropdown)}
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700/60 transition text-left cursor-pointer"
                >
                  <div className="flex flex-col leading-tight">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {isAuthenticated && user ? `Hi, ${user.name.split(' ')[0]}` : 'Welcome'}
                    </span>
                    <span className="text-xs font-bold text-slate-100 flex items-center gap-1">
                      {isAuthenticated ? 'Account' : 'Sign In'}
                      <ChevronDown size={11} className={`text-slate-400 transition-transform ${userDropdown ? 'rotate-180' : ''}`} />
                    </span>
                  </div>
                </button>

                <AnimatePresence>
                  {userDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-3.5 z-50 text-slate-900"
                    >
                      {isAuthenticated && user ? (
                        /* Logged-In Menu */
                        <div className="space-y-2">
                          <div className="pb-2.5 border-b border-slate-100">
                            <p className="text-xs font-bold text-slate-900">{user.name}</p>
                            <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                            <div className="mt-1.5 flex items-center gap-1.5">
                              {user.role === 'admin' ? (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-800 border border-purple-200">
                                  Administrator
                                </span>
                              ) : user.role === 'vendor' ? (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800 border border-indigo-200">
                                  Verified Seller
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Customer
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1 text-xs">
                            <Link
                              to="/orders"
                              onClick={() => setUserDropdown(false)}
                              className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold transition"
                            >
                              <Package size={14} className="text-slate-500" />
                              <span>My Orders & Invoices</span>
                            </Link>

                            {isVendor && (
                              <Link
                                to="/vendor/dashboard"
                                onClick={() => setUserDropdown(false)}
                                className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-indigo-50 text-indigo-700 font-semibold transition"
                              >
                                <Store size={14} />
                                <span>Vendor Dashboard</span>
                              </Link>
                            )}

                            {isAdmin && (
                              <Link
                                to="/admin/dashboard"
                                onClick={() => setUserDropdown(false)}
                                className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-purple-50 text-purple-700 font-semibold transition"
                              >
                                <Shield size={14} />
                                <span>Admin Management</span>
                              </Link>
                            )}

                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-2.5 p-2 pt-2.5 border-t border-slate-100 text-rose-600 hover:bg-rose-50 rounded-xl font-semibold cursor-pointer text-left transition"
                            >
                              <LogOut size={14} />
                              <span>Sign Out</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Logged-Out Sign In Card */
                        <div className="space-y-3">
                          <Link
                            to="/login"
                            onClick={() => setUserDropdown(false)}
                            className="block w-full text-center py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
                          >
                            Sign In to Account
                          </Link>
                          <p className="text-[11px] text-slate-500 text-center">
                            New customer?{' '}
                            <Link
                              to="/register"
                              onClick={() => setUserDropdown(false)}
                              className="text-indigo-600 hover:underline font-bold"
                            >
                              Start here.
                            </Link>
                          </p>
                          <div className="pt-2 border-t border-slate-100 text-center">
                            <Link
                              to="/admin/login"
                              onClick={() => setUserDropdown(false)}
                              className="text-[11px] font-semibold text-slate-400 hover:text-indigo-600 transition"
                            >
                              Admin Portal Login &rarr;
                            </Link>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Returns & Orders -> /orders */}
              <Link
                to="/orders"
                className="hidden sm:flex flex-col py-1.5 px-3 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700/60 transition text-left cursor-pointer leading-tight"
                title="Orders & Tracking"
              >
                <span className="text-[10px] text-slate-400 font-medium">Track</span>
                <span className="text-xs font-bold text-slate-100">Orders</span>
              </Link>

              {/* Cart Button with Electric Indigo Pill Badge -> /cart */}
              <Link
                to="/cart"
                className="flex items-center gap-2 py-1.5 px-3 sm:px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700/70 text-white transition-all cursor-pointer group"
                title="Shopping Cart"
              >
                <div className="relative flex items-center">
                  <ShoppingCart size={18} className="text-slate-200 group-hover:text-indigo-400 transition-colors" />
                </div>
                <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold shadow-xs">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
                <span className="hidden sm:inline text-xs font-bold text-slate-200">
                  ₹{cartTotal > 0 ? (cartTotal > 9999 ? `${(cartTotal / 1000).toFixed(1)}k` : cartTotal.toLocaleString('en-IN')) : '0'}
                </span>
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 text-slate-300 hover:text-white"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>

          </div>

          {/* Mobile Search Bar Row */}
          <div className="pb-3 md:hidden">
            <form onSubmit={handleSearchSubmit} className="flex rounded-xl overflow-hidden bg-slate-800 border border-slate-700">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 py-2 px-3 text-xs text-slate-100 placeholder-slate-400 outline-none bg-transparent"
              />
              <button type="submit" className="bg-indigo-600 px-3.5 text-white">
                <Search size={15} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ─── 2. SUB-NAV BAR (Charcoal Slate Strip) ─────────────────────────── */}
      <div className="market-glass-categorybar bg-slate-900/95 backdrop-blur-sm text-slate-300 text-xs border-b border-slate-800/80 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-10 gap-2 sm:gap-4 min-w-max">
            
            {/* Category Pills with Smooth Hover */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={openLocationDialog}
                className="xl:hidden inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-indigo-500 hover:bg-slate-800"
                title="Change delivery PIN code"
              >
                <MapPin size={13} className="text-indigo-400" />
                <span>Deliver to {deliveryLocation.pincode}</span>
              </button>
              <button
                onClick={() => handleCategoryNavClick('All')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  (selectedCategory || 'All') === 'All' 
                    ? 'bg-indigo-600 text-white shadow-xs' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Menu size={14} />
                <span>All Categories</span>
              </button>

              <button
                onClick={() => handleCategoryNavClick('Electronics')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  selectedCategory === 'Electronics' 
                    ? 'bg-indigo-600 text-white font-semibold' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                Electronics
              </button>

              <button
                onClick={() => handleCategoryNavClick('Fashion')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  selectedCategory === 'Fashion' 
                    ? 'bg-indigo-600 text-white font-semibold' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                Fashion
              </button>

              <button
                onClick={() => handleCategoryNavClick('Home & Kitchen')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  selectedCategory === 'Home & Kitchen' 
                    ? 'bg-indigo-600 text-white font-semibold' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                Home & Kitchen
              </button>

              <button
                onClick={() => handleCategoryNavClick('Appliances')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  selectedCategory === 'Appliances' 
                    ? 'bg-indigo-600 text-white font-semibold' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                Appliances
              </button>
            </div>

            {/* Right-Aligned Button: Become a Vendor / Sell on MarketNest */}
            <div className="flex items-center pl-2">
              <Link
                to="/vendor/register"
                className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white font-semibold text-xs transition-colors border border-indigo-500/30"
              >
                <Store size={13} />
                <span>Sell on MarketNest</span>
              </Link>
            </div>

          </div>
        </div>
      </div>

      {locationDialogOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => setLocationDialogOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delivery-location-title"
            className="w-full max-w-md rounded-2xl bg-white p-5 text-slate-900 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="delivery-location-title" className="text-lg font-bold">Set delivery location</h2>
                <p className="mt-1 text-sm text-slate-500">Enter your 6-digit PIN code to find your delivery area.</p>
              </div>
              <button
                type="button"
                onClick={() => setLocationDialogOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close location dialog"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleLocationSubmit} className="mt-5 space-y-3">
              <label htmlFor="delivery-pincode" className="block text-xs font-semibold text-slate-700">
                Indian PIN code
              </label>
              <input
                id="delivery-pincode"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={6}
                value={locationPin}
                onChange={(event) => {
                  setLocationPin(event.target.value.replace(/\D/g, '').slice(0, 6));
                  setLocationError('');
                }}
                placeholder="e.g. 110001"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
              {locationError && <p className="text-xs font-medium text-rose-600">{locationError}</p>}
              <button
                type="submit"
                disabled={locationLoading || locationPin.length !== 6}
                className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {locationLoading ? 'Checking PIN code...' : 'Save delivery location'}
              </button>
            </form>

            <p className="mt-3 text-[11px] text-slate-500">
              Current area: {deliveryLocation.district}, {deliveryLocation.state} ({deliveryLocation.pincode})
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
