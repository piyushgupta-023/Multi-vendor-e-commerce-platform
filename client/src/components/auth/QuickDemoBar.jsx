import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Store, Shield, RefreshCw, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';

export default function QuickDemoBar({ destination = '/' }) {
  const { demoLogin } = useAuth();
  const { showToast } = useStore();
  const navigate = useNavigate();
  const [loadingRole, setLoadingRole] = useState(null);

  const demoRoles = [
    {
      id: 'customer',
      label: 'Buyer',
      name: 'Aarav Sharma',
      icon: User,
    },
    {
      id: 'vendor',
      label: 'Merchant',
      name: 'TechNova',
      icon: Store,
    },
    {
      id: 'admin',
      label: 'Admin',
      name: 'Super Admin',
      icon: Shield,
    },
  ];

  const handleDemoClick = async (roleId) => {
    setLoadingRole(roleId);
    try {
      const res = await demoLogin(roleId);
      if (res.success) {
        showToast?.(`Authenticated as ${roleId === 'vendor' ? 'Merchant' : roleId === 'admin' ? 'Admin' : 'Buyer'}`, 'success');
        if (roleId === 'vendor') {
          navigate('/vendor/dashboard', { replace: true });
        } else {
          navigate(destination, { replace: true });
        }
      } else {
        showToast?.(res.error || 'Demo login failed.', 'error');
      }
    } catch (err) {
      showToast?.('Demo login unavailable in current mode', 'error');
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 my-5">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <KeyRound size={13} className="text-slate-400" />
          <span>Quick Demo Access</span>
        </span>
        <span className="text-[10px] text-slate-500 font-medium">
          Instant session
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {demoRoles.map((role) => {
          const Icon = role.icon;
          const isLoading = loadingRole === role.id;

          return (
            <button
              key={role.id}
              type="button"
              disabled={loadingRole !== null}
              onClick={() => handleDemoClick(role.id)}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-white border border-slate-200/90 hover:border-slate-400 hover:bg-slate-50 transition-all cursor-pointer shadow-xs disabled:opacity-50 text-center"
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                {isLoading ? (
                  <RefreshCw size={12} className="animate-spin text-indigo-600" />
                ) : (
                  <Icon size={13} className="text-slate-600" />
                )}
                <span className="text-xs font-semibold text-slate-900">
                  {role.label}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 truncate max-w-[80px]">
                {role.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
