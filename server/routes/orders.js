const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(protect);

// Customer Checkout & Orders
router.post('/checkout', orderController.checkout);
router.post('/create', orderController.checkout); // Alias
router.get('/my-orders', orderController.getMyOrders);
router.get('/:id/invoice', orderController.downloadInvoice);
router.get('/:id', orderController.getOrderById);

// Vendor Order Lifecycle updates via /api/orders (if called directly)
router.get('/vendor/all', authorizeRoles('vendor', 'admin'), orderController.getVendorOrders);
router.patch('/suborder/:subOrderId/status', authorizeRoles('vendor', 'admin'), orderController.updateSubOrderStatus);
router.put('/suborder/:subOrderId/status', authorizeRoles('vendor', 'admin'), orderController.updateSubOrderStatus);

module.exports = router;
