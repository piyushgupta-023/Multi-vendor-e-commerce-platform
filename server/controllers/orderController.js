const Order = require('../models/Order');
const SubOrder = require('../models/SubOrder');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const VendorProfile = require('../models/VendorProfile');
const PaymentSplit = require('../models/PaymentSplit');
const redisService = require('../services/redisService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * POST /api/orders/checkout
 * Multi-Vendor Checkout: Groups items by vendorId, creates master Order and per-vendor SubOrders
 */
exports.checkout = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { shippingAddress, paymentMethod = 'cod', items: bodyItems } = req.body;

    // Validate shipping address
    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.pincode) {
      return sendError(res, 400, 'Complete shipping address is required (street, city, pincode)');
    }

    // Determine checkout items: from body or from cart
    let checkoutItems = [];
    if (Array.isArray(bodyItems) && bodyItems.length > 0) {
      checkoutItems = bodyItems;
    } else {
      // Look in Redis or MongoDB cart
      const cached = await redisService.getCart(userId);
      if (cached && Array.isArray(cached.items) && cached.items.length > 0) {
        checkoutItems = cached.items;
      } else {
        const dbCart = await Cart.findOne({ userId });
        if (dbCart && dbCart.items.length > 0) {
          checkoutItems = dbCart.items;
        }
      }
    }

    if (!checkoutItems || checkoutItems.length === 0) {
      return sendError(res, 400, 'Your cart is empty. Please add products before checking out.');
    }

    // Fetch products to ensure real-time prices, vendor assignment, and stock validation
    const productIds = checkoutItems.map(i => i.productId?._id || i.productId || i.id);
    const dbProducts = await Product.find({ _id: { $in: productIds } }).populate('vendorProfileId');
    const productMap = new Map();
    dbProducts.forEach(p => productMap.set(p._id.toString(), p));

    // Validate stock and group items by vendor
    const vendorGroups = {};
    let subtotal = 0;
    const orderItems = [];

    for (const item of checkoutItems) {
      const pId = (item.productId?._id || item.productId || item.id || item._id).toString();
      const product = productMap.get(pId);

      const itemQty = parseInt(item.quantity || 1, 10);
      const itemPrice = product ? product.price : parseFloat(item.price) || 0;
      const itemName = product ? product.name : (item.name || item.title || 'Product');
      const itemImage = product?.images?.[0]?.url || item.image || item.images?.[0]?.url || item.images?.[0] || '';
      
      // Determine Vendor User ID (fallback to vendorProfile.userId or mock vendor)
      let vendorId = product?.vendorId || item.vendorId;
      if (!vendorId && product?.vendorProfileId?.userId) {
        vendorId = product.vendorProfileId.userId;
      }
      if (!vendorId) {
        vendorId = userId; // fallback for standalone testing
      }
      const vendorIdStr = vendorId.toString();

      const itemSubtotal = itemPrice * itemQty;
      subtotal += itemSubtotal;

      const orderItemRecord = {
        productId: product ? product._id : null,
        vendorId,
        name: itemName,
        image: itemImage,
        price: itemPrice,
        quantity: itemQty,
        subtotal: itemSubtotal,
      };
      orderItems.push(orderItemRecord);

      if (!vendorGroups[vendorIdStr]) {
        vendorGroups[vendorIdStr] = [];
      }
      vendorGroups[vendorIdStr].push(orderItemRecord);

      // Decrement product inventory if in DB
      if (product) {
        await Product.findByIdAndUpdate(product._id, {
          $inc: { stock: -itemQty, totalSold: itemQty }
        });
      }
    }

    // Shipping and taxes calculation
    const shippingCharge = subtotal > 999 ? 0 : 99;
    const taxAmount = Math.round(subtotal * 0.18); // 18% GST standard
    const totalAmount = subtotal + shippingCharge + taxAmount;

    // Create Master Order
    const order = await Order.create({
      customerId: userId,
      items: orderItems,
      shippingAddress: {
        name: shippingAddress.name || req.user.name || 'Valued Customer',
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state || 'Delhi',
        pincode: shippingAddress.pincode,
        country: shippingAddress.country || 'India',
        phone: shippingAddress.phone || '9876543210',
      },
      subtotal,
      shippingCharge,
      taxAmount,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
    });

    // Create SubOrder per vendor
    const createdSubOrders = [];

    for (const [vendorIdStr, items] of Object.entries(vendorGroups)) {
      // Retrieve vendor commission rate if profile exists
      const vendorProfile = await VendorProfile.findOne({
        $or: [{ userId: vendorIdStr }, { _id: vendorIdStr }]
      });

      const commissionRate = vendorProfile?.commissionRate || 10; // 10% standard platform take
      const vendorSubtotal = items.reduce((s, i) => s + i.subtotal, 0);
      const commissionAmount = Math.round((vendorSubtotal * commissionRate) / 100);
      const vendorPayout = vendorSubtotal - commissionAmount;

      const subOrder = await SubOrder.create({
        orderId: order._id,
        vendorId: vendorIdStr,
        customerId: userId,
        items,
        subtotal: vendorSubtotal,
        commissionRate,
        commissionAmount,
        vendorPayout,
        status: 'placed',
        statusHistory: [
          {
            status: 'placed',
            note: 'Order placed by customer via Multi-Vendor Checkout',
            timestamp: new Date(),
            updatedBy: userId,
          }
        ],
        courierPartner: 'MarketNest Express',
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days estimate
      });

      createdSubOrders.push(subOrder);

      // Create Payment Split record for accounting
      try {
        await PaymentSplit.create({
          orderId: order._id,
          subOrderId: subOrder._id,
          vendorId: vendorIdStr,
          grossAmount: vendorSubtotal,
          commissionRate,
          commissionAmount,
          netPayout: vendorPayout,
          status: paymentMethod === 'cod' ? 'pending' : 'settled',
        });
      } catch {}

      // Update Vendor stats if profile exists
      if (vendorProfile) {
        vendorProfile.totalSales = (vendorProfile.totalSales || 0) + items.length;
        vendorProfile.totalEarnings = (vendorProfile.totalEarnings || 0) + vendorPayout;
        vendorProfile.pendingPayout = (vendorProfile.pendingPayout || 0) + vendorPayout;
        await vendorProfile.save({ validateBeforeSave: false });
      }
    }

    // Clear User Cart from DB and Redis
    await Cart.findOneAndUpdate(
      { userId },
      { items: [], totalAmount: 0, totalItems: 0, couponApplied: null }
    );
    await redisService.clearCart(userId);

    return sendSuccess(res, 201, 'Order placed successfully', {
      order,
      subOrders: createdSubOrders,
    });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

/**
 * GET /api/orders/my-orders
 * Customer view of their past orders with live delivery status
 */
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const orders = await Order.find({ customerId: userId }).sort({ createdAt: -1 }).lean();

    // Attach subOrders to each order for complete multi-vendor tracking
    const orderIds = orders.map(o => o._id);
    const subOrders = await SubOrder.find({ orderId: { $in: orderIds } }).lean();

    const subOrderMap = new Map();
    subOrders.forEach(so => {
      const oId = so.orderId.toString();
      if (!subOrderMap.has(oId)) subOrderMap.set(oId, []);
      subOrderMap.get(oId).push(so);
    });

    const ordersWithTracking = orders.map(order => ({
      ...order,
      subOrders: subOrderMap.get(order._id.toString()) || [],
    }));

    return sendSuccess(res, 200, 'Orders fetched successfully', ordersWithTracking);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

/**
 * GET /api/orders/:id
 * Single order details
 */
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return sendError(res, 404, 'Order not found');

    const subOrders = await SubOrder.find({ orderId: order._id }).lean();
    return sendSuccess(res, 200, 'Order retrieved', { order, subOrders });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

/**
 * GET /api/vendor/orders
 * Vendor view: sub-orders assigned to the logged-in vendor's catalog
 */
exports.getVendorOrders = async (req, res) => {
  try {
    const vendorUserId = req.user._id || req.user.id;

    // Check if admin is requesting
    let filter = {};
    if (req.user.role === 'admin') {
      // Admin sees all or by vendor filter
      if (req.query.vendorId) {
        filter = { vendorId: req.query.vendorId };
      }
    } else {
      // Vendor sees only their sub-orders
      filter = { vendorId: vendorUserId };
    }

    const subOrders = await SubOrder.find(filter)
      .populate('orderId', 'orderNumber shippingAddress paymentMethod paymentStatus createdAt')
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, 200, 'Vendor sub-orders fetched successfully', subOrders);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

/**
 * PATCH /api/vendor/orders/:subOrderId/status
 * Advance sub-order lifecycle: placed → packed → shipped → delivered
 */
exports.updateSubOrderStatus = async (req, res) => {
  try {
    const { subOrderId } = req.params;
    const { status, trackingNumber, courierPartner, note } = req.body;
    const allowedStatuses = ['placed', 'packed', 'shipped', 'delivered', 'cancelled'];

    if (!status || !allowedStatuses.includes(status)) {
      return sendError(res, 400, `Invalid status. Allowed: ${allowedStatuses.join(', ')}`);
    }

    const subOrder = await SubOrder.findById(subOrderId);
    if (!subOrder) {
      return sendError(res, 404, 'SubOrder record not found');
    }

    // Role check: Only the owning vendor or admin can update status
    const currentUserId = (req.user._id || req.user.id).toString();
    if (req.user.role !== 'admin' && subOrder.vendorId.toString() !== currentUserId) {
      return sendError(res, 403, 'Unauthorized. You do not own this sub-order fulfillment.');
    }

    subOrder.status = status;
    if (trackingNumber) subOrder.trackingNumber = trackingNumber;
    if (courierPartner) subOrder.courierPartner = courierPartner;
    if (status === 'delivered') subOrder.deliveredAt = new Date();
    if (status === 'cancelled') subOrder.cancelledAt = new Date();

    subOrder.statusHistory.push({
      status,
      note: note || `Order marked as ${status} by ${req.user.role === 'admin' ? 'Admin' : 'Vendor'}`,
      timestamp: new Date(),
      updatedBy: req.user._id,
    });

    await subOrder.save();

    return sendSuccess(res, 200, `Order lifecycle updated to ${status}`, subOrder);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

/**
 * GET /api/orders/:id/invoice
 * Download GST-compliant PDF invoice
 */
exports.downloadInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('customerId', 'name email').lean();
    if (!order) return sendError(res, 404, 'Order not found');

    const invoiceService = require('../services/invoiceService');
    const pdfBuffer = await invoiceService.generateInvoiceBuffer(order);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${order.orderNumber || order._id}.pdf`);
    return res.send(pdfBuffer);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};
