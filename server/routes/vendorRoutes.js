const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// All vendor routes are protected for Vendor and Admin roles
router.use(protect);
router.use(authorizeRoles('vendor', 'admin'));

router.get('/profile', vendorController.getProfile);
router.put('/profile', vendorController.updateProfile);
router.get('/products', vendorController.getVendorProducts);
router.get('/stats', vendorController.getStats);
router.get('/dashboard', vendorController.getDashboard);

module.exports = router;
