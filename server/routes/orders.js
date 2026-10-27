const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getOrderById, updateSubOrderStatus, cancelOrder } = require('../controllers/orderController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);
router.post('/create', authorize('customer'), createOrder);
router.get('/my-orders', authorize('customer'), getMyOrders);
router.get('/:id', getOrderById);
router.put('/suborder/:id/status', authorize('vendor'), updateSubOrderStatus);
router.post('/:id/cancel', authorize('customer'), cancelOrder);

module.exports = router;
