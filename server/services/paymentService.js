const PaymentSplit = require('../models/PaymentSplit');
const VendorProfile = require('../models/VendorProfile');
const Order = require('../models/Order');

/**
 * Calculate commission and vendor payouts for an order's sub-orders
 * @param {Object} order - Order object
 * @param {Array} subOrders - List of SubOrders for this order
 * @returns {Promise<Array>} Created PaymentSplit records
 */
exports.calculateAndCreateSplits = async (order, subOrders) => {
  const splits = [];

  for (const subOrder of subOrders) {
    const vendorProfile = await VendorProfile.findOne({ userId: subOrder.vendorId });
    const commissionRate = vendorProfile?.commissionRate || 10;
    const grossAmount = subOrder.subtotal;
    const commissionAmount = parseFloat(((grossAmount * commissionRate) / 100).toFixed(2));
    const netPayout = parseFloat((grossAmount - commissionAmount).toFixed(2));

    const split = await PaymentSplit.create({
      orderId: order._id,
      subOrderId: subOrder._id,
      vendorId: subOrder.vendorId,
      grossAmount,
      commissionRate,
      commissionAmount,
      netPayout,
      paymentGateway: order.paymentMethod,
      payoutStatus: 'pending',
    });

    splits.push(split);
  }

  return splits;
};

/**
 * Process vendor payouts (for admin trigger or automated cron)
 * @param {String} splitId
 */
exports.processVendorPayout = async (splitId) => {
  const split = await PaymentSplit.findById(splitId).populate('vendorId');
  if (!split) throw new Error('Payment split record not found');
  if (split.payoutStatus === 'paid') return split;

  // In test mode: simulate transfer success
  split.payoutStatus = 'paid';
  split.processedAt = new Date();
  split.razorpayTransferId = `trf_mock_rzp_${Date.now()}`;
  split.stripeTransferId = `tr_mock_stripe_${Date.now()}`;
  await split.save();

  // Update vendor profile earnings
  await VendorProfile.findOneAndUpdate(
    { userId: split.vendorId._id || split.vendorId },
    {
      $inc: { totalEarnings: split.netPayout },
      $dec: { pendingPayout: split.netPayout },
    }
  );

  return split;
};

module.exports = exports;
