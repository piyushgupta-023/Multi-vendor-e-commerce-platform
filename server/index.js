require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');
const cache = require('./config/redis');
const { isESConnected } = require('./config/elasticsearch');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// Initialize DB connection (non-blocking, graceful fallback)
connectDB();

// Security and utility middleware
app.use(helmet({
  crossOriginResourcePolicy: false, // allow images across origins in dev
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

// Health check endpoint with subsystem status
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'MarketNest Enterprise API Gateway',
    environment: process.env.NODE_ENV || 'development',
    services: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected (running in resilient fallback mode)',
      redis: cache.isRedisConnected() ? 'connected' : 'in-memory fallback active',
      elasticsearch: isESConnected() ? 'connected' : 'mongodb text-search fallback active',
      aws_s3: require('./config/s3').isS3Configured() ? 'configured' : 'local storage fallback active',
    }
  });
});

// API Routes
app.use('/api', apiLimiter);
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/vendor', require('./routes/vendorRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/admin', require('./routes/admin'));

// 404 handler (Express 5 compatible)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found. Refer to docs/ARCHITECTURE_AND_API.md for available endpoints.`,
  });
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 MarketNest Server running on http://localhost:${PORT}`);
  console.log(`📍 Health Check: http://localhost:${PORT}/health`);
  console.log(`📚 Architecture Docs: ../docs/ARCHITECTURE_AND_API.md`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => console.log('HTTP server closed'));
});

module.exports = app;
