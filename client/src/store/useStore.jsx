import { useState, useEffect, createContext, useContext } from 'react';

const StoreContext = createContext(null);

// Mock data for demo when backend isn't running
const mockProducts = [
  { _id: '1', name: 'Apple iPhone 15 Pro Max', price: 134900, comparePrice: 159900, category: 'Electronics', images: [{ url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80', isPrimary: true }], ratings: { average: 4.8, count: 234 }, isFeatured: true, vendorProfileId: { storeName: 'TechNova Electronics' }, stock: 45 },
  { _id: '2', name: 'Sony WH-1000XM5 Headphones', price: 29990, comparePrice: 34990, category: 'Electronics', images: [{ url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80', isPrimary: true }], ratings: { average: 4.7, count: 189 }, isFeatured: true, vendorProfileId: { storeName: 'TechNova Electronics' }, stock: 85 },
  { _id: '3', name: 'Men\'s Premium Tailored Blazer', price: 4999, comparePrice: 8999, category: 'Fashion', images: [{ url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80', isPrimary: true }], ratings: { average: 4.5, count: 128 }, isFeatured: true, vendorProfileId: { storeName: 'StyleForward Fashion' }, stock: 120 },
  { _id: '4', name: 'Vitamin C Brightening Serum', price: 1299, comparePrice: 1999, category: 'Beauty & Personal Care', images: [{ url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80', isPrimary: true }], ratings: { average: 4.9, count: 456 }, isFeatured: true, vendorProfileId: { storeName: 'BeautyBloom Cosmetics' }, stock: 300 },
  { _id: '5', name: 'Scandinavian Minimalist Coffee Table', price: 15999, comparePrice: 24999, category: 'Home & Living', images: [{ url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600&auto=format&fit=crop&q=80', isPrimary: true }], ratings: { average: 4.6, count: 89 }, isFeatured: false, vendorProfileId: { storeName: 'HomeBliss Furniture' }, stock: 25 },
  { _id: '6', name: 'Adjustable Dumbbell Set 2-24kg', price: 14999, comparePrice: 22999, category: 'Sports & Fitness', images: [{ url: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&auto=format&fit=crop&q=80', isPrimary: true }], ratings: { average: 4.7, count: 312 }, isFeatured: true, vendorProfileId: { storeName: 'FitLife Sports' }, stock: 40 },
  { _id: '7', name: 'MacBook Air M3 13.6"', price: 114900, comparePrice: 134900, category: 'Electronics', images: [{ url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80', isPrimary: true }], ratings: { average: 4.9, count: 567 }, isFeatured: true, vendorProfileId: { storeName: 'TechNova Electronics' }, stock: 20 },
  { _id: '8', name: 'Luxury Royal Oud Perfume Collection', price: 2999, comparePrice: 4999, category: 'Beauty & Personal Care', images: [{ url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&auto=format&fit=crop&q=80', isPrimary: true }], ratings: { average: 4.8, count: 234 }, isFeatured: true, vendorProfileId: { storeName: 'BeautyBloom Cosmetics' }, stock: 90 },
  { _id: '9', name: 'Eco-Friendly High Density Yoga Mat', price: 1499, comparePrice: 2499, category: 'Sports & Fitness', images: [{ url: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&auto=format&fit=crop&q=80', isPrimary: true }], ratings: { average: 4.6, count: 178 }, isFeatured: false, vendorProfileId: { storeName: 'FitLife Sports' }, stock: 200 },
  { _id: '10', name: 'Artisan Cheese & Gourmet Hamper', price: 3499, comparePrice: 4999, category: 'Food & Gourmet', images: [{ url: 'https://images.unsplash.com/photo-1631379578550-7038263db699?w=600&auto=format&fit=crop&q=80', isPrimary: true }], ratings: { average: 4.4, count: 67 }, isFeatured: true, vendorProfileId: { storeName: 'GourmetKart Foods' }, stock: 35 },
  { _id: '11', name: 'Samsung Galaxy S24 Ultra 512GB', price: 129999, comparePrice: 149999, category: 'Electronics', images: [{ url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80', isPrimary: true }], ratings: { average: 4.7, count: 445 }, isFeatured: false, vendorProfileId: { storeName: 'TechNova Electronics' }, stock: 30 },
  { _id: '12', name: 'Organic Moroccan Argan Oil Kit', price: 1799, comparePrice: 2999, category: 'Beauty & Personal Care', images: [{ url: 'https://images.unsplash.com/photo-1608248597359-bb436d5952d7?w=600&auto=format&fit=crop&q=80', isPrimary: true }], ratings: { average: 4.7, count: 289 }, isFeatured: false, vendorProfileId: { storeName: 'BeautyBloom Cosmetics' }, stock: 180 },
];

const mockVendors = [
  { _id: 'v1', storeName: 'TechNova Electronics', storeDescription: 'Next-generation gadgets, audio gear & smart computing', logo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=200&auto=format&fit=crop&q=80', rating: 4.8, totalSales: 1250, category: 'Electronics', isApproved: true },
  { _id: 'v2', storeName: 'StyleForward Fashion', storeDescription: 'Curated contemporary apparel & designer streetwear', logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&auto=format&fit=crop&q=80', rating: 4.5, totalSales: 3400, category: 'Fashion', isApproved: true },
  { _id: 'v3', storeName: 'HomeBliss Living', storeDescription: 'Scandinavian & Japandi artisanal furniture & décor', logo: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=200&auto=format&fit=crop&q=80', rating: 4.6, totalSales: 890, category: 'Home & Living', isApproved: true },
  { _id: 'v4', storeName: 'FitLife Sports', storeDescription: 'Pro-grade athletic gear, weights and recovery essentials', logo: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200&auto=format&fit=crop&q=80', rating: 4.7, totalSales: 2100, category: 'Sports & Fitness', isApproved: true },
  { _id: 'v5', storeName: 'GourmetKart Foods', storeDescription: 'Farm-direct organics, artisanal cheeses & charcuterie', logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80', rating: 4.4, totalSales: 5600, category: 'Food & Gourmet', isApproved: true },
  { _id: 'v6', storeName: 'BeautyBloom Cosmetics', storeDescription: 'Clean beauty, luxury fragrances & clinical skincare', logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&auto=format&fit=crop&q=80', rating: 4.9, totalSales: 7800, category: 'Beauty & Personal Care', isApproved: true },
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

  // Sync products with backend on load
  useEffect(() => {
    let isMounted = true;
    const fetchCatalog = async () => {
      try {
        const res = await fetch('/api/products?limit=30');
        const data = await res.json();
        if (isMounted && data?.success && Array.isArray(data.data) && data.data.length > 0) {
          // Merge with initial products to ensure full richness
          setProducts(prev => {
            const fetched = data.data;
            const fetchedIds = new Set(fetched.map(p => p._id || p.id));
            const remaining = prev.filter(p => !fetchedIds.has(p._id || p.id));
            return [...fetched, ...remaining];
          });
        }
      } catch {
        // keep fallback mockProducts
      }
    };
    fetchCatalog();
    return () => { isMounted = false; };
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

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(i => i._id === product._id);
      if (existing) return prev.map(i => i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, quantity: 1 }];
    });
    showToast(`Added "${product.name}" to your cart!`, 'success');
    setCartOpen(true);
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(i => i._id !== productId));
    showToast('Item removed from cart', 'info');
  };

  const updateQuantity = (productId, qty) => {
    if (qty <= 0) return removeFromCart(productId);
    setCartItems(prev => prev.map(i => i._id === productId ? { ...i, quantity: qty } : i));
  };

  const clearCart = () => {
    setCartItems([]);
    showToast('Cart cleared', 'info');
  };

  const toggleWishlist = (productId) => {
    setWishlist(prev => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter(id => id !== productId) : [...prev, productId];
      showToast(exists ? 'Removed from wishlist' : 'Added to wishlist!', 'success');
      return next;
    });
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
