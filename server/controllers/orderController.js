const Order = require('../models/Order');
const SubOrder = require('../models/SubOrder');
const Cart = require('../models/Cart');
const PaymentSplit = require('../models/PaymentSplit');
const VendorProfile = require('../models/VendorProfile');
const Product = require('../models/Product');
const cache = require('../config/redis');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { calculateCommission } = require('../utils/helpers');

exports.createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod = 'razorpay' } = req.body;
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart || cart.items.length === 0) return sendError(res, 400, 'Cart is empty');
    
    const order = await Order.create({
      customerId: req.user._id,
      items: cart.items.map(i => ({ productId: i.productId, vendorId: i.vendorId, name: i.name, image: i.image, price: i.price, quantity: i.quantity, subtotal: i.price * i.quantity })),
      shippingAddress,
      totalAmount: cart.totalAmount,
      subtotal: cart.totalAmount,
      paymentMethod,
      couponApplied: cart.couponApplied,
      discountAmount: cart.couponApplied?.discountAmount || 0,
    });
    
    // Group items by vendor and create SubOrders
    const vendorGroups = {};
    for (const item of cart.items) {
      const vendorId = item.vendorId.toString();
      if (!vendorGroups[vendorId]) vendorGroups[vendorId] = [];
      vendorGroups[vendorId].push(item);
    }
    
    for (const [vendorId, items] of Object.entries(vendorGroups)) {
      const vendorProfile = await VendorProfile.findOne({ userId: vendorId });
      const commissionRate = vendorProfile?.commissionRate || 10;
      const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
      const commissionAmount = calculateCommission(subtotal, commissionRate);
      const vendorPayout = subtotal - commissionAmount;
      
      const subOrder = await SubOrder.create({
        orderId: order._id,
        vendorId,
        customerId: req.user._id,
        items: items.map(i => ({ productId: i.productId, name: i.name, image: i.image, price: i.price, quantity: i.quantity, subtotal: i.price * i.quantity })),
        subtotal,
        commissionRate,
        commissionAmount,
        vendorPayout,
        statusHistory: [{ status: 'placed', note: 'Order placed successfully' }],
      });
      
      await PaymentSplit.create({
        orderId: order._id,
        subOrderId: subOrder._id,
        vendorId,
        grossAmount: subtotal,
        commissionRate,
        commissionAmount,
        netPayout: vendorPayout,
      });
      
      // Decrement stock for each product
      for (const item of items) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity, totalSold: item.quantity } });
      }
      
      // Update vendor stats
      if (vendorProfile) {
        vendorProfile.totalSales += 1;
        vendorProfile.totalEarnings += vendorPayout;
        vendorProfile.pendingPayout += vendorPayout;
        await vendorProfile.save({ validateBeforeSave: false });
      }
    }
    
    // Clear cart
    await Cart.findOneAndUpdate({ userId: req.user._id }, { items: [], totalAmount: 0, totalItems: 0, couponApplied: null });
    await cache.del(`cart:${req.user._id}`);
    
    return sendSuccess(res, 201, 'Order created successfully', order);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user._id }).sort({ createdAt: -1 }).limit(50);
    return sendSuccess(res, 200, 'Orders fetched', orders);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return sendError(res, 404, 'Order not found');
    if (order.customerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendError(res, 403, 'Access denied');
    }
    const subOrders = await SubOrder.find({ orderId: order._id });
    return sendSuccess(res, 200, 'Order details', { order, subOrders });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

exports.updateSubOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber, note } = req.body;
    const subOrder = await SubOrder.findById(req.params.id);
    if (!subOrder) return sendError(res, 404, 'SubOrder not found');
    if (subOrder.vendorId.toString() !== req.user._id.toString()) return sendError(res, 403, 'Access denied');
    
    subOrder.status = status;
    subOrder.statusHistory.push({ status, note, updatedBy: req.user._id });
    if (trackingNumber) subOrder.trackingNumber = trackingNumber;
    if (status === 'delivered') subOrder.deliveredAt = new Date();
    if (status === 'cancelled') subOrder.cancelledAt = new Date();
    
    await subOrder.save();
    return sendSuccess(res, 200, 'Status updated', subOrder);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return sendError(res, 404, 'Order not found');
    if (order.customerId.toString() !== req.user._id.toString()) return sendError(res, 403, 'Access denied');
    if (order.paymentStatus === 'paid') return sendError(res, 400, 'Paid orders must be cancelled via support');
    
    await Order.findByIdAndUpdate(order._id, { paymentStatus: 'failed' });
    await SubOrder.updateMany({ orderId: order._id }, { status: 'cancelled', cancelledAt: new Date(), cancellationReason: req.body.reason });
    
    return sendSuccess(res, 200, 'Order cancelled');
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};
