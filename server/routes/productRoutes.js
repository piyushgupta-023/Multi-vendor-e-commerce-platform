const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// Public endpoints
router.get('/search', productController.searchProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/categories', productController.getCategories);
router.get('/by-vendor/:vendorId', productController.getProductsByVendor);
router.get('/', productController.searchProducts);
// Protected vendor/admin products endpoint (MUST be before /:id)
router.get('/my-products', protect, authorizeRoles('vendor', 'admin'), productController.getMyProducts);

router.get('/:id', productController.getProductById);

// Protected endpoints (Vendor and Admin)
router.post('/', protect, authorizeRoles('vendor', 'admin'), productController.createProduct);
router.put('/:id', protect, authorizeRoles('vendor', 'admin'), productController.updateProduct);
router.delete('/:id', protect, authorizeRoles('vendor', 'admin'), productController.deleteProduct);

module.exports = router;
