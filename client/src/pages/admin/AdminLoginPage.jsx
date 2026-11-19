import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, AlertCircle, Loader2, ArrowLeft, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../store/useStore';

export default function AdminLoginPage() {
  const { login, logout } = useAuth();
  const { showToast } = useStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both administrator email and master password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        if (res.user.role !== 'admin') {
          // Block non-admin users
          await logout();
          setError('Access denied. Administrator privileges required.');
          showToast?.('Access denied: Administrator privileges required.', 'error');
          return;
        }

        showToast?.('Welcome to MarketNest Admin Console', 'success');
        navigate('/admin/dashboard', { replace: true });
      } else {
        setError(res.error || 'Invalid administrator credentials. Please check your details.');
      }
    } catch {
      setError('Authentication gateway temporarily unreachable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setEmail('admin@marketnest.com');
    setPassword('admin123');
    setError('');
  };

  return (
    <div className="min-h-[85vh] w-full flex items-center justify-center bg-slate-50 px-4 py-12 font-sans">
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 p-8 transition-all">
        
        {/* Security Badge & Branding */}
        <div className="flex flex-col items-center justify-center text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-indigo-300 text-xs font-bold tracking-wide uppercase shadow-sm mb-4 border border-slate-800">
            <ShieldCheck size={15} className="text-indigo-400" />
            <span>MarketNest Admin Console</span>
          </div>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Administrator Sign In
          </h1>
          <p className="text-xs text-slate-500 mt-1.5 max-w-xs leading-relaxed">
            Enter your privileged credentials to access catalog management, order fulfillment, and platform metrics.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-start gap-2.5 shadow-xs">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-rose-600" />
            <div className="leading-snug">
              <strong className="block font-semibold">Access Restriction</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="admin-email-input" 
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Administrator Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail size={16} />
              </div>
              <input
                id="admin-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@marketnest.com"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-[#4f46e5] outline-none text-slate-800 text-sm transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label 
                htmlFor="admin-password-input" 
                className="block text-xs font-semibold text-slate-700"
              >
                Password
              </label>
              <button
                type="button"
                onClick={handleFillDemoAdmin}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer flex items-center gap-1"
              >
                <KeyRound size={12} />
                <span>Fill Default Admin</span>
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={16} />
              </div>
              <input
                id="admin-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-[#4f46e5] outline-none text-slate-800 text-sm transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#4f46e5] hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm mt-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            <span>{loading ? 'Verifying Credentials...' : 'Authenticate & Open Workspace'}</span>
          </button>
        </form>

        {/* Demo Credentials Pill */}
        <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
          <p className="text-[11px] text-slate-500">
            Default Root Credentials: <strong className="text-slate-800 font-mono">admin@marketnest.com</strong> / <strong className="text-slate-800 font-mono">admin123</strong>
          </p>
        </div>

        {/* Back to Storefront Link */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Return to MarketNest Storefront</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
