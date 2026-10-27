const mongoose = require('mongoose');
const Product = require('../models/Product');
const VendorProfile = require('../models/VendorProfile');
const { getClient: getESClient, isESConnected } = require('../config/elasticsearch');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { generateSKU, paginate, buildPaginationMeta } = require('../utils/helpers');
const { mockVendorStore } = require('./vendorController');

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * @route   GET /api/products/search
 * @desc    Search products via Elasticsearch or MongoDB fallback
 * @access  Public
 */
exports.searchProducts = async (req, res) => {
  try {
    const { q = '', category, subcategory, minPrice, maxPrice, sort = 'relevance', page = 1, limit = 20 } = req.query;
    const { skip, limit: lim } = paginate(page, limit);

    if (!isDbConnected()) {
      let list = [...mockVendorStore.products];
      if (q) {
        list = list.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.description.toLowerCase().includes(q.toLowerCase()));
      }
      if (category && category !== 'All') {
        list = list.filter(p => p.category.toLowerCase() === category.toLowerCase());
      }
      return sendSuccess(res, 200, 'Products fetched (Resilient Mode)', list, buildPaginationMeta(list.length, page, lim));
    }

    // Try Elasticsearch first
    if (isESConnected() && q) {
      try {
        const esClient = getESClient();
        const mustQueries = [{ match: { isActive: true } }];
        mustQueries.push({ multi_match: { query: q, fields: ['name^3', 'description', 'tags^2', 'category'] } });
        if (category && category !== 'All') mustQueries.push({ term: { category } });

        const filterQueries = [];
        if (minPrice || maxPrice) {
          filterQueries.push({ range: { price: { ...(minPrice && { gte: parseFloat(minPrice) }), ...(maxPrice && { lte: parseFloat(maxPrice) }) } } });
        }

        const sortOptions = sort === 'price_asc' ? [{ price: 'asc' }] : sort === 'price_desc' ? [{ price: 'desc' }] : sort === 'rating' ? [{ 'ratings.average': 'desc' }] : ['_score'];

        const esResult = await esClient.search({
          index: 'products',
          body: {
            query: { bool: { must: mustQueries, filter: filterQueries } },
            sort: sortOptions,
            from: skip,
            size: lim,
          }
        });

        const ids = esResult.hits.hits.map(h => h._id);
        const products = await Product.find({ _id: { $in: ids } }).populate('vendorProfileId', 'storeName logo');
        const total = esResult.hits.total.value || 0;

        return sendSuccess(res, 200, 'Search results (Elasticsearch)', products, buildPaginationMeta(total, page, lim));
      } catch (esErr) {
        console.warn('ES search failed, falling back to MongoDB:', esErr.message);
      }
    }

    // MongoDB fallback
    const filter = { isActive: true };
    if (q) filter.$text = { $search: q };
    if (category && category !== 'All') filter.category = new RegExp(category, 'i');
    if (subcategory) filter.subcategory = new RegExp(subcategory, 'i');
    if (minPrice || maxPrice) filter.price = { ...(minPrice && { $gte: parseFloat(minPrice) }), ...(maxPrice && { $lte: parseFloat(maxPrice) }) };

    const sortMap = { price_asc: { price: 1 }, price_desc: { price: -1 }, rating: { 'ratings.average': -1 }, newest: { createdAt: -1 } };
    const sortQuery = sortMap[sort] || { createdAt: -1 };

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortQuery).skip(skip).limit(lim).populate('vendorProfileId', 'storeName logo'),
      Product.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, 'Products fetched (MongoDB)', products, buildPaginationMeta(total, page, lim));
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID
 * @access  Public
 */
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isDbConnected()) {
      const prod = mockVendorStore.products.find(p => p._id === id || p.id === id);
      if (prod) return sendSuccess(res, 200, 'Product fetched (Resilient Mode)', prod);
      return sendError(res, 404, 'Product not found');
    }

    const product = await Product.findById(id).populate('vendorProfileId', 'storeName logo rating totalSales storeSlug');
    if (!product) return sendError(res, 404, 'Product not found');
    return sendSuccess(res, 200, 'Product fetched', product);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

/**
 * @route   POST /api/products
 * @desc    Add new product (title, description, category, price, discountPrice, stock, tags, images, specs)
 * @access  Protected (Vendor / Admin only)
 */
exports.createProduct = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const {
      title,
      name,
      description,
      category,
      subcategory,
      price,
      discountPrice,
      comparePrice,
      stock = 0,
      tags = [],
      images = [],
      specs,
      attributes,
      weight,
      isFeatured = false,
    } = req.body;

    const productName = (title || name || '').trim();
    if (!productName) return sendError(res, 400, 'Product title/name is required');
    if (!category) return sendError(res, 400, 'Category is required');
    if (price === undefined || price < 0) return sendError(res, 400, 'Valid price is required');

    const formattedPrice = parseFloat(price);
    const formattedComparePrice = discountPrice !== undefined ? parseFloat(discountPrice) : (comparePrice !== undefined ? parseFloat(comparePrice) : undefined);
    const formattedStock = parseInt(stock, 10) || 0;

    // Normalizing image array
    const formattedImages = Array.isArray(images)
      ? images.map((img, idx) => typeof img === 'string' ? { url: img, isPrimary: idx === 0 } : img)
      : [];

    // Normalizing tags
    const formattedTags = Array.isArray(tags)
      ? tags.map(t => String(t).trim().toLowerCase())
      : typeof tags === 'string'
      ? tags.split(',').map(t => t.trim().toLowerCase())
      : [];

    const formattedSpecs = specs || attributes;

    if (!isDbConnected()) {
      const mockId = `mock_prod_${Date.now()}`;
      const newMockProd = {
        _id: mockId,
        id: mockId,
        name: productName,
        title: productName,
        description: description || '',
        category,
        subcategory,
        price: formattedPrice,
        comparePrice: formattedComparePrice,
        discountPrice: formattedComparePrice,
        stock: formattedStock,
        sku: req.body.sku || `PROD-${Date.now().toString().slice(-6)}`,
        tags: formattedTags,
        images: formattedImages.length > 0 ? formattedImages : [{ url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&fit=crop&q=80', isPrimary: true }],
        attributes: formattedSpecs,
        specs: formattedSpecs,
        weight,
        isFeatured,
        isActive: true,
        vendorId: userId,
        vendorProfileId: { storeName: req.user.storeName || 'TechNova Electronics' },
        createdAt: new Date().toISOString(),
        views: 0,
      };

      mockVendorStore.products.unshift(newMockProd);
      return sendSuccess(res, 201, 'Product created successfully (Resilient Mode)', newMockProd);
    }

    // Lookup vendor profile
    let vendorProfile = await VendorProfile.findOne({ userId });
    if (!vendorProfile && req.user.role === 'admin') {
      vendorProfile = await VendorProfile.findOne();
    }

    const sku = req.body.sku || generateSKU(productName, userId);

    const product = await Product.create({
      vendorId: userId,
      vendorProfileId: vendorProfile?._id,
      name: productName,
      description: description || '',
      price: formattedPrice,
      comparePrice: formattedComparePrice,
      category,
      subcategory,
      stock: formattedStock,
      sku,
      tags: formattedTags,
      images: formattedImages,
      attributes: formattedSpecs ? new Map(Object.entries(formattedSpecs)) : undefined,
      weight,
      isFeatured,
      isActive: true,
    });

    // Sync to Elasticsearch if online
    if (isESConnected()) {
      try {
        await getESClient().index({
          index: 'products',
          id: product._id.toString(),
          document: {
            name: product.name,
            description: product.description,
            category: product.category,
            price: product.price,
            vendorId: userId.toString(),
            storeName: vendorProfile?.storeName || 'Vendor Store',
            isActive: true,
          }
        });
      } catch (esErr) {
        console.warn('ES index failed:', esErr.message);
      }
    }

    return sendSuccess(res, 201, 'Product created successfully', product);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

/**
 * @route   PUT /api/products/:id
 * @desc    Edit product details or update stock
 * @access  Protected (Vendor owner or Admin)
 */
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    if (!isDbConnected()) {
      const idx = mockVendorStore.products.findIndex(p => p._id === id || p.id === id);
      if (idx === -1) return sendError(res, 404, 'Product not found');

      const existing = mockVendorStore.products[idx];
      const updated = {
        ...existing,
        ...req.body,
        name: req.body.title || req.body.name || existing.name,
        price: req.body.price !== undefined ? parseFloat(req.body.price) : existing.price,
        comparePrice: req.body.discountPrice !== undefined ? parseFloat(req.body.discountPrice) : (req.body.comparePrice !== undefined ? parseFloat(req.body.comparePrice) : existing.comparePrice),
        stock: req.body.stock !== undefined ? parseInt(req.body.stock, 10) : existing.stock,
      };

      mockVendorStore.products[idx] = updated;
      return sendSuccess(res, 200, 'Product updated successfully (Resilient Mode)', updated);
    }

    const query = req.user.role === 'admin' ? { _id: id } : { _id: id, vendorId: userId };
    const product = await Product.findOne(query);

    if (!product) {
      return sendError(res, 404, 'Product not found or you are not authorized to edit this product.');
    }

    // Apply updates
    if (req.body.title || req.body.name) product.name = (req.body.title || req.body.name).trim();
    if (req.body.description !== undefined) product.description = req.body.description;
    if (req.body.category) product.category = req.body.category;
    if (req.body.subcategory !== undefined) product.subcategory = req.body.subcategory;
    if (req.body.price !== undefined) product.price = parseFloat(req.body.price);
    if (req.body.discountPrice !== undefined) product.comparePrice = parseFloat(req.body.discountPrice);
    if (req.body.comparePrice !== undefined) product.comparePrice = parseFloat(req.body.comparePrice);
    if (req.body.stock !== undefined) product.stock = parseInt(req.body.stock, 10);
    if (req.body.sku) product.sku = req.body.sku;
    if (req.body.isActive !== undefined) product.isActive = req.body.isActive;
    if (req.body.isFeatured !== undefined) product.isFeatured = req.body.isFeatured;
    if (req.body.images) product.images = req.body.images;
    if (req.body.tags) {
      product.tags = Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',').map(t => t.trim().toLowerCase());
    }

    await product.save();

    // Update in ES if online
    if (isESConnected()) {
      try {
        await getESClient().update({
          index: 'products',
          id: product._id.toString(),
          doc: {
            name: product.name,
            description: product.description,
            price: product.price,
            isActive: product.isActive,
          }
        });
      } catch {}
    }

    return sendSuccess(res, 200, 'Product updated successfully', product);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

/**
 * @route   DELETE /api/products/:id
 * @desc    Soft-delete or remove product
 * @access  Protected (Vendor owner or Admin)
 */
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    if (!isDbConnected()) {
      const idx = mockVendorStore.products.findIndex(p => p._id === id || p.id === id);
      if (idx === -1) return sendError(res, 404, 'Product not found');
      mockVendorStore.products.splice(idx, 1);
      return sendSuccess(res, 200, 'Product removed successfully (Resilient Mode)');
    }

    const query = req.user.role === 'admin' ? { _id: id } : { _id: id, vendorId: userId };
    const product = await Product.findOne(query);

    if (!product) {
      return sendError(res, 404, 'Product not found or you are not authorized to delete it.');
    }

    // Soft-delete
    product.isActive = false;
    await product.save();

    // Remove from ES
    if (isESConnected()) {
      try {
        await getESClient().delete({ index: 'products', id });
      } catch {}
    }

    return sendSuccess(res, 200, 'Product removed successfully');
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

/**
 * @route   GET /api/products/featured
 * @desc    Get featured products
 */
exports.getFeaturedProducts = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return sendSuccess(res, 200, 'Featured products', mockVendorStore.products.filter(p => p.isFeatured));
    }
    const products = await Product.find({ isFeatured: true, isActive: true }).limit(12).populate('vendorProfileId', 'storeName logo');
    return sendSuccess(res, 200, 'Featured products', products);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

/**
 * @route   GET /api/products/categories
 * @desc    Get product category rollups
 */
exports.getCategories = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return sendSuccess(res, 200, 'Categories fetched', [
        { _id: 'Electronics', count: 4 },
        { _id: 'Fashion', count: 2 },
        { _id: 'Home & Living', count: 2 },
        { _id: 'Sports & Fitness', count: 2 },
        { _id: 'Beauty & Personal Care', count: 3 },
      ]);
    }
    const categories = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    return sendSuccess(res, 200, 'Categories fetched', categories);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

/**
 * @route   GET /api/products/by-vendor/:vendorId
 * @desc    Get products by vendor ID
 */
exports.getProductsByVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    if (!isDbConnected()) {
      return sendSuccess(res, 200, 'Vendor products', mockVendorStore.products);
    }
    const products = await Product.find({ vendorId, isActive: true }).populate('vendorProfileId', 'storeName logo');
    return sendSuccess(res, 200, 'Vendor products', products);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

/**
 * @route   GET /api/products/my-products
 * @desc    Get all products belonging to the logged-in vendor with pagination, search, and stock status filters
 * @access  Protected (Vendor / Admin)
 */
exports.getMyProducts = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { search = '', q = '', category = 'All', stockStatus = 'all', page = 1, limit = 20, sort = 'newest' } = req.query;
    const searchQuery = search || q;
    const { skip, limit: lim } = paginate(page, limit);

    if (!isDbConnected()) {
      let list = [...mockVendorStore.products];
      if (searchQuery) {
        const sq = searchQuery.toLowerCase();
        list = list.filter(p => (p.name || p.title || '').toLowerCase().includes(sq) || (p.sku || '').toLowerCase().includes(sq));
      }
      if (category && category !== 'All') {
        list = list.filter(p => (p.category || '').toLowerCase() === category.toLowerCase());
      }
      if (stockStatus === 'in-stock' || stockStatus === 'in') {
        list = list.filter(p => p.stock > 10);
      } else if (stockStatus === 'low-stock' || stockStatus === 'low') {
        list = list.filter(p => p.stock > 0 && p.stock <= 10);
      } else if (stockStatus === 'out-of-stock' || stockStatus === 'out') {
        list = list.filter(p => p.stock <= 0);
      }

      return sendSuccess(res, 200, 'Vendor products fetched (Resilient Mode)', list, {
        ...buildPaginationMeta(list.length, page, lim),
        total: list.length,
        inStockCount: list.filter(p => p.stock > 10).length,
        lowStockCount: list.filter(p => p.stock > 0 && p.stock <= 10).length,
        outOfStockCount: list.filter(p => p.stock <= 0).length,
      });
    }

    const filter = { vendorId: userId };
    if (searchQuery) {
      filter.$or = [
        { name: new RegExp(searchQuery, 'i') },
        { sku: new RegExp(searchQuery, 'i') },
        { tags: new RegExp(searchQuery, 'i') },
      ];
    }
    if (category && category !== 'All') {
      filter.category = new RegExp(category, 'i');
    }
    if (stockStatus === 'in-stock' || stockStatus === 'in') {
      filter.stock = { $gt: 10 };
    } else if (stockStatus === 'low-stock' || stockStatus === 'low') {
      filter.stock = { $gt: 0, $lte: 10 };
    } else if (stockStatus === 'out-of-stock' || stockStatus === 'out') {
      filter.stock = { $lte: 0 };
    }

    const sortMap = {
      'price-low': { price: 1 },
      'price-high': { price: -1 },
      'stock': { stock: 1 },
      'newest': { createdAt: -1 },
    };
    const sortQuery = sortMap[sort] || { createdAt: -1 };

    const [products, total, inStockCount, lowStockCount, outOfStockCount] = await Promise.all([
      Product.find(filter).sort(sortQuery).skip(skip).limit(lim),
      Product.countDocuments(filter),
      Product.countDocuments({ vendorId: userId, stock: { $gt: 10 } }),
      Product.countDocuments({ vendorId: userId, stock: { $gt: 0, $lte: 10 } }),
      Product.countDocuments({ vendorId: userId, stock: { $lte: 0 } }),
    ]);

    return sendSuccess(res, 200, 'Vendor products fetched successfully', products, {
      ...buildPaginationMeta(total, page, lim),
      total,
      inStockCount,
      lowStockCount,
      outOfStockCount,
    });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};
