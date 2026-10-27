import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { StoreProvider, useStore } from './store/useStore';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Customer Layout & Pages
import Navbar from './components/layout/Navbar';
import CartDrawer from './components/layout/CartDrawer';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';

// Vendor Layout & Pages (Step 3 & Step 5)
import VendorLayout from './layouts/VendorLayout';
import VendorDashboardPage from './pages/vendor/VendorDashboardPage';
import VendorProductsPage from './pages/vendor/VendorProductsPage';
import VendorProductFormPage from './pages/vendor/VendorProductFormPage';
import VendorOrdersPage from './pages/vendor/VendorOrdersPage';
import VendorSettingsPage from './pages/vendor/VendorSettingsPage';

// Admin Page (Step 7)
import AdminDashboardPage from './pages/admin/AdminDashboardPage';

function Toast() {
  const { toast } = useStore();

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl bg-slate-900/95 backdrop-blur text-white border border-slate-800 text-sm font-medium tracking-wide"
        >
          {toast.type === 'success' && <CheckCircle2 className="text-emerald-400 w-5 h-5 flex-shrink-0" />}
          {toast.type === 'error' && <AlertTriangle className="text-rose-400 w-5 h-5 flex-shrink-0" />}
          {toast.type === 'info' && <Info className="text-indigo-400 w-5 h-5 flex-shrink-0" />}
          <span>{toast.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MainLayout() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isVendorPage = location.pathname.startsWith('/vendor');
  const isAdminPage = location.pathname.startsWith('/admin');
  const hideCustomerChrome = isAuthPage || isVendorPage || isAdminPage;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa] text-slate-900 font-sans antialiased selection:bg-amber-400 selection:text-slate-950">
      {!hideCustomerChrome && <Navbar />}
      
      <main className={`flex-1 ${isAuthPage ? 'flex flex-col' : ''}`}>
        <Routes>
          {/* Customer / Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Vendor Protected Routes (Vendor & Admin) */}
          <Route
            path="/vendor"
            element={
              <ProtectedRoute allowedRoles={['vendor', 'admin']}>
                <VendorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/vendor/dashboard" replace />} />
            <Route path="dashboard" element={<VendorDashboardPage />} />
            <Route path="products" element={<VendorProductsPage />} />
            <Route path="products/new" element={<VendorProductFormPage />} />
            <Route path="products/edit/:id" element={<VendorProductFormPage />} />
            <Route path="orders" element={<VendorOrdersPage />} />
            <Route path="settings" element={<VendorSettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!hideCustomerChrome && <CartDrawer />}
      {!hideCustomerChrome && <Footer />}
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <BrowserRouter>
          <MainLayout />
        </BrowserRouter>
      </StoreProvider>
    </AuthProvider>
  );
}
