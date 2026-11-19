const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// Admin protected routes
router.use(protect);
router.use(authorizeRoles('admin'));

// Analytics & Dashboard & Stats
router.get('/stats', adminController.getStats);
router.get('/dashboard', adminController.getDashboard);
router.get('/analytics', adminController.getDashboard);

// Products management
router.get('/products', adminController.getAllProducts);
router.post('/products', productController.createProduct);
router.put('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);

// Order management
router.get('/orders', adminController.getAllOrders);
router.patch('/orders/:id/status', adminController.updateOrderStatus);
router.get('/payment-splits', adminController.getPaymentSplits);

// Vendor management & approval toggle
router.get('/vendors', adminController.getAllVendors);
router.get('/vendors/pending', adminController.getPendingVendors);
router.patch('/vendors/:id/approve', adminController.approveVendor);
router.patch('/vendors/:id/reject', adminController.rejectVendor);
router.patch('/vendors/:id/toggle-approval', adminController.toggleVendorApproval);
router.patch('/vendors/:vendorProfileId/commission', adminController.updateCommissionRate);

// User management
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/toggle-status', adminController.toggleUserStatus);

module.exports = router;
