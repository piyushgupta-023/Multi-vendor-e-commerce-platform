const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const orderController = require('../controllers/orderController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// Public storefront listing for marketplace display (No auth required)
router.get('/public', vendorController.getPublicVendors);
router.get('/public/:id', vendorController.getPublicVendorById);

// All subsequent vendor routes are protected for Vendor and Admin roles
router.use(protect);
router.use(authorizeRoles('vendor', 'admin'));

// Vendor Profile & Analytics
router.get('/profile', vendorController.getProfile);
router.put('/profile', vendorController.updateProfile);
router.get('/products', vendorController.getVendorProducts);
router.get('/stats', vendorController.getStats);
router.get('/dashboard', vendorController.getDashboard);

// Vendor Order Fulfillment & Lifecycle
router.get('/orders', orderController.getVendorOrders);
router.patch('/orders/:subOrderId/status', orderController.updateSubOrderStatus);
router.put('/orders/:subOrderId/status', orderController.updateSubOrderStatus);

module.exports = router;
