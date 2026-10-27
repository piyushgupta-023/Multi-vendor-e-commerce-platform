const Cart = require('../models/Cart');
const Product = require('../models/Product');
const VendorProfile = require('../models/VendorProfile');
const redisService = require('../services/redisService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Helper to hydrate and refresh cart items with real-time product & vendor data
 */
const refreshCartItems = async (cartItems) => {
  if (!cartItems || cartItems.length === 0) return [];

  const productIds = cartItems.map(item => item.productId?._id || item.productId);
  const products = await Product.find({ _id: { $in: productIds } })
    .populate('vendorProfileId', 'storeName logo rating')
    .lean();

  const productMap = new Map();
  products.forEach(p => productMap.set(p._id.toString(), p));

  const refreshed = [];
  for (const item of cartItems) {
    const pId = (item.productId?._id || item.productId).toString();
    const product = productMap.get(pId);

    if (product && product.isActive) {
      const price = product.price;
      const currentStock = product.stock;
      const validQty = Math.max(1, Math.min(item.quantity || 1, currentStock > 0 ? currentStock : 1));

      refreshed.push({
        productId: product._id,
        vendorId: product.vendorId,
        vendorStoreName: product.vendorProfileId?.storeName || 'TechNova Electronics',
        vendorLogo: product.vendorProfileId?.logo || '',
        name: product.name,
        image: product.images?.[0]?.url || item.image || '',
        price,
        comparePrice: product.comparePrice || null,
        quantity: validQty,
        stock: currentStock,
        isOutOfStock: currentStock <= 0,
        subtotal: price * validQty,
      });
    }
  }

  return refreshed;
};

/**
 * GET /api/cart
 * Fetch current user's cart with real-time price & stock validation
 */
exports.getCart = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    // 1. Try to read from Redis cache
    let cachedCart = await redisService.getCart(userId);

    if (cachedCart && Array.isArray(cachedCart.items)) {
      return sendSuccess(res, 200, 'Cart fetched from cache', cachedCart);
    }

    // 2. Query from MongoDB if not cached
    let dbCart = await Cart.findOne({ userId });

    if (!dbCart) {
      dbCart = new Cart({ userId, items: [], totalAmount: 0, totalItems: 0 });
    }

    // Hydrate with latest prices and stock levels
    const refreshedItems = await refreshCartItems(dbCart.items);
    const totalAmount = refreshedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = refreshedItems.reduce((sum, item) => sum + item.quantity, 0);

    const cartPayload = {
      _id: dbCart._id,
      userId,
      items: refreshedItems,
      totalAmount,
      totalItems,
      couponApplied: dbCart.couponApplied || null,
    };

    // Save back to DB and cache in Redis
    dbCart.items = refreshedItems;
    dbCart.totalAmount = totalAmount;
    dbCart.totalItems = totalItems;
    await dbCart.save();

    await redisService.saveCart(userId, cartPayload);

    return sendSuccess(res, 200, 'Cart fetched successfully', cartPayload);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

/**
 * POST /api/cart/add
 * Add a product to user's cart with quantity and stock validation
 */
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return sendError(res, 400, 'Product ID is required');
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return sendError(res, 400, 'Invalid quantity');
    }

    // Validate product existence and stock
    const product = await Product.findById(productId).populate('vendorProfileId', 'storeName logo');
    if (!product || !product.isActive) {
      return sendError(res, 404, 'Product not found or inactive');
    }

    if (product.stock < qty) {
      return sendError(res, 400, `Insufficient stock. Only ${product.stock} units available.`);
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      item => item.productId.toString() === productId.toString()
    );

    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].quantity + qty;
      if (newQty > product.stock) {
        return sendError(res, 400, `Cannot add more. Max stock available: ${product.stock}`);
      }
      cart.items[existingIndex].quantity = newQty;
      cart.items[existingIndex].price = product.price;
      cart.items[existingIndex].stock = product.stock;
    } else {
      cart.items.push({
        productId: product._id,
        vendorId: product.vendorId,
        name: product.name,
        image: product.images?.[0]?.url || '',
        price: product.price,
        quantity: qty,
        stock: product.stock,
      });
    }

    await cart.save();

    // Hydrate cart for response and caching
    const refreshedItems = await refreshCartItems(cart.items);
    const totalAmount = refreshedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = refreshedItems.reduce((sum, item) => sum + item.quantity, 0);

    const payload = {
      _id: cart._id,
      userId,
      items: refreshedItems,
      totalAmount,
      totalItems,
      couponApplied: cart.couponApplied || null,
    };

    await redisService.saveCart(userId, payload);

    return sendSuccess(res, 200, 'Item added to cart', payload);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

/**
 * PUT /api/cart/update
 * Increment, decrement, or remove an item from the cart
 */
exports.updateCart = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { productId, quantity } = req.body;

    if (!productId) {
      return sendError(res, 400, 'Product ID is required');
    }

    const qty = parseInt(quantity, 10);
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      return sendError(res, 404, 'Cart not found');
    }

    if (qty <= 0) {
      // Remove item
      cart.items = cart.items.filter(
        item => item.productId.toString() !== productId.toString()
      );
    } else {
      const itemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId.toString()
      );

      if (itemIndex === -1) {
        return sendError(res, 404, 'Item not found in cart');
      }

      // Check stock
      const product = await Product.findById(productId);
      if (product && qty > product.stock) {
        return sendError(res, 400, `Only ${product.stock} units available`);
      }

      cart.items[itemIndex].quantity = qty;
      if (product) {
        cart.items[itemIndex].price = product.price;
        cart.items[itemIndex].stock = product.stock;
      }
    }

    await cart.save();

    // Hydrate cart
    const refreshedItems = await refreshCartItems(cart.items);
    const totalAmount = refreshedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = refreshedItems.reduce((sum, item) => sum + item.quantity, 0);

    const payload = {
      _id: cart._id,
      userId,
      items: refreshedItems,
      totalAmount,
      totalItems,
      couponApplied: cart.couponApplied || null,
    };

    await redisService.saveCart(userId, payload);

    return sendSuccess(res, 200, 'Cart updated successfully', payload);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

/**
 * DELETE /api/cart/clear
 * Empty cart after successful checkout or user action
 */
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    await Cart.findOneAndUpdate(
      { userId },
      { items: [], totalAmount: 0, totalItems: 0, couponApplied: null },
      { new: true, upsert: true }
    );

    await redisService.clearCart(userId);

    const emptyPayload = {
      userId,
      items: [],
      totalAmount: 0,
      totalItems: 0,
      couponApplied: null,
    };

    return sendSuccess(res, 200, 'Cart cleared successfully', emptyPayload);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};
