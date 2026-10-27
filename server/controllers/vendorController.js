const mongoose = require('mongoose');
const VendorProfile = require('../models/VendorProfile');
const Product = require('../models/Product');
const SubOrder = require('../models/SubOrder');
const PaymentSplit = require('../models/PaymentSplit');
const { getClient: getESClient, isESConnected } = require('../config/elasticsearch');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { generateSKU, paginate, buildPaginationMeta } = require('../utils/helpers');

const isDbConnected = () => mongoose.connection.readyState === 1;

// Resilient in-memory mock store for demo/offline resilience
const mockVendorStore = {
  profile: {
    _id: 'demo_vp_technova',
    id: 'demo_vp_technova',
    storeName: 'TechNova Electronics',
    storeSlug: 'technova-electronics',
    storeDescription: 'Premier authorized distributor of flagship electronics, smartphones, studio audio, and laptops.',
    category: 'Electronics',
    logo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=300&h=300&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=400&fit=crop&q=80',
    commissionRate: 8,
    rating: 4.8,
    totalSales: 1250,
    totalEarnings: 1450000,
    pendingPayout: 18450,
    isApproved: true,
    gstNumber: 'GST29AAACT2727Q1ZW',
    phone: '+91 98765 43210',
    email: 'technova@marketplace.com',
  },
  products: [
    {
      _id: 'prod_tech_1',
      id: 'prod_tech_1',
      name: 'Apple iPhone 15 Pro Max 256GB Titanium',
      description: 'Aerospace-grade titanium chassis, A17 Pro 3nm chip, and 5x optical telephoto lens.',
      price: 134900,
      comparePrice: 159900,
      stock: 45,
      sku: 'APPL-IP15PM-256',
      category: 'Electronics',
      tags: ['apple', 'iphone', 'flagship'],
      images: [{ url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&fit=crop&q=80', isPrimary: true }],
      isActive: true,
      views: 1840,
    },
    {
      _id: 'prod_tech_2',
      id: 'prod_tech_2',
      name: 'Sony WH-1000XM5 Noise Canceling Headphones',
      description: 'Industry-leading noise cancellation powered by dual processors and 8 microphones.',
      price: 29990,
      comparePrice: 34990,
      stock: 8,
      sku: 'SONY-WHXM5-BLK',
      category: 'Electronics',
      tags: ['sony', 'anc', 'audio'],
      images: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&fit=crop&q=80', isPrimary: true }],
      isActive: true,
      views: 920,
    },
    {
      _id: 'prod_tech_3',
      id: 'prod_tech_3',
      name: 'Apple MacBook Air 13.6" M3 512GB',
      description: 'Liquid Retina display, up to 18 hours of battery life, dual external display support.',
      price: 114900,
      comparePrice: 134900,
      stock: 0,
      sku: 'APPL-MBA-M3-13',
      category: 'Electronics',
      tags: ['apple', 'macbook', 'm3'],
      images: [{ url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&fit=crop&q=80', isPrimary: true }],
      isActive: true,
      views: 2450,
    }
  ]
};

/**
 * @route   GET /api/vendor/profile
 * @desc    Fetch current vendor's profile, store details, and stats
 * @access  Protected (Vendor / Admin)
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (!isDbConnected()) {
      const p = {
        ...mockVendorStore.profile,
        bio: mockVendorStore.profile.storeDescription,
      };
      return sendSuccess(res, 200, 'Vendor profile fetched (Resilient Mode)', {
        profile: p,
        ...p,
        stats: {
          totalProducts: mockVendorStore.products.length,
          activeProducts: mockVendorStore.products.filter(p => p.isActive).length,
          outOfStock: mockVendorStore.products.filter(p => p.stock <= 0).length,
          lowStock: mockVendorStore.products.filter(p => p.stock > 0 && p.stock <= 10).length,
          totalSales: mockVendorStore.profile.totalSales,
          totalEarnings: mockVendorStore.profile.totalEarnings,
          pendingPayout: mockVendorStore.profile.pendingPayout,
          storeHealth: 98,
        }
      });
    }

    let profile = await VendorProfile.findOne({ userId });
    if (!profile) {
      // Auto-initialize if vendor user exists
      profile = await VendorProfile.create({
        userId,
        storeName: req.user.storeName || `${req.user.name}'s Store`,
        storeDescription: `Official storefront of ${req.user.name}`,
        isApproved: true,
      });
    }

    const [totalProducts, activeProducts, outOfStock, lowStock] = await Promise.all([
      Product.countDocuments({ vendorId: userId }),
      Product.countDocuments({ vendorId: userId, isActive: true }),
      Product.countDocuments({ vendorId: userId, stock: { $lte: 0 } }),
      Product.countDocuments({ vendorId: userId, stock: { $gt: 0, $lte: 10 } }),
    ]);

    return sendSuccess(res, 200, 'Vendor profile fetched successfully', {
      profile,
      stats: {
        totalProducts,
        activeProducts,
        outOfStock,
        lowStock,
        totalSales: profile.totalSales || 0,
        totalEarnings: profile.totalEarnings || 0,
        pendingPayout: profile.pendingPayout || 0,
        storeHealth: profile.isApproved ? 98 : 60,
      }
    });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

/**
 * @route   PUT /api/vendor/profile
 * @desc    Update store name, slug, bio, logo URL, and contact details
 * @access  Protected (Vendor / Admin)
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { storeName, storeDescription, bio, logo, banner, category, gstNumber, phone, bankDetails, payoutSchedule } = req.body;
    const descriptionText = storeDescription || bio;

    if (!isDbConnected()) {
      Object.assign(mockVendorStore.profile, {
        ...(storeName && { storeName, storeSlug: storeName.toLowerCase().replace(/\s+/g, '-') }),
        ...(descriptionText && { storeDescription: descriptionText, bio: descriptionText }),
        ...(logo && { logo }),
        ...(banner && { banner }),
        ...(category && { category }),
        ...(gstNumber && { gstNumber }),
        ...(phone && { phone }),
        ...(payoutSchedule && { payoutSchedule }),
      });
      return sendSuccess(res, 200, 'Vendor storefront updated successfully (Resilient Mode)', mockVendorStore.profile);
    }

    const updates = {};
    if (storeName) {
      updates.storeName = storeName.trim();
      updates.storeSlug = storeName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }
    if (descriptionText !== undefined) {
      updates.storeDescription = descriptionText;
    }
    if (logo) updates.logo = logo;
    if (banner) updates.banner = banner;
    if (category) updates.category = category;
    if (gstNumber) updates.gstNumber = gstNumber;
    if (payoutSchedule) updates.payoutSchedule = payoutSchedule;
    if (bankDetails) updates.bankDetails = bankDetails;

    const profile = await VendorProfile.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, runValidators: true, upsert: true }
    );

    return sendSuccess(res, 200, 'Vendor storefront updated successfully', profile);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

/**
 * @route   GET /api/vendor/products
 * @desc    Fetch all products uploaded by the logged-in vendor with stock levels & views
 * @access  Protected (Vendor / Admin)
 */
exports.getVendorProducts = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { search = '', category = '', sort = 'newest' } = req.query;

    if (!isDbConnected()) {
      let list = [...mockVendorStore.products];
      if (search) {
        list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()));
      }
      if (category && category !== 'All') {
        list = list.filter(p => p.category.toLowerCase() === category.toLowerCase());
      }
      return sendSuccess(res, 200, 'Vendor products fetched (Resilient Mode)', list, {
        total: list.length,
        inStockCount: list.filter(p => p.stock > 10).length,
        lowStockCount: list.filter(p => p.stock > 0 && p.stock <= 10).length,
        outOfStockCount: list.filter(p => p.stock <= 0).length,
      });
    }

    const filter = { vendorId: userId };
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { sku: new RegExp(search, 'i') },
      ];
    }
    if (category && category !== 'All') {
      filter.category = new RegExp(category, 'i');
    }

    const sortOptions = sort === 'price-low' ? { price: 1 } : sort === 'price-high' ? { price: -1 } : sort === 'stock' ? { stock: 1 } : { createdAt: -1 };

    const products = await Product.find(filter).sort(sortOptions);
    const inStockCount = products.filter(p => p.stock > 10).length;
    const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 10).length;
    const outOfStockCount = products.filter(p => p.stock <= 0).length;

    return sendSuccess(res, 200, 'Vendor products fetched successfully', products, {
      total: products.length,
      inStockCount,
      lowStockCount,
      outOfStockCount,
    });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

/**
 * @route   GET /api/vendor/dashboard
 * @desc    Get dashboard metrics & recent suborders
 * @access  Protected
 */
exports.getDashboard = async (req, res) => {
  return exports.getProfile(req, res);
};

/**
 * @route   GET /api/vendor/stats
 * @desc    Return vendor-specific metrics (total active products, out-of-stock items, total units sold, estimated earnings)
 * @access  Protected (Vendor / Admin)
 */
exports.getStats = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (!isDbConnected()) {
      const activeProducts = mockVendorStore.products.filter(p => p.isActive && p.stock > 0).length;
      const outOfStock = mockVendorStore.products.filter(p => p.stock <= 0).length;
      const lowStock = mockVendorStore.products.filter(p => p.stock > 0 && p.stock <= 10).length;
      return sendSuccess(res, 200, 'Vendor stats fetched (Resilient Mode)', {
        activeProducts,
        outOfStock,
        lowStock,
        totalProducts: mockVendorStore.products.length,
        totalUnitsSold: 428,
        estimatedEarnings: mockVendorStore.profile.totalEarnings || 1450000,
        totalSales: mockVendorStore.profile.totalSales || 1250,
        pendingPayout: mockVendorStore.profile.pendingPayout || 18450,
        storeHealthScore: 98,
        orderInquiries: 14,
      });
    }

    const [totalProducts, activeProducts, outOfStock, lowStock] = await Promise.all([
      Product.countDocuments({ vendorId: userId }),
      Product.countDocuments({ vendorId: userId, isActive: true, stock: { $gt: 0 } }),
      Product.countDocuments({ vendorId: userId, stock: { $lte: 0 } }),
      Product.countDocuments({ vendorId: userId, stock: { $gt: 0, $lte: 10 } }),
    ]);

    const profile = await VendorProfile.findOne({ userId });

    return sendSuccess(res, 200, 'Vendor stats fetched successfully', {
      totalProducts,
      activeProducts,
      outOfStock,
      lowStock,
      totalUnitsSold: profile?.totalSales || 0,
      estimatedEarnings: profile?.totalEarnings || 0,
      totalSales: profile?.totalSales || 0,
      pendingPayout: profile?.pendingPayout || 0,
      storeHealthScore: profile?.isApproved ? 98 : 70,
      orderInquiries: 12,
    });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

module.exports = exports;
module.exports.mockVendorStore = mockVendorStore;
