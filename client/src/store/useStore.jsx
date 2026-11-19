import { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const StoreContext = createContext(null);
const PRODUCT_CACHE_KEY = 'marketnest_products';
const RECENT_PRODUCT_REQUEST_MS = 1000;

function readCachedProducts() {
  try {
    const cached = JSON.parse(localStorage.getItem(PRODUCT_CACHE_KEY) || 'null');
    return Array.isArray(cached) ? cached.filter((product) => product && typeof product === 'object') : [];
  } catch (err) {
    console.warn('Failed to read cached products:', err.message);
    return [];
  }
}

export function StoreProvider({ children }) {
  const { user, token } = useAuth();
  const [products, setProducts] = useState(readCachedProducts);
  const productsRef = useRef(products);
  const productRequestsRef = useRef(new Map());
  const latestProductPathRef = useRef(null);
  const displayedProductPathRef = useRef(null);
  const recentProductQueryRef = useRef(null);
  const [vendors, setVendors] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlist, setWishlist] = useState([]);
  const [toast, setToast] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loadingCart, setLoadingCart] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(products.length === 0);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Fetch real catalog from backend
  const fetchProducts = useCallback(async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.category && params.category !== 'All') queryParams.append('category', params.category);
    if (params.search || params.q) queryParams.append('search', params.search || params.q);
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.minPrice !== undefined && params.minPrice !== '') queryParams.append('minPrice', params.minPrice);
    if (params.maxPrice !== undefined && params.maxPrice !== '') queryParams.append('maxPrice', params.maxPrice);
    if (params.minRating !== undefined && params.minRating !== '') queryParams.append('minRating', params.minRating);
    queryParams.append('limit', params.limit || 50);

    const path = `/products?${queryParams.toString()}`;
    latestProductPathRef.current = path;
    const recentRequest = recentProductQueryRef.current;
    if (
      recentRequest?.path === path
      && displayedProductPathRef.current === path
      && Date.now() - recentRequest.completedAt < RECENT_PRODUCT_REQUEST_MS
    ) {
      return;
    }

    const pendingRequest = productRequestsRef.current.get(path);
    if (pendingRequest) return pendingRequest;

    if (!productsRef.current.length) setLoadingProducts(true);

    const isDefaultCatalog = (!params.category || params.category === 'All')
      && !(params.search || params.q)
      && !params.sort
      && [params.minPrice, params.maxPrice, params.minRating].every((value) => value === undefined || value === '')
      && (!params.limit || Number(params.limit) === 50);

    const request = (async () => {
      try {
        let res;
        for (let attempt = 0; ; attempt += 1) {
          try {
            res = await api.get(path);
            break;
          } catch (err) {
            const retryable = !err.response || err.response.status === 429 || err.response.status >= 500;
            if (!retryable || attempt >= 2) throw err;
            await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? 500 : 1200));
          }
        }

        if (!res.data?.success || !Array.isArray(res.data.data)) {
          console.warn('Product API returned an invalid catalog response.');
          return;
        }

        if (latestProductPathRef.current === path) {
          const nextProducts = res.data.data;
          productsRef.current = nextProducts;
          setProducts(nextProducts);
          displayedProductPathRef.current = path;
          recentProductQueryRef.current = { path, completedAt: Date.now() };

          if (isDefaultCatalog) {
            try {
              localStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify(nextProducts));
            } catch (err) {
              console.warn('Failed to cache products:', err.message);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load products from server:', err.message);
      } finally {
        productRequestsRef.current.delete(path);
        if (latestProductPathRef.current === path) setLoadingProducts(false);
      }
    })();

    productRequestsRef.current.set(path, request);
    return request;
  }, []);

  // Fetch real vendors from backend
  const fetchVendors = useCallback(async () => {
    try {
      const res = await api.get('/vendor/public');
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setVendors(res.data.data);
      }
    } catch {}
  }, []);

  // Fetch cart from Redis / MongoDB backend
  const fetchCart = useCallback(async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('marketnest_token');
    if (!token) {
      // Guest cart from localStorage
      try {
        const local = localStorage.getItem('marketnest_guest_cart');
        setCartItems(local ? JSON.parse(local) : []);
      } catch {
        setCartItems([]);
      }
      return;
    }

    setLoadingCart(true);
    try {
      const res = await api.get('/cart');
      if (res.data?.success && res.data.data) {
        const serverItems = Array.isArray(res.data.data.items) ? res.data.data.items : [];
        setCartItems(serverItems);
      }
    } catch (err) {
      console.warn('Failed to sync cart with server:', err.message);
    } finally {
      setLoadingCart(false);
    }
  }, []);

  // Fetch customer orders from backend
  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('marketnest_token');
    if (!token) {
      setOrders([]);
      return;
    }

    try {
      const res = await api.get('/orders/my-orders');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load orders from server:', err.message);
    }
  }, []);

  // Sync cart and orders when user authentication state changes
  useEffect(() => {
    fetchProducts();
    fetchVendors();
    fetchCart();
    if (token) {
      fetchOrders();
    } else {
      setOrders([]);
    }
  }, [token, user, fetchProducts, fetchVendors, fetchCart, fetchOrders]);

  // Add to cart wired to POST /api/cart/add
  const addToCart = async (productOrId, quantity = 1) => {
    const isObject = typeof productOrId === 'object' && productOrId !== null;
    const productId = isObject ? (productOrId._id || productOrId.id) : productOrId;
    const productName = isObject ? (productOrId.name || productOrId.title) : 'Product';

    const token = localStorage.getItem('token') || localStorage.getItem('marketnest_token');

    if (token) {
      try {
        const res = await api.post('/cart/add', { productId, quantity });
        if (res.data?.success && res.data.data?.items) {
          setCartItems(res.data.data.items);
          showToast(`Added "${productName}" to cart!`, 'success');
          return { success: true };
        }
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to add item to cart';
        showToast(msg, 'error');
        return { success: false, error: msg };
      }
    } else {
      // Local guest cart
      setCartItems((prev) => {
        const existing = prev.find((i) => (i.productId?._id || i.productId || i._id || i.id) === productId);
        let updated;
        if (existing) {
          updated = prev.map((i) =>
            (i.productId?._id || i.productId || i._id || i.id) === productId
              ? { ...i, quantity: i.quantity + quantity }
              : i
          );
        } else {
          const itemToAdd = isObject ? { ...productOrId, productId, quantity } : { productId, quantity, price: 0 };
          updated = [...prev, itemToAdd];
        }
        localStorage.setItem('marketnest_guest_cart', JSON.stringify(updated));
        return updated;
      });
      showToast(`Added "${productName}" to cart!`, 'success');
      return { success: true };
    }
  };

  // Update item quantity wired to PUT /api/cart/update
  const updateQuantity = async (productId, quantity) => {
    const token = localStorage.getItem('token') || localStorage.getItem('marketnest_token');

    if (token) {
      try {
        const res = await api.put('/cart/update', { productId, quantity });
        if (res.data?.success && res.data.data?.items) {
          setCartItems(res.data.data.items);
        }
      } catch (err) {
        showToast('Failed to update cart quantity', 'error');
      }
    } else {
      setCartItems((prev) => {
        let updated;
        if (quantity <= 0) {
          updated = prev.filter((i) => (i.productId?._id || i.productId || i._id || i.id) !== productId);
        } else {
          updated = prev.map((i) =>
            (i.productId?._id || i.productId || i._id || i.id) === productId ? { ...i, quantity } : i
          );
        }
        localStorage.setItem('marketnest_guest_cart', JSON.stringify(updated));
        return updated;
      });
    }
  };

  // Remove from cart wired to PUT /api/cart/update with quantity 0
  const removeFromCart = async (productId) => {
    await updateQuantity(productId, 0);
    showToast('Item removed from cart', 'info');
  };

  // Clear cart wired to DELETE /api/cart/clear
  const clearCart = async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('marketnest_token');
    if (token) {
      try {
        await api.delete('/cart/clear');
      } catch {}
    } else {
      localStorage.removeItem('marketnest_guest_cart');
    }
    setCartItems([]);
  };

  // Wishlist toggle
  const toggleWishlist = (productId) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      showToast(exists ? 'Removed from wishlist' : 'Added to wishlist!', 'success');
      return next;
    });
  };

  // Real-time calculations
  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + (parseFloat(item.price || item.productId?.price) || 0) * (item.quantity || 1),
    0
  );

  const addOrder = (orderData) => {
    setOrders((prev) => [orderData, ...prev]);
    clearCart();
  };

  const updateSubOrderStatusInStore = (subOrderId, newStatus) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (!order.subOrders) return order;
        const updatedSubOrders = order.subOrders.map((so) => {
          if (so._id === subOrderId) {
            const currentHistory = so.statusHistory || [];
            return {
              ...so,
              status: newStatus,
              deliveredAt: newStatus === 'delivered' ? new Date().toISOString() : so.deliveredAt,
              statusHistory: [
                ...currentHistory,
                { status: newStatus, timestamp: new Date().toISOString(), note: `Status updated to ${newStatus}` },
              ],
            };
          }
          return so;
        });
        return { ...order, subOrders: updatedSubOrders };
      })
    );
  };

  return (
    <StoreContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        cartOpen,
        setCartOpen,
        loadingCart,
        fetchCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        products,
        loadingProducts,
        fetchProducts,
        vendors,
        fetchVendors,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        wishlist,
        toggleWishlist,
        toast,
        showToast,
        orders,
        fetchOrders,
        addOrder,
        updateSubOrderStatusInStore,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
