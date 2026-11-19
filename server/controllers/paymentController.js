const Razorpay = require('razorpay');
const stripe = require('stripe');
const crypto = require('crypto');
const Order = require('../models/Order');
const PaymentSplit = require('../models/PaymentSplit');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const pdfService = require('../services/pdfService');

// Lazy-init payment gateways
const getRazorpay = () => {
  if (
    !process.env.RAZORPAY_KEY_ID
    || !process.env.RAZORPAY_KEY_SECRET
    || process.env.RAZORPAY_KEY_ID === 'your_razorpay_key'
  ) return null;
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
};

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_your_stripe_key') return null;
  return stripe(process.env.STRIPE_SECRET_KEY);
};

// ─── Razorpay ───────────────────────────────────────────────────────────────

exports.createRazorpayOrder = async (req, res) => {
  try {
    const razorpay = getRazorpay();
    if (!razorpay) {
      return sendError(res, 503, 'Razorpay is not configured. Add the test Key ID and Key Secret to server/.env.');
    }
    
    const order = await Order.findById(req.params.orderId);
    if (!order) return sendError(res, 404, 'Order not found');
    if (order.customerId.toString() !== req.user._id.toString()) return sendError(res, 403, 'Access denied');
    
    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(order.totalAmount * 100), // paise
      currency: 'INR',
      receipt: order.orderNumber,
    });
    
    await Order.findByIdAndUpdate(order._id, { razorpayOrderId: rzpOrder.id });
    
    return sendSuccess(res, 200, 'Razorpay order created', {
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return sendError(res, 503, 'Razorpay verification is not configured.');
    }
    
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
    
    if (expectedSignature !== razorpay_signature) return sendError(res, 400, 'Payment verification failed');
    
    const order = await Order.findById(orderId);
    if (!order) return sendError(res, 404, 'Order not found');
    if (order.customerId.toString() !== req.user._id.toString()) return sendError(res, 403, 'Access denied');

    order.paymentStatus = 'paid';
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();
    
    // Generate invoice
    try {
      const invoiceUrl = await pdfService.generateInvoice(order);
      await Order.findByIdAndUpdate(orderId, { invoiceUrl });
    } catch (pdfErr) {
      console.warn('Invoice generation failed:', pdfErr.message);
    }
    
    return sendSuccess(res, 200, 'Payment verified successfully', { order });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// ─── Stripe ──────────────────────────────────────────────────────────────────

exports.createStripePaymentIntent = async (req, res) => {
  try {
    const stripeClient = getStripe();
    if (!stripeClient) return sendError(res, 503, 'Stripe not configured');
    
    const order = await Order.findById(req.params.orderId);
    if (!order) return sendError(res, 404, 'Order not found');
    if (order.customerId.toString() !== req.user._id.toString()) return sendError(res, 403, 'Access denied');
    
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: Math.round(order.totalAmount * 100), // cents
      currency: 'inr',
      metadata: { orderId: order._id.toString(), orderNumber: order.orderNumber },
    });
    
    await Order.findByIdAndUpdate(order._id, { stripePaymentIntentId: paymentIntent.id });
    
    return sendSuccess(res, 200, 'Payment intent created', { clientSecret: paymentIntent.client_secret });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

exports.stripeWebhook = async (req, res) => {
  try {
    const stripeClient = getStripe();
    if (!stripeClient) return res.status(503).json({ message: 'Stripe not configured' });
    
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
      event = stripeClient.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      return res.status(400).json({ message: `Webhook Error: ${err.message}` });
    }
    
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      await Order.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntent.id },
        { paymentStatus: 'paid' }
      );
    }
    
    res.json({ received: true });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// ─── COD ─────────────────────────────────────────────────────────────────────

exports.confirmCOD = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return sendError(res, 404, 'Order not found');
    if (order.paymentMethod !== 'cod') return sendError(res, 400, 'Not a COD order');
    if (order.customerId.toString() !== req.user._id.toString()) return sendError(res, 403, 'Access denied');
    
    await Order.findByIdAndUpdate(order._id, { paymentStatus: 'pending' }); // COD stays pending until delivery
    return sendSuccess(res, 200, 'COD order confirmed');
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

exports.downloadInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('customerId', 'name email');
    if (!order) return sendError(res, 404, 'Order not found');
    if (order.customerId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendError(res, 403, 'Access denied');
    }
    
    const pdfBuffer = await pdfService.generateInvoiceBuffer(order);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};
