const cache = require('../config/redis');

const CART_TTL = 86400; // 24 hours
const SESSION_TTL = 3600; // 1 hour

// In-memory fallback map if Redis is offline
const memoryCartStore = new Map();

/**
 * Fetch cart for a given userId from Redis or in-memory fallback
 * @param {string} userId 
 * @returns {Promise<Object|null>}
 */
const getCart = async (userId) => {
  try {
    const key = `cart:${userId}`;
    const data = await cache.get(key);
    if (data) {
      return typeof data === 'string' ? JSON.parse(data) : data;
    }
  } catch (err) {
    console.warn(`Redis getCart error for user ${userId}, using memory fallback:`, err.message);
  }

  // Fallback to local memory store
  const memoryData = memoryCartStore.get(userId.toString());
  return memoryData || null;
};

/**
 * Save cart data for a user in Redis and in-memory fallback
 * @param {string} userId 
 * @param {Object} cartData 
 */
const saveCart = async (userId, cartData) => {
  const serialized = JSON.stringify(cartData);
  const userKey = userId.toString();

  // Always keep in-memory sync for resilience
  memoryCartStore.set(userKey, cartData);

  try {
    const key = `cart:${userId}`;
    await cache.set(key, serialized, CART_TTL);
  } catch (err) {
    console.warn(`Redis saveCart error for user ${userId}, saved in memory:`, err.message);
  }
};

/**
 * Clear/Empty cart for a user in Redis and memory
 * @param {string} userId 
 */
const clearCart = async (userId) => {
  const userKey = userId.toString();
  memoryCartStore.delete(userKey);

  try {
    const key = `cart:${userId}`;
    await cache.del(key);
  } catch (err) {
    console.warn(`Redis clearCart error for user ${userId}:`, err.message);
  }
};

// Aliases for compatibility
const setCart = saveCart;
const invalidateCart = clearCart;

const setSession = async (key, data, ttl = SESSION_TTL) => {
  try {
    await cache.set(key, JSON.stringify(data), ttl);
  } catch {}
};

const getSession = async (key) => {
  try {
    const data = await cache.get(key);
    return data ? (typeof data === 'string' ? JSON.parse(data) : data) : null;
  } catch {
    return null;
  }
};

const invalidateSession = async (key) => {
  try {
    await cache.del(key);
  } catch {}
};

const cacheProducts = async (cacheKey, products, ttl = 60) => {
  try {
    await cache.set(cacheKey, JSON.stringify(products), ttl);
  } catch {}
};

const getCachedProducts = async (cacheKey) => {
  try {
    const data = await cache.get(cacheKey);
    return data ? (typeof data === 'string' ? JSON.parse(data) : data) : null;
  } catch {
    return null;
  }
};

module.exports = {
  getCart,
  saveCart,
  clearCart,
  setCart,
  invalidateCart,
  setSession,
  getSession,
  invalidateSession,
  cacheProducts,
  getCachedProducts,
  isRedisConnected: cache.isRedisConnected,
};
