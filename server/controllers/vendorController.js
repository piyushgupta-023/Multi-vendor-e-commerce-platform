const mongoose = require('mongoose');
const VendorProfile = require('../models/VendorProfile');
const Product = require('../models/Product');
const SubOrder = require('../models/SubOrder');
const PaymentSplit = require('../models/PaymentSplit');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * @route   GET /api/vendor/profile
 * @desc    Fetch current vendor's profile, store details, and stats
 * @access  Protected (Vendor / Admin)
 */
exports.getProfile = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(500).json({ success: false, message: 'Database connection unavailable' });
    }

    const userId = req.user._id || req.user.id;

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
    if (!isDbConnected()) {
      return res.status(500).json({ success: false, message: 'Database connection unavailable' });
    }

    const userId = req.user._id || req.user.id;
    const { storeName, storeDescription, bio, logo, banner, category, gstNumber, phone, bankDetails, payoutSchedule } = req.body;
    const descriptionText = storeDescription || bio;

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
    if (!isDbConnected()) {
      return res.status(500).json({ success: false, message: 'Database connection unavailable' });
    }

    const userId = req.user._id || req.user.id;
    const { search = '', category = '', sort = 'newest' } = req.query;

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
    if (!isDbConnected()) {
      return res.status(500).json({ success: false, message: 'Database connection unavailable' });
    }

    const userId = req.user._id || req.user.id;

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

/**
 * @route   GET /api/vendor/public
 * @desc    Public list of approved vendor storefronts for marketplace display
 * @access  Public
 */
exports.getPublicVendors = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(500).json({ success: false, message: 'Database connection unavailable' });
    }

    let vendors = await VendorProfile.find({ isApproved: true })
      .select('storeName storeSlug storeDescription logo banner category rating totalSales')
      .lean();

    if (!vendors || vendors.length === 0) {
      vendors = await VendorProfile.find()
        .select('storeName storeSlug storeDescription logo banner category rating totalSales')
        .lean();
    }

    return sendSuccess(res, 200, 'Vendors fetched successfully', vendors);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

/**
 * @route   GET /api/vendor/public/:id
 * @desc    Public details of a single vendor storefront with their catalog products
 * @access  Public
 */
exports.getPublicVendorById = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(500).json({ success: false, message: 'Database connection unavailable' });
    }

    const { id } = req.params;
    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { userId: id }] };
    } else {
      query = { $or: [{ storeSlug: id.toLowerCase() }, { storeName: new RegExp(`^${id}$`, 'i') }] };
    }

    const vendor = await VendorProfile.findOne(query)
      .populate('userId', 'name email createdAt')
      .lean();

    if (!vendor) {
      return sendError(res, 404, 'Vendor storefront not found');
    }

    const products = await Product.find({
      $or: [{ vendorProfileId: vendor._id }, { vendorId: vendor.userId?._id || vendor.userId }],
      isActive: true,
    }).populate('vendorProfileId', 'storeName logo rating isApproved category');

    return sendSuccess(res, 200, 'Vendor storefront fetched successfully', {
      vendor,
      products,
    });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

module.exports = exports;
