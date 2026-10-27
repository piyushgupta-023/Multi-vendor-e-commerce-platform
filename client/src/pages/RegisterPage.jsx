import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Store, 
  Mail, 
  Lock, 
  Phone, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  ArrowRight, 
  AlertCircle, 
  RefreshCw,
  Sparkles,
  Zap,
  Building
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../store/useStore';
import AuthBrandingSide from '../components/auth/AuthBrandingSide';
import QuickDemoBar from '../components/auth/QuickDemoBar';

const CATEGORIES = [
  'Electronics',
  'Fashion',
  'Home & Living',
  'Sports & Fitness',
  'Food & Gourmet',
  'Beauty & Personal Care',
];

export default function RegisterPage() {
  const { register } = useAuth();
  const { showToast } = useStore();
  const navigate = useNavigate();

  const [role, setRole] = useState('customer'); // 'customer' | 'vendor'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [storeDescription, setStoreDescription] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in your name, email, and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    if (role === 'vendor' && !storeName.trim()) {
      setError('Please provide a storefront name for your vendor portal.');
      return;
    }

    setLoading(true);

    const payload = {
      name: name.trim(),
      email: email.trim(),
      password,
      role,
      phone: phone.trim() || undefined,
      ...(role === 'vendor' && {
        storeName: storeName.trim(),
        category,
        storeDescription: storeDescription.trim() || undefined,
      }),
    };

    try {
      const res = await register(payload);
      if (res.success) {
        showToast?.(
          role === 'vendor'
            ? `Vendor storefront "${storeName}" registered! Welcome to Vendor OS!`
            : `Welcome to MarketNest, ${res.user.name}!`,
          'success'
        );
        if (role === 'vendor') {
          navigate('/vendor/dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        setError(res.error || 'Registration failed. Please check your information and try again.');
      }
    } catch (err) {
      setError('Unable to complete registration. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-slate-50">
      {/* Left Column: Branding & Trust Metrics */}
      <AuthBrandingSide />

      {/* Right Column: Spacious Form Card */}
      <div className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-10 my-4 sm:my-8">
          
          {/* Mobile-only Top Brand Header */}
          <div className="lg:hidden flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
                  <path d="M2 7h20" />
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">MarketNest</span>
            </Link>
            <Link to="/" className="text-xs font-semibold text-slate-500 hover:text-slate-800">
              Skip to Store →
            </Link>
          </div>

          {/* Form Heading */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Create your MarketNest Account
            </h2>
            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
              Join thousands of shoppers and verified merchants trading on our unified commerce platform.
            </p>
          </div>

          {/* Role Tabs: Clean Pill Toggle */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 mb-6">
            <button
              type="button"
              onClick={() => setRole('customer')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                role === 'customer'
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <User size={15} />
              <span>Customer Account</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('vendor')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                role === 'vendor'
                  ? 'bg-white text-violet-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Store size={15} />
              <span>Vendor Storefront</span>
            </button>
          </div>

          {/* Quick Demo Access Bar */}
          <QuickDemoBar destination="/" />

          {/* Divider */}
          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-xs font-semibold uppercase text-slate-400 tracking-wider">
              Or register your details
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5"
              >
                <AlertCircle size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 tracking-wider mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User size={17} />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-none"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 tracking-wider mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail size={17} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 tracking-wider mb-1.5">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock size={17} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full h-12 pl-11 pr-11 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Phone Number (Optional) */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 tracking-wider mb-1.5">
                Phone Number <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Phone size={17} />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-none"
                />
              </div>
            </div>

            {/* Vendor Specific Inputs */}
            {role === 'vendor' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-5 pt-3 border-t border-slate-100"
              >
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 tracking-wider mb-1.5">
                    Storefront Brand Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Store size={17} />
                    </div>
                    <input
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="e.g. Nexus Tech Studios"
                      className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-300 focus:border-violet-600 focus:ring-2 focus:ring-violet-100 text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 tracking-wider mb-1.5">
                    Primary Store Category
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Building size={17} />
                    </div>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-300 focus:border-violet-600 focus:ring-2 focus:ring-violet-100 text-sm text-slate-900 transition-all outline-none appearance-none bg-white cursor-pointer"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 tracking-wider mb-1.5">
                    Store Bio / Short Description
                  </label>
                  <textarea
                    rows={2}
                    value={storeDescription}
                    onChange={(e) => setStoreDescription(e.target.value)}
                    placeholder="Briefly describe what your storefront specializes in..."
                    className="w-full p-3.5 rounded-xl border border-slate-300 focus:border-violet-600 focus:ring-2 focus:ring-violet-100 text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-none resize-none"
                  />
                </div>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full h-12 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 text-sm mt-3 ${
                role === 'vendor'
                  ? 'bg-violet-600 hover:bg-violet-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Setting up account...</span>
                </>
              ) : (
                <>
                  <span>{role === 'vendor' ? 'Register Vendor Storefront' : 'Create Customer Account'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Clean Bottom Links */}
          <div className="mt-8 pt-6 border-t border-slate-100 space-y-3 text-center">
            <p className="text-xs text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline">
                Sign in
              </Link>
            </p>

            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft size={13} /> Return to Marketplace Home
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
