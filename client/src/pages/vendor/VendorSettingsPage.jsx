import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Store, 
  UploadCloud, 
  Check, 
  ShieldCheck, 
  RefreshCw, 
  Building2, 
  Phone, 
  Mail, 
  CreditCard, 
  Sparkles, 
  ExternalLink,
  Save
} from 'lucide-react';
import api from '../../api/axios';
import { useStore } from '../../store/useStore';
import { useAuth } from '../../context/AuthContext';

export default function VendorSettingsPage() {
  const { user } = useAuth();
  const { showToast } = useStore();

  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [formData, setFormData] = useState({
    storeName: '',
    storeSlug: '',
    bio: '',
    category: 'Electronics',
    logo: '',
    banner: '',
    phone: '',
    email: '',
    gstNumber: '',
    payoutSchedule: 'weekly',
    bankDetails: {
      accountNumber: '',
      ifsc: '',
      accountHolder: '',
      upiId: '',
    }
  });

  // Fetch Vendor Profile
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const res = await api.get('/vendor/profile');
        if (isMounted && res.data?.success) {
          const p = res.data.data?.profile || res.data.data;
          setFormData({
            storeName: p.storeName || user?.storeName || '',
            storeSlug: p.storeSlug || '',
            bio: p.bio || p.storeDescription || '',
            category: p.category || 'Electronics',
            logo: p.logo || '',
            banner: p.banner || '',
            phone: p.phone || '',
            email: p.email || user?.email || '',
            gstNumber: p.gstNumber || '',
            payoutSchedule: p.payoutSchedule || 'weekly',
            bankDetails: {
              accountNumber: p.bankDetails?.accountNumber || '',
              ifsc: p.bankDetails?.ifsc || '',
              accountHolder: p.bankDetails?.accountHolder || '',
              upiId: p.bankDetails?.upiId || '',
            }
          });
        }
      } catch (err) {
        console.error('Failed to load vendor settings:', err);
        showToast?.('Loaded settings in resilient mode', 'info');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => { isMounted = false; };
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('bank_')) {
      const field = name.replace('bank_', '');
      setFormData(prev => ({
        ...prev,
        bankDetails: { ...prev.bankDetails, [field]: value }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        ...(name === 'storeName' ? { storeSlug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') } : {})
      }));
    }
  };

  // Upload handler for Logo or Banner
  const handleUploadImage = async (file, type) => {
    if (!file) return;

    if (type === 'logo') setUploadingLogo(true);
    if (type === 'banner') setUploadingBanner(true);

    const uploadData = new FormData();
    uploadData.append('images', file);
    uploadData.append('folder', 'vendor');

    try {
      const res = await api.post('/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success && res.data.data?.urls?.[0]) {
        const uploadedUrl = res.data.data.urls[0];
        setFormData(prev => ({ ...prev, [type]: uploadedUrl }));
        showToast?.(`${type === 'logo' ? 'Logo' : 'Banner'} uploaded successfully!`, 'success');
      }
    } catch (err) {
      showToast?.(err.response?.data?.message || err.message || 'Upload failed', 'error');
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      if (type === 'banner') setUploadingBanner(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await api.put('/vendor/profile', {
        storeName: formData.storeName,
        storeSlug: formData.storeSlug,
        bio: formData.bio,
        storeDescription: formData.bio,
        category: formData.category,
        logo: formData.logo,
        banner: formData.banner,
        phone: formData.phone,
        gstNumber: formData.gstNumber,
        payoutSchedule: formData.payoutSchedule,
        bankDetails: formData.bankDetails,
      });

      if (res.data?.success) {
        showToast?.('Storefront settings updated successfully!', 'success');
      } else {
        throw new Error(res.data?.message || 'Update failed');
      }
    } catch (err) {
      showToast?.(err.response?.data?.message || err.message || 'Failed to update store settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw size={28} className="animate-spin text-indigo-500" />
        <p className="text-xs">Loading store settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Settings className="text-indigo-400 w-6 h-6" />
            Storefront Settings
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure your merchant branding, KYC verification details, contact lines, and split payout schedules.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <>
              <RefreshCw size={14} className="animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save size={15} /> Save Changes
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: BRANDING & STOREFRONT IDENTITY */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Store size={18} className="text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Storefront Identity</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Official Store Name
              </label>
              <input
                type="text"
                name="storeName"
                value={formData.storeName}
                onChange={handleChange}
                placeholder="TechNova Electronics"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Store URL Slug
              </label>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-400">
                <span>marketnest.com/store/</span>
                <input
                  type="text"
                  name="storeSlug"
                  value={formData.storeSlug}
                  onChange={handleChange}
                  placeholder="technova-electronics"
                  className="bg-transparent text-white font-mono focus:outline-none ml-1 w-full"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Store Bio & Mission Statement
            </label>
            <textarea
              rows={3}
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Authorized distributor of premium electronics, direct brand warranties, and express customer fulfillment."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Media: Logo & Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Logo */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Store Logo / Brandmark</label>
              <div className="flex items-center gap-4">
                <img
                  src={formData.logo || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=120&h=120&fit=crop&q=80'}
                  alt="Store Logo"
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/40 bg-slate-950 flex-shrink-0"
                />
                <div className="space-y-2 flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    ref={logoInputRef}
                    onChange={(e) => handleUploadImage(e.target.files?.[0], 'logo')}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
                  >
                    <UploadCloud size={14} />
                    <span>{uploadingLogo ? 'Uploading...' : 'Upload Logo'}</span>
                  </button>
                  <input
                    type="url"
                    name="logo"
                    placeholder="Or paste Logo URL"
                    value={formData.logo}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* Banner */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Storefront Banner</label>
              <div className="flex items-center gap-4">
                <img
                  src={formData.banner || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=100&fit=crop&q=80'}
                  alt="Store Banner"
                  className="w-24 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/40 bg-slate-950 flex-shrink-0"
                />
                <div className="space-y-2 flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    ref={bannerInputRef}
                    onChange={(e) => handleUploadImage(e.target.files?.[0], 'banner')}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={uploadingBanner}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
                  >
                    <UploadCloud size={14} />
                    <span>{uploadingBanner ? 'Uploading...' : 'Upload Banner'}</span>
                  </button>
                  <input
                    type="url"
                    name="banner"
                    placeholder="Or paste Banner URL"
                    value={formData.banner}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-300"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: COMPLIANCE & CONTACT */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Building2 size={18} className="text-violet-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Business & Tax Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                GSTIN / Tax ID
              </label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
                placeholder="29AAAAA0000A1Z5"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Customer Support Phone
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Store Support Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="support@technova.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: PAYOUTS & BANKING (Step 5 / Step 6 Foundation) */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <CreditCard size={18} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Settlement & Payout Preferences</h3>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 font-mono">
              Razorpay / Stripe Route Connected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Payout Cadence
              </label>
              <select
                name="payoutSchedule"
                value={formData.payoutSchedule}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="weekly" className="bg-slate-900">Weekly (Every Monday)</option>
                <option value="biweekly" className="bg-slate-900">Bi-Weekly (1st and 15th)</option>
                <option value="monthly" className="bg-slate-900">Monthly (End of month)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Direct UPI ID for Instant Settlement
              </label>
              <input
                type="text"
                name="bank_upiId"
                value={formData.bankDetails.upiId}
                onChange={handleChange}
                placeholder="technova@okhdfcbank"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Bank Account Number
              </label>
              <input
                type="text"
                name="bank_accountNumber"
                value={formData.bankDetails.accountNumber}
                onChange={handleChange}
                placeholder="50200012345678"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                IFSC Code
              </label>
              <input
                type="text"
                name="bank_ifsc"
                value={formData.bankDetails.ifsc}
                onChange={handleChange}
                placeholder="HDFC0001234"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Account Holder Name
              </label>
              <input
                type="text"
                name="bank_accountHolder"
                value={formData.bankDetails.accountHolder}
                onChange={handleChange}
                placeholder="TechNova Private Limited"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Bottom Save Action */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Saving Changes...
              </>
            ) : (
              <>
                <Check size={16} /> Save Storefront Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
