require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const runMigrations = require('./migrations');
const { getJwtSecret } = require('./utils/jwt');
const errorHandler = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');
const cache = require('./config/redis');
const { isESConnected } = require('./config/elasticsearch');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// Security and utility middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static uploads for local image fallback
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
const healthCheck = (req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1;
  const isRedisActive = cache.isRedisConnected();
  const isS3Ready = require('./config/s3').isS3Configured();
  const isRazorpayReady = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key');

  res.json({
    status: isMongoConnected ? 'HEALTHY' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    service: 'MarketNest Enterprise API Gateway',
    version: '2.4.0',
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: isMongoConnected ? 'connected' : 'disconnected',
      readyState: mongoose.connection.readyState,
    },
    services: {
      mongodb: isMongoConnected ? 'connected' : 'connecting',
      redis: isRedisActive ? 'connected' : 'in-memory fallback active',
      elasticsearch: isESConnected() ? 'connected' : 'mongodb text-search fallback active',
      aws_s3: isS3Ready ? 'configured' : 'local storage fallback active',
      razorpay: isRazorpayReady ? 'configured' : 'sandbox/ready',
    },
  });
};

app.get('/health', healthCheck);
app.get('/api/health', healthCheck);

// API Documentation & Discovery Catalog
app.get('/api', (req, res) => {
  res.json({
    name: 'MarketNest Multi-Vendor E-Commerce API',
    version: '2.4.0',
    description: 'Enterprise REST API gateway with RBAC, Redis cart caching, Elasticsearch product search, and Razorpay split settlements.',
    healthEndpoint: '/health',
    documentation: '/docs/ARCHITECTURE_AND_API.md',
    services: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      readyState: mongoose.connection.readyState,
      redis: cache.isRedisConnected() ? 'connected' : 'in-memory fallback active',
      elasticsearch: isESConnected() ? 'connected' : 'mongodb text-search fallback active',
      razorpay: Boolean(process.env.RAZORPAY_KEY_ID) ? 'ready' : 'sandbox/fallback',
    },
    endpoints: {
      auth: {
        base: '/api/auth',
        routes: [
          'POST /api/auth/register (name, email, password, role)',
          'POST /api/auth/login (email, password)',
          'GET  /api/auth/me (Bearer JWT)',
          'POST /api/auth/google (credential, role)',
          'POST /api/auth/phone/send-otp (phone)',
          'POST /api/auth/phone/verify-otp (phone, otp, name, role)',
        ],
      },
      products: {
        base: '/api/products',
        routes: [
          'GET  /api/products (filter by category, minPrice, maxPrice, sort, page)',
          'GET  /api/products/search (query, category, minRating, sort)',
          'GET  /api/products/:id (get product details with seller info & reviews)',
        ],
      },
      location: {
        base: '/api/location',
        routes: [
          'GET /api/location/pincode/:pincode (lookup Indian PIN code area)',
        ],
      },
      cart: {
        base: '/api/cart',
        routes: [
          'GET    /api/cart (fetch Redis/in-memory cached user cart)',
          'POST   /api/cart/add (productId, quantity)',
          'PUT    /api/cart/update (productId, quantity)',
          'DELETE /api/cart/clear (empty cart)',
        ],
      },
      orders: {
        base: '/api/orders',
        routes: [
          'POST /api/orders/checkout (multi-vendor split-order creation)',
          'GET  /api/orders/my-orders (buyer order history)',
          'GET  /api/orders/:id (order details and suborders)',
          'GET  /api/orders/:id/invoice (GST-compliant PDF tax invoice download)',
        ],
      },
      vendor: {
        base: '/api/vendor',
        routes: [
          'GET   /api/vendor/profile (store profile details)',
          'PUT   /api/vendor/profile (update store details & bank info)',
          'GET   /api/vendor/products (vendor catalog listing)',
          'GET   /api/vendor/orders (sub-orders assigned to vendor)',
          'PATCH /api/vendor/orders/:subOrderId/status (update fulfillment status: packed, shipped, delivered)',
          'GET   /api/vendor/stats (gross sales, 10% platform commission, net escrow payout)',
        ],
      },
      admin: {
        base: '/api/admin',
        routes: [
          'GET /api/admin/dashboard (system stats, total revenue, commission)',
          'GET /api/admin/vendors (vendor verification and status)',
          'PUT /api/admin/vendors/:id/approve (approve vendor application)',
        ],
      },
      payments: {
        base: '/api/payments',
        routes: [
          'POST /api/payments/razorpay/create-order/:orderId',
          'POST /api/payments/razorpay/verify',
          'GET  /api/payments/split-summary/:orderId',
        ],
      },
    },
  });
});

// API Routes
app.use('/api', apiLimiter);
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/location', require('./routes/locationRoutes'));
app.use('/api/vendor', require('./routes/vendorRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/admin', require('./routes/admin'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found. Refer to docs/ARCHITECTURE_AND_API.md for available endpoints.`,
  });
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
let developmentMongoServer;
let developmentMongoRecovery;
let developmentMongoRestartInProgress = false;

const isDevelopmentMongoAlive = () => {
  const mongodProcess = developmentMongoServer?.instanceInfo?.instance?.mongodProcess;
  return Boolean(
    mongodProcess?.pid
    && mongodProcess.exitCode === null
    && mongodProcess.signalCode === null
  );
};

const recoverDevelopmentMongo = () => {
  if (!developmentMongoServer) return Promise.resolve();
  if (developmentMongoRecovery) return developmentMongoRecovery;

  developmentMongoRecovery = (async () => {
    let retryDelay = 1000;

    while (mongoose.connection.readyState !== 1 || !isDevelopmentMongoAlive()) {
      try {
        if (!isDevelopmentMongoAlive()) {
          console.warn('Development MongoDB stopped; restarting the persistent database.');
          developmentMongoRestartInProgress = true;
          try {
            await mongoose.disconnect();
            await developmentMongoServer.stop({ doCleanup: false, force: false });
            await developmentMongoServer.start();
            process.env.MONGODB_URI = developmentMongoServer.getUri();
          } finally {
            developmentMongoRestartInProgress = false;
          }
        }

        await connectDB();
        console.log('MongoDB connection recovered.');
      } catch (err) {
        console.error('Development MongoDB recovery failed:', err.message);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        retryDelay = Math.min(retryDelay * 2, 10000);
      }
    }
  })().finally(() => {
    developmentMongoRecovery = null;
  });

  return developmentMongoRecovery;
};

const connectWithDevelopmentFallback = async () => {
  try {
    await connectDB();
  } catch (err) {
    if (process.env.NODE_ENV !== 'development') throw err;

    const fs = require('fs');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const dbPath = path.join(__dirname, '.data', 'mongodb');
    fs.mkdirSync(dbPath, { recursive: true });
    console.warn(`MongoDB unavailable locally; starting a persistent development database at ${dbPath}.`);
    developmentMongoServer = await MongoMemoryServer.create({
      instance: {
        dbPath,
        storageEngine: 'wiredTiger',
      },
    });
    process.env.MONGODB_URI = developmentMongoServer.getUri();
    await connectDB();

    developmentMongoServer.instanceInfo.instance.on('instanceClosed', (code, signal) => {
      if (developmentMongoRestartInProgress) return;
      console.error(`Development MongoDB exited (code ${code}, signal ${signal || 'none'}).`);
      void recoverDevelopmentMongo();
    });
    mongoose.connection.on('disconnected', () => {
      if (developmentMongoRestartInProgress) return;
      console.warn('MongoDB disconnected; attempting to recover the development database.');
      void recoverDevelopmentMongo();
    });
  }
};

// Start server after the database and its non-destructive migrations are ready.
const startServer = async () => {
  try {
    getJwtSecret();
    await connectWithDevelopmentFallback();
    await runMigrations();
    if (process.env.NODE_ENV === 'development') {
      const { seedDatabase } = require('./seed');
      await seedDatabase();
    }

    const server = app.listen(PORT, () => {
      console.log(`🚀 MarketNest Server running on http://localhost:${PORT}`);
      console.log(`📍 Health Check: http://localhost:${PORT}/health`);
    });
    return server;
  } catch (err) {
    console.error('Server startup failed:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
