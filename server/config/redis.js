const Redis = require('ioredis');

let redisClient = null;
let isConnected = false;

// In-memory fallback store
const memoryStore = new Map();

const createRedisClient = () => {
  try {
    const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      retryStrategy: () => null, // disable auto-retry
    });

    client.on('connect', () => {
      isConnected = true;
      console.log('✅ Redis Connected');
    });

    client.on('error', (err) => {
      if (isConnected) {
        console.warn('⚠️  Redis disconnected, using in-memory fallback');
        isConnected = false;
      }
    });

    client.connect().catch(() => {
      console.warn('⚠️  Redis unavailable, using in-memory fallback store');
    });

    redisClient = client;
  } catch (err) {
    console.warn('⚠️  Redis init failed, using in-memory fallback store');
  }
};

createRedisClient();

// Unified interface that falls back gracefully
const cache = {
  async get(key) {
    try {
      if (isConnected && redisClient) return await redisClient.get(key);
    } catch {}
    return memoryStore.get(key) || null;
  },
  async set(key, value, ttlSeconds) {
    try {
      if (isConnected && redisClient) {
        if (ttlSeconds) return await redisClient.setex(key, ttlSeconds, value);
        return await redisClient.set(key, value);
      }
    } catch {}
    memoryStore.set(key, value);
    if (ttlSeconds) setTimeout(() => memoryStore.delete(key), ttlSeconds * 1000);
    return 'OK';
  },
  async del(key) {
    try {
      if (isConnected && redisClient) return await redisClient.del(key);
    } catch {}
    memoryStore.delete(key);
    return 1;
  },
  async exists(key) {
    try {
      if (isConnected && redisClient) return await redisClient.exists(key);
    } catch {}
    return memoryStore.has(key) ? 1 : 0;
  },
  getClient: () => redisClient,
  isRedisConnected: () => isConnected,
};

module.exports = cache;
