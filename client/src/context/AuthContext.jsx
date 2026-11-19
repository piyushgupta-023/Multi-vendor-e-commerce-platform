import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const getAuthErrorMessage = (error, fallback) => {
  if (!error.response) {
    return 'Cannot reach the MarketNest server. Start the app from the project folder with `npm run dev`, then try again.';
  }

  return error.response.data?.message || fallback;
};

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
    return localStorage.getItem('token') || localStorage.getItem('marketnest_token') || localStorage.getItem('accessToken') || null;
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

  // Sync token to localStorage and state
  const saveSession = useCallback((newToken, newUser) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
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
    localStorage.removeItem('token');
    localStorage.removeItem('marketnest_token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('marketnest_user');
    setToken(null);
    setUser(null);
    setActiveRole('customer');
  }, []);

  // On initial app load, validate existing session via GET /api/auth/me
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token') || localStorage.getItem('marketnest_token') || localStorage.getItem('accessToken');
      if (!storedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (isMounted && res.data?.success) {
          const fetchedUser = res.data.data?.user || res.data.data;
          setUser(fetchedUser);
          setActiveRole(fetchedUser.role || 'customer');
          localStorage.setItem('marketnest_user', JSON.stringify(fetchedUser));
        } else {
          if (isMounted) clearSession();
        }
      } catch (err) {
        if (isMounted && (err.response?.status === 401 || err.response?.status === 403)) {
          clearSession();
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();
    return () => { isMounted = false; };
  }, [clearSession]);

  // Real login API call
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token: receivedToken, accessToken, user: receivedUser } = res.data.data;
      const validToken = receivedToken || accessToken;
      saveSession(validToken, receivedUser);
      return { success: true, user: receivedUser, token: validToken };
    } catch (err) {
      const message = getAuthErrorMessage(err, 'Invalid credentials');
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  // Real register API call (customer or vendor)
  const register = async (registrationData) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/register', registrationData);
      const { token: receivedToken, accessToken, user: receivedUser } = res.data.data;
      const validToken = receivedToken || accessToken;
      saveSession(validToken, receivedUser);
      return { success: true, user: receivedUser, token: validToken };
    } catch (err) {
      const message = getAuthErrorMessage(err, 'Registration failed');
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  // Firebase Authentication (Google Popup & Physical SMS OTP)
  const firebaseLogin = async (firebaseData) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/firebase', firebaseData);
      const { token: receivedToken, accessToken, user: receivedUser } = res.data.data;
      const validToken = receivedToken || accessToken;
      saveSession(validToken, receivedUser);
      return { success: true, user: receivedUser, token: validToken };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Firebase authentication failed';
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  // Google Auth
  const googleLogin = async (googleData) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/google', googleData);
      const { token: receivedToken, accessToken, user: receivedUser } = res.data.data;
      const validToken = receivedToken || accessToken;
      saveSession(validToken, receivedUser);
      return { success: true, user: receivedUser, token: validToken };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Google sign-in failed';
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  // Phone OTP send
  const sendPhoneOtp = async (phone) => {
    try {
      const res = await api.post('/auth/phone/send-otp', { phone });
      return { success: true, data: res.data?.data, message: res.data?.message };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to send OTP';
      return { success: false, error: message };
    }
  };

  // Phone OTP verify / Firebase Phone Auth
  const verifyPhoneOtp = async (payloadOrPhone, otp, name) => {
    setIsLoading(true);
    try {
      const payload = typeof payloadOrPhone === 'object' 
        ? payloadOrPhone 
        : { phone: payloadOrPhone, otp, name };
      const res = await api.post('/auth/phone/verify', payload);
      const { token: receivedToken, accessToken, user: receivedUser } = res.data.data;
      const validToken = receivedToken || accessToken;
      saveSession(validToken, receivedUser);
      return { success: true, user: receivedUser, token: validToken };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Phone authentication failed';
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Demo Login hitting real backend MongoDB endpoint
  const demoLogin = async (role = 'customer') => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/demo-login', { role });
      const { token: receivedToken, accessToken, user: receivedUser } = res.data.data;
      const validToken = receivedToken || accessToken;
      saveSession(validToken, receivedUser);
      return { success: true, user: receivedUser, token: validToken };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Demo login failed';
      return { success: false, error: message };
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

  // Switch perspective for admin or vendor previewing customer view
  const switchActiveRole = (newRole) => {
    if (!user) return;
    if (user.role === 'admin') {
      setActiveRole(newRole);
      return;
    }
    if (user.role === 'vendor' && (newRole === 'vendor' || newRole === 'customer')) {
      setActiveRole(newRole);
      return;
    }
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
    firebaseLogin,
    googleLogin,
    sendPhoneOtp,
    verifyPhoneOtp,
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
