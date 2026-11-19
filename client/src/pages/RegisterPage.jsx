import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup } from 'firebase/auth';
import { ShoppingBag, AlertCircle, Loader2, Store, User, Mail, Smartphone } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../store/useStore';

const VENDOR_CATEGORIES = [
  'Electronics',
  'Fashion',
  'Home & Kitchen',
  'Appliances',
  'Sports & Fitness',
];

export default function RegisterPage({ initialRole }) {
  const { register, firebaseLogin } = useAuth();
  const { showToast } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const isVendorQuery = queryParams.get('role') === 'vendor' || initialRole === 'vendor' || location.pathname.includes('vendor');

  const [role, setRole] = useState(isVendorQuery ? 'vendor' : 'customer'); // 'customer' | 'vendor'
  const [authMethod, setAuthMethod] = useState('email'); // 'email' | 'phone'
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Real Phone auth state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Vendor fields
  const [storeName, setStoreName] = useState('');
  const [category, setCategory] = useState(VENDOR_CATEGORIES[0]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isVendorQuery) {
      setRole('vendor');
    }
  }, [isVendorQuery]);

  useEffect(() => () => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      delete window.recaptchaVerifier;
    }
  }, []);

  // Standard Email/Password registration
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password) {
      setError('Please provide your name, email, and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    if (role === 'vendor' && !storeName.trim()) {
      setError('Please enter a storefront name for your seller account.');
      return;
    }

    setLoading(true);

    const payload = {
      name: name.trim(),
      email: email.trim(),
      password,
      role,
      ...(role === 'vendor' && {
        storeName: storeName.trim(),
        category,
        storeDescription: `Official storefront of ${storeName.trim()}`,
      }),
    };

    try {
      const res = await register(payload);
      if (res.success) {
        showToast?.(
          role === 'vendor'
            ? `Vendor storefront "${storeName}" registered! Welcome to Vendor Portal!`
            : `Welcome to MarketNest, ${res.user.name}!`,
          'success'
        );
        if (role === 'vendor') {
          navigate('/vendor/dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        setError(res.error || 'Registration failed. Please check your information.');
      }
    } catch {
      setError('Registration could not be completed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper: Initialize Invisible Firebase reCAPTCHA Verifier
  const getRecaptchaVerifier = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved automatically
        },
        'expired-callback': () => {
          setError('reCAPTCHA verification expired. Please request OTP again.');
        },
      });
    }
    return window.recaptchaVerifier;
  };

  // Real SMS Sending via Firebase signInWithPhoneNumber
  const handleSendOtp = async () => {
    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setError('');
    setSendingOtp(true);

    try {
      const formattedPhone = phone.startsWith('+') 
        ? phone.replace(/\s+/g, '') 
        : `+91${cleanDigits.slice(-10)}`;

      const appVerifier = getRecaptchaVerifier();
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      
      setConfirmationResult(confirmation);
      setOtpSent(true);
      showToast?.(`SMS OTP dispatched to ${formattedPhone}`, 'success');
    } catch (err) {
      console.error('Firebase SMS OTP Error:', err);
      if (err.code === 'auth/invalid-phone-number') {
        setError('The phone number format is invalid. Please enter a valid 10-digit mobile number.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait a few moments before requesting another SMS.');
      } else if (err.code === 'auth/billing-not-enabled' || err.code === 'auth/quota-exceeded') {
        setError('SMS service quota reached. Please register using Email or Google.');
      } else {
        setError(err.message || 'Failed to dispatch carrier SMS. Please verify Firebase setup.');
      }
    } finally {
      setSendingOtp(false);
    }
  };

  // Real Phone OTP Verification via Firebase Confirmation Result
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!otp || otp.trim().length < 6) {
      setError('Please enter the 6-digit verification code sent to your phone.');
      return;
    }

    if (!confirmationResult) {
      setError('Please request an SMS verification code first.');
      return;
    }

    if (role === 'vendor' && !storeName.trim()) {
      setError('Please enter a storefront name for your seller account.');
      return;
    }

    setLoading(true);
    try {
      // 1. Confirm OTP against Firebase Auth
      const result = await confirmationResult.confirm(otp.trim());
      const idToken = await result.user.getIdToken();
      const verifiedPhone = result.user.phoneNumber || (phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '').slice(-10)}`);

      // 2. Transmit verified token to backend
      const res = await firebaseLogin({
        idToken,
        phone: verifiedPhone,
        name: name.trim(),
        uid: result.user.uid,
        role,
        ...(role === 'vendor' && {
          storeName: storeName.trim(),
          category,
        }),
      });

      if (res.success) {
        showToast?.(
          role === 'vendor'
            ? `Vendor storefront "${storeName}" registered! Welcome!`
            : `Welcome to MarketNest, ${res.user.name}!`,
          'success'
        );
        if (role === 'vendor') {
          navigate('/vendor/dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        setError(res.error || 'Phone account verification failed.');
      }
    } catch (err) {
      console.error('Firebase OTP Confirmation Error:', err);
      if (err.code === 'auth/invalid-verification-code') {
        setError('Invalid SMS verification code. Please check the code and try again.');
      } else if (err.code === 'auth/code-expired') {
        setError('Verification code has expired. Please request a new SMS OTP.');
      } else {
        setError(err.message || 'Phone verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Real Google Sign-In with Firebase signInWithPopup
  const handleGoogleSignIn = async () => {
    setError('');

    if (role === 'vendor' && !storeName.trim()) {
      setError('Please enter a storefront name for your seller account before Google sign-in.');
      return;
    }

    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const res = await firebaseLogin({
        idToken,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        uid: result.user.uid,
        role,
        ...(role === 'vendor' && {
          storeName: storeName.trim(),
          category,
        }),
      });

      if (res.success) {
        showToast?.(
          role === 'vendor'
            ? `Seller account "${res.user.storeName || storeName}" activated! Welcome!`
            : `Signed in with Google! Welcome, ${res.user.name}!`,
          'success'
        );
        if (res.user.role === 'vendor') {
          navigate('/vendor/dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        setError(res.error || 'Google authentication failed.');
      }
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was closed before completion.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Previous sign-in request was cancelled.');
      } else {
        setError(err.message || 'Google authentication service encountered an error.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] w-full flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* ─── Auth Card Container ───────────────────────────────────── */}
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-md border border-slate-200/80 p-8 transition-all">
        
        {/* Invisible Firebase reCAPTCHA Container */}
        <div id="recaptcha-container" />

        {/* Clean Centered Branding */}
        <div className="flex flex-col items-center justify-center text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 group mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#4f46e5] flex items-center justify-center text-white shadow-md shadow-indigo-600/30 group-hover:bg-indigo-700 transition-colors">
              <ShoppingBag size={20} strokeWidth={2.5} />
            </div>
            <div className="flex items-center">
              <span className="text-2xl font-black tracking-tight text-slate-900 group-hover:text-[#4f46e5] transition-colors">
                MarketNest
              </span>
              <span className="w-2 h-2 rounded-full bg-[#4f46e5] ml-1.5" />
            </div>
          </Link>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {role === 'vendor' ? 'Register Seller Store' : 'Create an Account'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {role === 'vendor'
              ? 'Join our vetted network of verified merchants and reach global buyers.'
              : 'Join MarketNest to discover quality products from verified creators.'}
          </p>
        </div>

        {/* ─── Role Switcher Segmented Toggle with Clear Breathing Room ────────────────── */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">
            Select Account Type
          </label>
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-sm font-medium">
            <button
              type="button"
              onClick={() => setRole('customer')}
              className={`py-2 text-center transition flex items-center justify-center gap-2 cursor-pointer rounded-lg ${
                role === 'customer'
                  ? 'bg-white shadow-sm text-slate-900 font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <User size={15} />
              <span>Buyer Account</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('vendor')}
              className={`py-2 text-center transition flex items-center justify-center gap-2 cursor-pointer rounded-lg ${
                role === 'vendor'
                  ? 'bg-[#4f46e5] text-white shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Store size={15} />
              <span>Seller Account</span>
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-start gap-2.5 shadow-xs">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-rose-600" />
            <div className="leading-snug">
              <strong className="block font-semibold">Account creation notice</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Modern Tab Switcher: Email vs Mobile OTP */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-sm font-medium mb-6">
          <button
            type="button"
            onClick={() => { setAuthMethod('email'); setError(''); }}
            className={`py-2 text-center transition flex items-center justify-center gap-1.5 cursor-pointer rounded-lg ${
              authMethod === 'email'
                ? 'bg-white shadow-sm text-slate-900 font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Mail size={15} />
            <span>Email</span>
          </button>
          <button
            type="button"
            onClick={() => { setAuthMethod('phone'); setError(''); }}
            className={`py-2 text-center transition flex items-center justify-center gap-1.5 cursor-pointer rounded-lg ${
              authMethod === 'phone'
                ? 'bg-white shadow-sm text-slate-900 font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Smartphone size={15} />
            <span>Mobile OTP</span>
          </button>
        </div>

        {/* 1. Email Registration Form */}
        {authMethod === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="name-input" 
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Your Full Name
              </label>
              <input
                id="name-input"
                type="text"
                placeholder="First and last name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-[#4f46e5] outline-none text-slate-800 text-sm transition"
              />
            </div>

            <div>
              <label 
                htmlFor="reg-email-input" 
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Email Address
              </label>
              <input
                id="reg-email-input"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-[#4f46e5] outline-none text-slate-800 text-sm transition"
              />
            </div>

            <div>
              <label 
                htmlFor="reg-password-input" 
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Password
              </label>
              <input
                id="reg-password-input"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-[#4f46e5] outline-none text-slate-800 text-sm transition"
              />
            </div>

            {/* Dynamic Vendor Fields when Seller is selected */}
            {role === 'vendor' && (
              <div className="space-y-3 p-4 bg-indigo-50/70 rounded-xl border border-indigo-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                  <Store size={15} className="text-[#4f46e5]" />
                  <span>Storefront Information</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Storefront Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UrbanCrafts, StyleHub"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    required={role === 'vendor'}
                    className="w-full px-3 py-2 text-xs text-slate-900 rounded-lg border border-slate-300 bg-white focus:border-[#4f46e5] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Catalog Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs text-slate-900 rounded-lg border border-slate-300 bg-white focus:border-[#4f46e5] outline-none"
                  >
                    {VENDOR_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#4f46e5] hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm mt-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              <span>
                {loading 
                  ? 'Creating account...' 
                  : (role === 'vendor' ? 'Register Seller Store' : 'Create MarketNest Account')}
              </span>
            </button>
          </form>
        ) : (
          /* 2. Real Mobile Phone Number + Carrier SMS OTP Registration */
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="phone-name-input" 
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Your Full Name
              </label>
              <input
                id="phone-name-input"
                type="text"
                placeholder="First and last name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-[#4f46e5] outline-none text-slate-800 text-sm transition"
              />
            </div>

            <div>
              <label 
                htmlFor="phone-reg-input" 
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Mobile Number
              </label>
              <div className="flex gap-2">
                <span className="py-3 px-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-700 font-semibold flex items-center">
                  +91
                </span>
                <input
                  id="phone-reg-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  required
                  disabled={otpSent}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-[#4f46e5] outline-none text-slate-800 text-sm transition disabled:opacity-75"
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                  className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-800 transition-colors cursor-pointer flex-shrink-0 disabled:opacity-50"
                >
                  {sendingOtp ? 'Sending...' : (otpSent ? 'Resend SMS' : 'Get SMS OTP')}
                </button>
              </div>
            </div>

            {otpSent && (
              <div>
                <label 
                  htmlFor="otp-reg-input" 
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Enter 6-Digit SMS Verification Code
                </label>
                <input
                  id="otp-reg-input"
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="6-digit code"
                  required
                  className="w-full px-4 py-3 font-mono tracking-widest text-center bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-[#4f46e5] outline-none text-slate-800 text-base font-bold transition"
                />
              </div>
            )}

            {/* Dynamic Vendor Fields */}
            {role === 'vendor' && (
              <div className="space-y-3 p-4 bg-indigo-50/70 rounded-xl border border-indigo-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                  <Store size={15} className="text-[#4f46e5]" />
                  <span>Storefront Information</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Storefront Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Electronics, Studio Luxe"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    required={role === 'vendor'}
                    className="w-full px-3 py-2 text-xs text-slate-900 rounded-lg border border-slate-300 bg-white focus:border-[#4f46e5] outline-none"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !otpSent}
              className="w-full py-3 bg-[#4f46e5] hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm mt-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              <span>{loading ? 'Creating...' : 'Verify SMS OTP & Create Account'}</span>
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative bg-white px-3 text-xs text-slate-400 font-medium">
            or continue with
          </span>
        </div>

        {/* Real Firebase Google Sign-In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-xs hover:shadow transition cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Already have an account */}
        <p className="text-xs text-slate-500 mt-6 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-[#4f46e5] hover:text-indigo-700 font-semibold hover:underline">
            Sign in
          </Link>
        </p>

        {/* Dedicated Admin Portal Link */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#4f46e5] transition-colors"
          >
            <span>Admin Portal Login</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

      </div>

    </div>
  );
}
