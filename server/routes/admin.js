const express = require('express');
const router = express.Router();
const {
  getDashboard, getAllUsers, toggleUserStatus,
  getPendingVendors, approveVendor, rejectVendor,
  getAllOrders, getPaymentSplits, updateCommissionRate,
  moderateReview, featureProduct
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboard);

// User management
router.get('/users', getAllUsers);
router.patch('/users/:id/toggle-status', toggleUserStatus);

// Vendor management
router.get('/vendors/pending', getPendingVendors);
router.patch('/vendors/:id/approve', approveVendor);
router.patch('/vendors/:id/reject', rejectVendor);
router.patch('/vendors/:vendorProfileId/commission', updateCommissionRate);

// Order management
router.get('/orders', getAllOrders);

// Payment splits
router.get('/payment-splits', getPaymentSplits);

// Content moderation
router.patch('/reviews/:id/moderate', moderateReview);
router.patch('/products/:id/feature', featureProduct);

module.exports = router;
