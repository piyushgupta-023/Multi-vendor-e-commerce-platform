import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

/**
 * ProtectedRoute component: guards child components based on authentication & RBAC allowedRoles
 * @param {Array} allowedRoles - Optional list of authorized roles e.g. ['admin', 'vendor']
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, isLoading, activeRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Verifying authorization credentials...</p>
      </div>
    );
  }

  // If not authenticated, redirect to /login preserving the requested destination
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required, check user role and activeRole
  if (allowedRoles.length > 0) {
    const userRole = (user.role || '').toLowerCase();
    const effectiveRole = (activeRole || userRole).toLowerCase();
    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());

    const hasAccess = normalizedAllowed.includes(userRole) || normalizedAllowed.includes(effectiveRole);

    if (!hasAccess) {
      return (
        <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-3xl border border-rose-100 shadow-xl shadow-rose-500/5 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Access Restricted</h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            You are logged in as <strong className="text-slate-900 capitalize">{user.role}</strong> ({user.email}), which does not have permission to view this section.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Marketplace Home
            </a>
          </div>
        </div>
      );
    }
  }

  return children;
}
