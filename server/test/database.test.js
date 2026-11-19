require('dotenv').config();
const assert = require('node:assert/strict');
const { test } = require('node:test');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const connectDB = require('../config/db');
const runMigrations = require('../migrations');
const models = require('../models');

test('database migration preserves records, links categories and supports the API', async () => {
  const mongoServer = await MongoMemoryServer.create();
  let httpServer;
  const configuredMongoUri = process.env.MONGODB_URI;
  const configuredJwtSecret = process.env.JWT_SECRET;
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-secret-for-marketnest';

  try {
    delete process.env.MONGODB_URI;
    await assert.rejects(connectDB(), /MONGODB_URI must be configured/);
    process.env.MONGODB_URI = mongoServer.getUri();
    await connectDB();

    const buyer = await models.User.create({ name: 'Buyer', email: 'buyer@example.test' });
    const vendor = await models.User.create({ name: 'Vendor', email: 'vendor@example.test', role: 'vendor' });
    const store = await models.VendorProfile.create({ userId: vendor._id, storeName: 'Test Store' });
    const product = await models.Product.create({
      vendorId: vendor._id,
      vendorProfileId: store._id,
      name: 'Test Product',
      description: 'Database integration test product',
      price: 20,
      category: 'Electronics',
      stock: 5,
    });
    const cart = await models.Cart.create({
      userId: buyer._id,
      items: [{ productId: product._id, vendorId: vendor._id, price: 20, quantity: 1 }],
    });
    const order = await models.Order.create({
      customerId: buyer._id,
      items: [{ productId: product._id, vendorId: vendor._id, name: product.name, price: 20, quantity: 1 }],
      totalAmount: 20,
    });
    const subOrder = await models.SubOrder.create({
      orderId: order._id,
      vendorId: vendor._id,
      customerId: buyer._id,
      subtotal: 20,
      commissionRate: 10,
      commissionAmount: 2,
      vendorPayout: 18,
    });
    const paymentSplit = await models.PaymentSplit.create({
      orderId: order._id,
      subOrderId: subOrder._id,
      vendorId: vendor._id,
      grossAmount: 20,
      commissionRate: 10,
      commissionAmount: 2,
      netPayout: 18,
    });
    const review = await models.Review.create({
      productId: product._id,
      customerId: buyer._id,
      vendorId: vendor._id,
      rating: 5,
    });
    const coupon = await models.Coupon.create({
      code: 'TEST10',
      type: 'percentage',
      value: 10,
      vendorId: vendor._id,
    });

    await runMigrations();

    const linkedProduct = await models.Product.findById(product._id)
      .populate('categoryId')
      .populate('vendorId')
      .populate('vendorProfileId');
    assert.equal(linkedProduct.categoryId.name, 'Electronics');
    assert.equal(linkedProduct.vendorId._id.toString(), vendor._id.toString());
    assert.equal(linkedProduct.vendorProfileId._id.toString(), store._id.toString());

    assert.equal((await models.Cart.findById(cart._id).populate('userId')).userId._id.toString(), buyer._id.toString());
    assert.equal((await models.Order.findById(order._id).populate('customerId')).customerId._id.toString(), buyer._id.toString());
    assert.equal((await models.SubOrder.findById(subOrder._id).populate('orderId')).orderId._id.toString(), order._id.toString());
    assert.equal((await models.PaymentSplit.findById(paymentSplit._id).populate('subOrderId')).subOrderId._id.toString(), subOrder._id.toString());
    assert.equal((await models.Review.findById(review._id).populate('productId')).productId._id.toString(), product._id.toString());
    assert.equal((await models.Coupon.findById(coupon._id).populate('vendorId')).vendorId._id.toString(), vendor._id.toString());
    assert.equal(await models.Product.countDocuments(), 1);
    assert.equal(await models.Order.countDocuments(), 1);
    assert.equal(await models.User.countDocuments(), 2);

    await assert.rejects(
      models.User.create({ name: 'Duplicate buyer', email: 'buyer@example.test' }),
      (error) => error.code === 11000
    );

    await runMigrations();
    assert.equal(await models.Category.countDocuments(), 1);

    const { app } = require('../server');
    httpServer = app.listen(0);
    await new Promise((resolve) => httpServer.once('listening', resolve));
    const baseUrl = `http://127.0.0.1:${httpServer.address().port}`;
    const health = await fetch(`${baseUrl}/health`);
    const discovery = await fetch(`${baseUrl}/api`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).database.status, 'connected');
    assert.equal(discovery.status, 200);
    assert.equal((await discovery.json()).services.mongodb, 'connected');

    const categories = await fetch(`${baseUrl}/api/products/categories`);
    const products = await fetch(`${baseUrl}/api/products`);
    assert.equal(categories.status, 200);
    assert.equal(products.status, 200);

    const invalidRegistration = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '', email: 'not-an-email', password: 'x' }),
    });
    assert.equal(invalidRegistration.status, 400);
  } finally {
    if (httpServer) {
      await new Promise((resolve, reject) => httpServer.close((err) => err ? reject(err) : resolve()));
    }
    const redisClient = require('../config/redis').getClient();
    if (redisClient) redisClient.disconnect();
    await mongoose.disconnect();
    await mongoServer.stop();
    if (configuredMongoUri === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = configuredMongoUri;
    }
    if (configuredJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = configuredJwtSecret;
    }
  }
});
