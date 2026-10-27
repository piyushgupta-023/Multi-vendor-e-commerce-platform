import { useState, useEffect, createContext, useContext } from 'react';

const StoreContext = createContext(null);

// Mock products for demo
const mockProducts = [
  { _id: '1', name: 'Apple iPhone 15 Pro Max', price: 134900, comparePrice: 159900, category: 'Electronics', images: [{ url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80', isPrimary: true }], ratings: { average: 4.8, count: 234 }, isFeatured: true, vendorProfileId: { storeName: 'TechNova Electronics', logo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=100' }, vendorId: 'v1', stock: 45 },
  { _id: '2', name: 'Sony WH-1000XM5 Headphones', price: 29990, comparePrice: 34990, category: 'Electronics', images: [{ url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80', isPrimary: true }], ratings: { average: 4.7, count: 189 }, isFeatured: true, vendorProfileId: { storeName: 'TechNova Electronics', logo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=100' }, vendorId: 'v1', stock: 85 },
  { _id: '3', name: 'Men\'s Premium Tailored Blazer', price: 4999, comparePrice: 8999, category: 'Fashion', images: [{ url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80', isPrimary: true }], ratings: { average: 4.5, count: 128 }, isFeatured: true, vendorProfileId: { storeName: 'StyleForward Fashion', logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100' }, vendorId: 'v2', stock: 120 },
  { _id: '4', name: 'Vitamin C Brightening Serum', price: 1299, comparePrice: 1999, category: 'Beauty & Personal Care', images: [{ url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80', isPrimary: true }], ratings: { average: 4.9, count: 456 }, isFeatured: true, vendorProfileId: { storeName: 'BeautyBloom Cosmetics', logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100' }, vendorId: 'v6', stock: 300 },
  { _id: '5', name: 'Scandinavian Minimalist Coffee Table', price: 15999, comparePrice: 24999, category: 'Home & Living', images: [{ url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600&auto=format&fit=crop&q=80', isPrimary: true }], ratings: { average: 4.6, count: 89 }, isFeatured: false, vendorProfileId: { storeName: 'HomeBliss Living', logo: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=100' }, vendorId: 'v3', stock: 25 },
  { _id: '6', name: 'Adjustable Dumbbell Set 2-24kg', price: 14999, comparePrice: 22999, category: 'Sports & Fitness', images: [{ url: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&auto=format&fit=crop&q=80', isPrimary: true }], ratings: { average: 4.7, count: 312 }, isFeatured: true, vendorProfileId: { storeName: 'FitLife Sports', logo: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=100' }, vendorId: 'v4', stock: 40 },
  { _id: '7', name: 'MacBook Air M3 13.6"', price: 114900, comparePrice: 134900, category: 'Electronics', images: [{ url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80', isPrimary: true }], ratings: { average: 4.9, count: 567 }, isFeatured: true, vendorProfileId: { storeName: 'TechNova Electronics', logo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=100' }, vendorId: 'v1', stock: 20 },
  { _id: '8', name: 'Luxury Royal Oud Perfume Collection', price: 2999, comparePrice: 4999, category: 'Beauty & Personal Care', images: [{ url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&auto=format&fit=crop&q=80', isPrimary: true }], ratings: { average: 4.8, count: 234 }, isFeatured: true, vendorProfileId: { storeName: 'BeautyBloom Cosmetics', logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100' }, vendorId: 'v6', stock: 90 },
  { _id: '9', name: 'Eco-Friendly High Density Yoga Mat', price: 1499, comparePrice: 2499, category: 'Sports & Fitness', images: [{ url: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&auto=format&fit=crop&q=80', isPrimary: true }], ratings: { average: 4.6, count: 178 }, isFeatured: false, vendorProfileId: { storeName: 'FitLife Sports', logo: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=100' }, vendorId: 'v4', stock: 200 },
  { _id: '10', name: 'Artisan Cheese & Gourmet Hamper', price: 3499, comparePrice: 4999, category: 'Food & Gourmet', images: [{ url: 'https://images.unsplash.com/photo-1631379578550-7038263db699?w=600&auto=format&fit=crop&q=80', isPrimary: true }], ratings: { average: 4.4, count: 67 }, isFeatured: true, vendorProfileId: { storeName: 'GourmetKart Foods', logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100' }, vendorId: 'v5', stock: 35 },
];

const mockVendors = [
  { _id: 'v1', storeName: 'TechNova Electronics', storeDescription: 'Next-generation gadgets, audio gear & smart computing', logo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=200&auto=format&fit=crop&q=80', rating: 4.8, totalSales: 1250, category: 'Electronics', isApproved: true },
  { _id: 'v2', storeName: 'StyleForward Fashion', storeDescription: 'Curated contemporary apparel & designer streetwear', logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&auto=format&fit=crop&q=80', rating: 4.5, totalSales: 3400, category: 'Fashion', isApproved: true },
  { _id: 'v3', storeName: 'HomeBliss Living', storeDescription: 'Scandinavian & Japandi artisanal furniture & décor', logo: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=200&auto=format&fit=crop&q=80', rating: 4.6, totalSales: 890, category: 'Home & Living', isApproved: true },
  { _id: 'v4', storeName: 'FitLife Sports', storeDescription: 'Pro-grade athletic gear, weights and recovery essentials', logo: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200&auto=format&fit=crop&q=80', rating: 4.7, totalSales: 2100, category: 'Sports & Fitness', isApproved: true },
  { _id: 'v5', storeName: 'GourmetKart Foods', storeDescription: 'Farm-direct organics, artisanal cheeses & charcuterie', logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80', rating: 4.4, totalSales: 5600, category: 'Food & Gourmet', isApproved: true },
  { _id: 'v6', storeName: 'BeautyBloom Cosmetics', storeDescription: 'Clean beauty, luxury fragrances & clinical skincare', logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&auto=format&fit=crop&q=80', rating: 4.9, totalSales: 7800, category: 'Beauty & Personal Care', isApproved: true },
];

const initialMockOrders = [
  {
    _id: 'ord_1001',
    orderNumber: 'ORD-20261028-1001',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    totalAmount: 34989,
    subtotal: 34989,
    shippingCharge: 0,
    paymentMethod: 'razorpay',
    paymentStatus: 'paid',
    shippingAddress: {
      name: 'John Doe',
      street: '42 Palm Avenue, Silver Heights, Apt 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      phone: '+91 98200 12345',
    },
    subOrders: [
      {
        _id: 'sub_101',
        vendorId: 'v1',
        vendorStoreName: 'TechNova Electronics',
        subtotal: 29990,
        status: 'shipped',
        trackingNumber: 'MN-EXP-8842',
        courierPartner: 'MarketNest Prime Express',
        estimatedDelivery: 'Oct 30, 2026',
        items: [
          {
            name: 'Sony WH-1000XM5 Headphones',
            image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80',
            price: 29990,
            quantity: 1,
            subtotal: 29990,
          }
        ],
        statusHistory: [
          { status: 'placed', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), note: 'Order placed by customer' },
          { status: 'packed', timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(), note: 'Parcel packed and barcoded' },
          { status: 'shipped', timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString(), note: 'Handed over to courier facility' },
        ]
      },
      {
        _id: 'sub_102',
        vendorId: 'v2',
        vendorStoreName: 'StyleForward Fashion',
        subtotal: 4999,
        status: 'packed',
        trackingNumber: 'MN-EXP-2319',
        courierPartner: 'MarketNest Surface Air',
        estimatedDelivery: 'Oct 31, 2026',
        items: [
          {
            name: 'Men\'s Premium Tailored Blazer',
            image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
            price: 4999,
            quantity: 1,
            subtotal: 4999,
          }
        ],
        statusHistory: [
          { status: 'placed', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), note: 'Order placed by customer' },
          { status: 'packed', timestamp: new Date(Date.now() - 3600000 * 1).toISOString(), note: 'Item tailored and quality checked' },
        ]
      }
    ]
  },
  {
    _id: 'ord_1002',
    orderNumber: 'ORD-20261027-0922',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    totalAmount: 15999,
    subtotal: 15999,
    shippingCharge: 0,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    shippingAddress: {
      name: 'John Doe',
      street: '42 Palm Avenue, Silver Heights, Apt 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      phone: '+91 98200 12345',
    },
    subOrders: [
      {
        _id: 'sub_103',
        vendorId: 'v3',
        vendorStoreName: 'HomeBliss Living',
        subtotal: 15999,
        status: 'delivered',
        trackingNumber: 'MN-EXP-7710',
        courierPartner: 'MarketNest Heavy Logistics',
        estimatedDelivery: 'Delivered',
        deliveredAt: new Date(Date.now() - 86400000).toISOString(),
        items: [
          {
            name: 'Scandinavian Minimalist Coffee Table',
            image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600&auto=format&fit=crop&q=80',
            price: 15999,
            quantity: 1,
            subtotal: 15999,
          }
        ],
        statusHistory: [
          { status: 'placed', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), note: 'Order placed by customer' },
          { status: 'packed', timestamp: new Date(Date.now() - 86400000 * 1.8).toISOString(), note: 'Teak wood assembled & boxed' },
          { status: 'shipped', timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(), note: 'In transit via freight' },
          { status: 'delivered', timestamp: new Date(Date.now() - 86400000).toISOString(), note: 'Successfully delivered to customer' },
        ]
      }
    ]
  }
];

export function StoreProvider({ children }) {
  const [products, setProducts] = useState(mockProducts);
  const [cartItems, setCartItems] = useState([
    { ...mockProducts[0], quantity: 1 },
    { ...mockProducts[1], quantity: 1 }
  ]);
  const [cartOpen, setCartOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('customer'); // customer | vendor | admin
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlist, setWishlist] = useState(['1', '4']);
  const [toast, setToast] = useState(null);
  const [orders, setOrders] = useState(initialMockOrders);

  // Sync products with backend on load
  useEffect(() => {
    let isMounted = true;
    const fetchCatalog = async () => {
      try {
        const res = await fetch('/api/products?limit=30');
        const data = await res.json();
        if (isMounted && data?.success && Array.isArray(data.data) && data.data.length > 0) {
          setProducts(prev => {
            const fetched = data.data;
            const fetchedIds = new Set(fetched.map(p => p._id || p.id));
            const remaining = prev.filter(p => !fetchedIds.has(p._id || p.id));
            return [...fetched, ...remaining];
          });
        }
      } catch {
        // Fallback to initial mock products
      }
    };
    fetchCatalog();
    return () => { isMounted = false; };
  }, []);

  // Fetch user orders from backend if token present
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders/my-orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data?.success && Array.isArray(data.data) && data.data.length > 0) {
          setOrders(prev => {
            const fetched = data.data;
            const fetchedIds = new Set(fetched.map(o => o._id || o.orderNumber));
            const remaining = prev.filter(o => !fetchedIds.has(o._id || o.orderNumber));
            return [...fetched, ...remaining];
          });
        }
      } catch {
        // Retain initial mock orders
      }
    };
    fetchOrders();
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addProductToStore = (newProduct) => {
    const formatted = {
      ...newProduct,
      _id: newProduct._id || newProduct.id || `prod_${Date.now()}`,
      name: newProduct.name || newProduct.title,
      title: newProduct.name || newProduct.title,
      price: parseFloat(newProduct.price),
      comparePrice: newProduct.comparePrice ? parseFloat(newProduct.comparePrice) : (newProduct.discountPrice ? parseFloat(newProduct.discountPrice) : undefined),
      images: Array.isArray(newProduct.images) ? newProduct.images : [{ url: newProduct.images || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80', isPrimary: true }],
      ratings: newProduct.ratings || { average: 5.0, count: 1 },
      isFeatured: newProduct.isFeatured !== undefined ? newProduct.isFeatured : true,
      stock: newProduct.stock !== undefined ? parseInt(newProduct.stock, 10) : 50,
      vendorProfileId: newProduct.vendorProfileId || { storeName: 'TechNova Electronics' },
      vendorId: newProduct.vendorId || 'v1',
    };
    setProducts(prev => [formatted, ...prev.filter(p => (p._id || p.id) !== formatted._id)]);
  };

  const updateProductInStore = (updatedProduct) => {
    const id = updatedProduct._id || updatedProduct.id;
    setProducts(prev => prev.map(p => {
      if ((p._id || p.id) === id) {
        return {
          ...p,
          ...updatedProduct,
          name: updatedProduct.name || updatedProduct.title || p.name,
          title: updatedProduct.name || updatedProduct.title || p.title,
          price: updatedProduct.price !== undefined ? parseFloat(updatedProduct.price) : p.price,
          comparePrice: updatedProduct.comparePrice !== undefined ? parseFloat(updatedProduct.comparePrice) : p.comparePrice,
        };
      }
      return p;
    }));
  };

  const deleteProductFromStore = (productId) => {
    setProducts(prev => prev.filter(p => (p._id || p.id) !== productId));
  };

  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (item.quantity || 1), 0);

  const addToCart = (product) => {
    const pId = product._id || product.id;
    setCartItems(prev => {
      const existing = prev.find(i => (i._id || i.id) === pId);
      if (existing) {
        return prev.map(i => (i._id || i.id) === pId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    showToast(`Added "${product.name || product.title}" to cart!`, 'success');
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(i => (i._id || i.id) !== productId));
    showToast('Item removed from cart', 'info');
  };

  const updateQuantity = (productId, qty) => {
    if (qty <= 0) return removeFromCart(productId);
    setCartItems(prev => prev.map(i => (i._id || i.id) === productId ? { ...i, quantity: qty } : i));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const toggleWishlist = (productId) => {
    setWishlist(prev => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter(id => id !== productId) : [...prev, productId];
      showToast(exists ? 'Removed from wishlist' : 'Added to wishlist!', 'success');
      return next;
    });
  };

  const addOrder = (orderData) => {
    setOrders(prev => [orderData, ...prev]);
    clearCart();
  };

  const updateSubOrderStatusInStore = (subOrderId, newStatus) => {
    setOrders(prev => prev.map(order => {
      if (!order.subOrders) return order;
      const updatedSubOrders = order.subOrders.map(so => {
        if (so._id === subOrderId) {
          const currentHistory = so.statusHistory || [];
          return {
            ...so,
            status: newStatus,
            deliveredAt: newStatus === 'delivered' ? new Date().toISOString() : so.deliveredAt,
            statusHistory: [
              ...currentHistory,
              { status: newStatus, timestamp: new Date().toISOString(), note: `Status updated to ${newStatus}` }
            ]
          };
        }
        return so;
      });
      return { ...order, subOrders: updatedSubOrders };
    }));
  };

  return (
    <StoreContext.Provider value={{
      cartItems, cartCount, cartTotal, cartOpen, setCartOpen,
      addToCart, removeFromCart, updateQuantity, clearCart,
      user, setUser, role, setRole,
      products, mockProducts: products, mockVendors,
      addProductToStore, updateProductInStore, deleteProductFromStore,
      selectedCategory, setSelectedCategory,
      searchQuery, setSearchQuery,
      wishlist, toggleWishlist,
      toast, showToast,
      orders, addOrder, updateSubOrderStatusInStore,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
