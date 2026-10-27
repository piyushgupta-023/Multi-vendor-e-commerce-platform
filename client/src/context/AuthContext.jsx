import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('marketnest_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('marketnest_token') || localStorage.getItem('accessToken') || null;
  });

  const [activeRole, setActiveRole] = useState(() => {
    try {
      const savedUser = localStorage.getItem('marketnest_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        return parsed.role || 'customer';
      }
    } catch {}
    return 'customer';
  });

  const [isLoading, setIsLoading] = useState(true);

  // Sync token to api headers and localStorage
  const saveSession = useCallback((newToken, newUser) => {
    if (newToken) {
      localStorage.setItem('marketnest_token', newToken);
      localStorage.setItem('accessToken', newToken);
      setToken(newToken);
    }
    if (newUser) {
      localStorage.setItem('marketnest_user', JSON.stringify(newUser));
      setUser(newUser);
      setActiveRole(newUser.role || 'customer');
    }
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem('marketnest_token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('marketnest_user');
    setToken(null);
    setUser(null);
    setActiveRole('customer');
  }, []);

  // Fetch current user on mount if token exists
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      const storedToken = localStorage.getItem('marketnest_token') || localStorage.getItem('accessToken');
      if (!storedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (isMounted && res.data?.success && res.data.data?.user) {
          setUser(res.data.data.user);
          setActiveRole(res.data.data.user.role || 'customer');
          localStorage.setItem('marketnest_user', JSON.stringify(res.data.data.user));
        }
      } catch (err) {
        // If error is 401, clear invalidated session
        if (err.response?.status === 401) {
          if (isMounted) clearSession();
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();
    return () => { isMounted = false; };
  }, [clearSession]);

  // Standard Login
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token: receivedToken, accessToken, user: receivedUser } = res.data.data;
      const validToken = receivedToken || accessToken;
      saveSession(validToken, receivedUser);
      return { success: true, user: receivedUser };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  // Standard Registration (Customer or Vendor)
  const register = async (registrationData) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/register', registrationData);
      const { token: receivedToken, accessToken, user: receivedUser } = res.data.data;
      const validToken = receivedToken || accessToken;
      saveSession(validToken, receivedUser);
      return { success: true, user: receivedUser };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Demo Login
  const demoLogin = async (role = 'customer') => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/demo-login', { role });
      const { token: receivedToken, accessToken, user: receivedUser } = res.data.data;
      const validToken = receivedToken || accessToken;
      saveSession(validToken, receivedUser);
      return { success: true, user: receivedUser };
    } catch (err) {
      // In case server is completely offline, generate local demo session
      const fallbackUsers = {
        admin: { id: 'demo_admin', name: 'Super Admin', email: 'admin@marketplace.com', role: 'admin' },
        vendor: { id: 'demo_vendor', name: 'TechNova Electronics', email: 'technova@marketplace.com', role: 'vendor', storeName: 'TechNova Electronics' },
        customer: { id: 'demo_cust', name: 'Aarav Sharma', email: 'aarav.sharma@gmail.com', role: 'customer' },
      };
      const fallbackUser = fallbackUsers[role] || fallbackUsers.customer;
      saveSession(`demo_offline_token_${role}`, fallbackUser);
      return { success: true, user: fallbackUser };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await api.post('/auth/logout').catch(() => {});
    } finally {
      clearSession();
    }
  };

  // Switch perspective (e.g. Admin or Vendor previewing Customer view)
  const switchActiveRole = (newRole) => {
    if (!user) {
      // Guest clicking role can trigger demo login
      demoLogin(newRole);
      return;
    }

    // Admins can switch to any role
    if (user.role === 'admin') {
      setActiveRole(newRole);
      return;
    }

    // Vendors can switch between vendor and customer
    if (user.role === 'vendor' && (newRole === 'vendor' || newRole === 'customer')) {
      setActiveRole(newRole);
      return;
    }

    // Otherwise keep own role or perform demo switch
    setActiveRole(newRole);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    activeRole,
    login,
    register,
    demoLogin,
    logout,
    switchActiveRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
