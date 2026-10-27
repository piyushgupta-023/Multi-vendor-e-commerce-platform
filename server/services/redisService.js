const cache = require('../config/redis');

const CART_TTL = 300; // 5 minutes
const SESSION_TTL = 3600; // 1 hour

const getCart = async (userId) => {
  const key = `cart:${userId}`;
  const data = await cache.get(key);
  return data ? JSON.parse(data) : null;
};

const setCart = async (userId, cartData) => {
  const key = `cart:${userId}`;
  await cache.set(key, JSON.stringify(cartData), CART_TTL);
};

const invalidateCart = async (userId) => {
  await cache.del(`cart:${userId}`);
};

const setSession = async (key, data, ttl = SESSION_TTL) => {
  await cache.set(key, JSON.stringify(data), ttl);
};

const getSession = async (key) => {
  const data = await cache.get(key);
  return data ? JSON.parse(data) : null;
};

const invalidateSession = async (key) => {
  await cache.del(key);
};

const cacheProducts = async (cacheKey, products, ttl = 60) => {
  await cache.set(cacheKey, JSON.stringify(products), ttl);
};

const getCachedProducts = async (cacheKey) => {
  const data = await cache.get(cacheKey);
  return data ? JSON.parse(data) : null;
};

module.exports = {
  getCart, setCart, invalidateCart,
  setSession, getSession, invalidateSession,
  cacheProducts, getCachedProducts,
  isRedisConnected: cache.isRedisConnected,
};
