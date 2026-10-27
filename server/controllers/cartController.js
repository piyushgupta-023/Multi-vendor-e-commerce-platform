const Cart = require('../models/Cart');
const Product = require('../models/Product');
const cache = require('../config/redis');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const getCartKey = (userId) => `cart:${userId}`;

exports.getCart = async (req, res) => {
  try {
    const cacheKey = getCartKey(req.user._id);
    const cached = await cache.get(cacheKey);
    if (cached) return sendSuccess(res, 200, 'Cart fetched (cached)', JSON.parse(cached));
    
    let cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId', 'name images price stock isActive');
    if (!cart) cart = { items: [], totalAmount: 0, totalItems: 0 };
    
    await cache.set(cacheKey, JSON.stringify(cart), 300); // 5 min cache
    return sendSuccess(res, 200, 'Cart fetched', cart);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product || !product.isActive) return sendError(res, 404, 'Product not found');
    if (product.stock < quantity) return sendError(res, 400, 'Insufficient stock');
    
    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) cart = new Cart({ userId: req.user._id, items: [] });
    
    const existingItem = cart.items.find(item => item.productId.toString() === productId);
    if (existingItem) {
      existingItem.quantity = Math.min(existingItem.quantity + quantity, product.stock);
    } else {
      cart.items.push({
        productId: product._id,
        vendorId: product.vendorId,
        name: product.name,
        image: product.images[0]?.url || '',
        price: product.price,
        quantity,
        stock: product.stock,
      });
    }
    
    await cart.save();
    await cache.del(getCartKey(req.user._id));
    return sendSuccess(res, 200, 'Item added to cart', cart);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

exports.updateCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return sendError(res, 404, 'Cart not found');
    
    const item = cart.items.find(i => i.productId.toString() === productId);
    if (!item) return sendError(res, 404, 'Item not in cart');
    
    if (quantity <= 0) {
      cart.items = cart.items.filter(i => i.productId.toString() !== productId);
    } else {
      item.quantity = quantity;
    }
    
    await cart.save();
    await cache.del(getCartKey(req.user._id));
    return sendSuccess(res, 200, 'Cart updated', cart);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return sendError(res, 404, 'Cart not found');
    cart.items = cart.items.filter(i => i.productId.toString() !== req.params.productId);
    await cart.save();
    await cache.del(getCartKey(req.user._id));
    return sendSuccess(res, 200, 'Item removed', cart);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ userId: req.user._id }, { items: [], totalAmount: 0, totalItems: 0, couponApplied: null });
    await cache.del(getCartKey(req.user._id));
    return sendSuccess(res, 200, 'Cart cleared');
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};
