const express = require('express');
const router = express.Router();
const {
  createRazorpayOrder, verifyRazorpayPayment,
  createStripePaymentIntent, stripeWebhook,
  confirmCOD, downloadInvoice
} = require('../controllers/paymentController');
const { protect } = require('../middlewares/auth');

// Stripe webhook (raw body needed - handled in index.js)
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

router.use(protect);
router.post('/razorpay/create-order/:orderId', createRazorpayOrder);
router.post('/razorpay/verify', verifyRazorpayPayment);
router.post('/stripe/create-intent/:orderId', createStripePaymentIntent);
router.post('/cod/confirm/:orderId', confirmCOD);
router.get('/invoice/:orderId', downloadInvoice);

module.exports = router;
