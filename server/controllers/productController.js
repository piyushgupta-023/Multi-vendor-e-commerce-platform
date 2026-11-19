const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const VendorProfile = require('../models/VendorProfile');
const { getClient: getESClient, isESConnected } = require('../config/elasticsearch');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { generateSKU, paginate, buildPaginationMeta } = require('../utils/helpers');

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * @route   GET /api/products/search
 * @desc    Search products via Elasticsearch or MongoDB fallback
 * @access  Public
 */
exports.searchProducts = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(500).json({ success: false, message: 'Database connection unavailable' });
    }

    const { q = '', search = '', category, subcategory, minPrice, maxPrice, minRating, sort = 'relevance', page = 1, limit = 20 } = req.query;
    const searchTerm = q || search;
    const { skip, limit: lim } = paginate(page, limit);

    // Try Elasticsearch first if connected and query provided
    if (isESConnected() && searchTerm) {
      try {
        const esClient = getESClient();
        const mustQueries = [{ match: { isActive: true } }];
        mustQueries.push({ multi_match: { query: searchTerm, fields: ['name^3', 'description', 'tags^2', 'category'] } });
        if (category && category !== 'All') mustQueries.push({ term: { category } });

        const filterQueries = [];
        if (minPrice || maxPrice) {
          filterQueries.push({ range: { price: { ...(minPrice && { gte: parseFloat(minPrice) }), ...(maxPrice && { lte: parseFloat(maxPrice) }) } } });
        }
        if (minRating) {
          filterQueries.push({ range: { 'ratings.average': { gte: parseFloat(minRating) } } });
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
        const products = await Product.find({ _id: { $in: ids } })
          .populate('vendorProfileId', 'storeName logo rating isApproved category storeSlug')
          .populate('vendorId', 'name email');
        const total = esResult.hits.total.value || 0;

        return sendSuccess(res, 200, 'Search results (Elasticsearch)', products, buildPaginationMeta(total, page, lim));
      } catch (esErr) {
        console.warn('ES search failed, falling back to MongoDB:', esErr.message);
      }
    }

    // MongoDB search & filter
    const filter = { isActive: true };
    if (searchTerm) {
      filter.$or = [
        { name: new RegExp(searchTerm, 'i') },
        { description: new RegExp(searchTerm, 'i') },
        { tags: new RegExp(searchTerm, 'i') },
        { category: new RegExp(searchTerm, 'i') },
      ];
    }
    if (category && category !== 'All') filter.category = new RegExp(category, 'i');
    if (subcategory) filter.subcategory = new RegExp(subcategory, 'i');
    if (minPrice || maxPrice) filter.price = { ...(minPrice && { $gte: parseFloat(minPrice) }), ...(maxPrice && { $lte: parseFloat(maxPrice) }) };
    if (minRating) filter['ratings.average'] = { $gte: parseFloat(minRating) };

    const sortMap = { 
      price_asc: { price: 1 }, 
      price_desc: { price: -1 }, 
      rating: { 'ratings.average': -1 }, 
      newest: { createdAt: -1 } 
    };
    const sortQuery = sortMap[sort] || { createdAt: -1 };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortQuery)
        .skip(skip)
        .limit(lim)
        .populate('vendorProfileId', 'storeName logo rating isApproved category storeSlug')
        .populate('vendorId', 'name email'),
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
    if (!isDbConnected()) {
      return res.status(500).json({ success: false, message: 'Database connection unavailable' });
    }

    const { id } = req.params;
    const product = await Product.findById(id)
      .populate('vendorProfileId', 'storeName logo rating totalSales storeSlug category')
      .populate('vendorId', 'name email');
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
    if (!isDbConnected()) {
      return res.status(500).json({ success: false, message: 'Database connection unavailable' });
    }

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

    const formattedImages = Array.isArray(images)
      ? images.map((img, idx) => typeof img === 'string' ? { url: img, isPrimary: idx === 0 } : img)
      : [];

    const formattedTags = Array.isArray(tags)
      ? tags.map(t => String(t).trim().toLowerCase())
      : typeof tags === 'string'
      ? tags.split(',').map(t => t.trim().toLowerCase())
      : [];

    const formattedSpecs = specs || attributes;
    const categoryRecord = await Category.findOrCreateByName(category);

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
      categoryId: categoryRecord._id,
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
    if (!isDbConnected()) {
      return res.status(500).json({ success: false, message: 'Database connection unavailable' });
    }

    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const query = req.user.role === 'admin' ? { _id: id } : { _id: id, vendorId: userId };
    const product = await Product.findOne(query);

    if (!product) {
      return sendError(res, 404, 'Product not found or you are not authorized to edit this product.');
    }

    if (req.body.title || req.body.name) product.name = (req.body.title || req.body.name).trim();
    if (req.body.description !== undefined) product.description = req.body.description;
    if (req.body.category) {
      product.category = req.body.category;
      const categoryRecord = await Category.findOrCreateByName(req.body.category);
      product.categoryId = categoryRecord._id;
    }
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
    if (!isDbConnected()) {
      return res.status(500).json({ success: false, message: 'Database connection unavailable' });
    }

    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const query = req.user.role === 'admin' ? { _id: id } : { _id: id, vendorId: userId };
    const product = await Product.findOne(query);

    if (!product) {
      return sendError(res, 404, 'Product not found or you are not authorized to delete it.');
    }

    product.isActive = false;
    await product.save();

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
      return res.status(500).json({ success: false, message: 'Database connection unavailable' });
    }
    const products = await Product.find({ isFeatured: true, isActive: true })
      .limit(12)
      .populate('vendorProfileId', 'storeName logo rating isApproved category storeSlug')
      .populate('vendorId', 'name email');
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
      return res.status(500).json({ success: false, message: 'Database connection unavailable' });
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
    if (!isDbConnected()) {
      return res.status(500).json({ success: false, message: 'Database connection unavailable' });
    }
    const { vendorId } = req.params;
    const products = await Product.find({ vendorId, isActive: true }).populate('vendorProfileId', 'storeName logo rating');
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
    if (!isDbConnected()) {
      return res.status(500).json({ success: false, message: 'Database connection unavailable' });
    }

    const userId = req.user._id || req.user.id;
    const { search = '', q = '', category = 'All', stockStatus = 'all', page = 1, limit = 20, sort = 'newest' } = req.query;
    const searchQuery = search || q;
    const { skip, limit: lim } = paginate(page, limit);

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
