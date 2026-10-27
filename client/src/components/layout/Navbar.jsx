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
  Command
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useAuth } from '../../context/AuthContext';

const roles = [
  { id: 'customer', label: 'Buyer View', desc: 'Browse catalog & orders', icon: User },
  { id: 'vendor', label: 'Merchant Portal', desc: 'Manage inventory & products', icon: Store },
  { id: 'admin', label: 'Platform Admin', desc: 'Platform supervision & KYC', icon: Shield },
];

const searchCategories = [
  'All',
  'Electronics',
  'Fashion',
  'Home & Living',
  'Sports & Fitness',
  'Food & Gourmet',
  'Beauty & Personal Care',
];

export default function Navbar() {
  const { cartCount, setCartOpen, selectedCategory, setSelectedCategory, searchQuery, setSearchQuery, showToast } = useStore();
  const { user, isAuthenticated, activeRole, logout, switchActiveRole } = useAuth();
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdown, setRoleDropdown] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);

  const searchInputRef = useRef(null);
  const roleMenuRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    } else if (roleId === 'customer') {
      navigate('/');
    }
  };

  const handleLogout = async () => {
    setUserDropdown(false);
    await logout();
    showToast?.('Signed out successfully.', 'info');
    navigate('/');
  };

  const getRoleBadge = (role) => {
    switch ((role || '').toLowerCase()) {
      case 'admin':
        return { label: 'Platform Admin', badgeClass: 'bg-slate-900 text-white' };
      case 'vendor':
        return { label: 'Merchant', badgeClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200' };
      default:
        return { label: 'Buyer', badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200' };
    }
  };

  const roleBadge = getRoleBadge(user?.role || activeRole);

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-150">
      {/* Minimalist Header */}
      <nav
        className={`transition-all duration-150 border-b ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-xs border-slate-200/80'
            : 'bg-white border-slate-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4 sm:gap-8">
            
            {/* Brand Logo with Clean Indigo Geometric Mark */}
            <Link
              to="/"
              onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
              className="flex-shrink-0 flex items-center gap-2.5 select-none group"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:bg-indigo-700 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
                  <path d="M2 7h20" />
                </svg>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  MarketNest
                </span>
                <span className="hidden sm:inline-block text-[11px] font-medium text-slate-400">
                  direct
                </span>
              </div>
            </Link>

            {/* Center Search Bar with Keyboard Hint */}
            <div className="flex-1 max-w-xl hidden md:block">
              <div
                className={`relative flex items-center rounded-xl transition-all duration-150 bg-slate-50 border ${
                  searchFocused
                    ? 'ring-2 ring-indigo-500/10 border-indigo-600 bg-white'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <Search size={15} className={`ml-3.5 transition-colors ${searchFocused ? 'text-indigo-600' : 'text-slate-400'}`} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products, makers, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="w-full py-2 px-3 bg-transparent text-xs text-slate-900 placeholder-slate-400 outline-none"
                />

                {/* Subtle category dropdown indicator */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="hidden lg:block text-[11px] font-medium text-slate-500 bg-transparent pr-2 pl-1 border-l border-slate-200/70 outline-none cursor-pointer hover:text-slate-800"
                >
                  {searchCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {/* Clear button or ⌘K keyboard shortcut */}
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mr-2 p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                ) : (
                  <div className="mr-2.5 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded">
                    <span>⌘K</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side Navigation Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Role Perspective Switcher */}
              <div className="relative hidden lg:block" ref={roleMenuRef}>
                <button
                  onClick={() => setRoleDropdown(!roleDropdown)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80 transition-all cursor-pointer"
                >
                  <currentRole.icon size={14} className="text-slate-500" />
                  <span>{currentRole.label}</span>
                  <ChevronDown size={12} className={`text-slate-400 transition-transform ${roleDropdown ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {roleDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-xl shadow-lg border border-slate-200/80 p-1.5 z-50"
                    >
                      <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Marketplace Perspective</p>
                      </div>

                      {roles.map((r) => {
                        const Icon = r.icon;
                        const isSelected = (activeRole || user?.role || 'customer') === r.id;
                        return (
                          <button
                            key={r.id}
                            onClick={() => handleRoleSelect(r.id)}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                              isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon size={14} className={isSelected ? 'text-indigo-600' : 'text-slate-400'} />
                              <div>
                                <p className="font-semibold">{r.label}</p>
                                <p className="text-[10px] text-slate-400">{r.desc}</p>
                              </div>
                            </div>
                            {isSelected && <Check size={13} className="text-indigo-600" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Quick Merchant Link if logged in as vendor or previewing */}
              {(user?.role === 'vendor' || activeRole === 'vendor' || user?.role === 'admin') && (
                <Link
                  to="/vendor/dashboard"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-xs"
                >
                  <Store size={13} />
                  <span>Merchant Portal</span>
                </Link>
              )}

              {/* Cart Slide-Over Trigger */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80 transition-colors cursor-pointer"
                title="View Bag"
              >
                <ShoppingCart size={17} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>

              {/* Profile Dropdown */}
              {isAuthenticated && user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserDropdown(!userDropdown)}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50 border border-slate-200/80 transition-colors cursor-pointer"
                  >
                    <img
                      src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
                      alt={user.name}
                      className="w-7 h-7 rounded-md object-cover bg-slate-100"
                    />
                    <ChevronDown size={12} className={`text-slate-400 mr-1 transition-transform ${userDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {userDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-xl shadow-lg border border-slate-200/80 p-1.5 z-50"
                      >
                        <div className="px-3 py-2 border-b border-slate-100 mb-1">
                          <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                          <div className="mt-1.5">
                            <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded ${roleBadge.badgeClass}`}>
                              {roleBadge.label}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          {(user.role === 'vendor' || activeRole === 'vendor') && (
                            <>
                              <Link
                                to="/vendor/dashboard"
                                onClick={() => setUserDropdown(false)}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 text-left transition-colors"
                              >
                                <Store size={14} className="text-indigo-600" />
                                <span>Merchant Dashboard</span>
                              </Link>
                              <Link
                                to="/vendor/products"
                                onClick={() => setUserDropdown(false)}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 text-left transition-colors"
                              >
                                <Package size={14} className="text-slate-400" />
                                <span>Product Inventory</span>
                              </Link>
                              <Link
                                to="/vendor/products/new"
                                onClick={() => setUserDropdown(false)}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 text-left transition-colors"
                              >
                                <PlusCircle size={14} className="text-slate-400" />
                                <span>Add New Product</span>
                              </Link>
                              <Link
                                to="/vendor/settings"
                                onClick={() => setUserDropdown(false)}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 text-left transition-colors"
                              >
                                <Settings size={14} className="text-slate-400" />
                                <span>Store Settings</span>
                              </Link>
                            </>
                          )}

                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 text-left transition-colors cursor-pointer mt-1 pt-1.5 border-t border-slate-100"
                          >
                            <LogOut size={14} />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-50"
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search and Filter Row */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 p-4 bg-white space-y-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search catalog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2 pl-9 pr-3 rounded-lg border border-slate-200 text-xs text-slate-900 outline-none"
              />
            </div>
            <div className="flex flex-col gap-1 text-xs">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="py-2 text-slate-700 font-medium">Catalog Home</Link>
              {(user?.role === 'vendor' || activeRole === 'vendor') && (
                <Link to="/vendor/dashboard" onClick={() => setMobileMenuOpen(false)} className="py-2 text-indigo-600 font-semibold">Merchant Portal</Link>
              )}
              {isAuthenticated ? (
                <button onClick={handleLogout} className="py-2 text-left text-rose-600 font-medium">Sign Out</button>
              ) : (
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="py-2 text-indigo-600 font-semibold">Sign In / Register</Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
