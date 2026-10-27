const PDFDocument = require('pdfkit');

/**
 * Generate a PDF invoice buffer for a given order using PDFKit
 * @param {Object} order - Populated Mongoose order document
 * @returns {Promise<Buffer>}
 */
exports.generateInvoiceBuffer = (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Header
      doc
        .fontSize(24)
        .fillColor('#4f46e5')
        .text('MarketNest', 40, 40)
        .fontSize(9)
        .fillColor('#6b7280')
        .text('Enterprise Multi-Vendor Marketplace', 40, 68)
        .text('www.marketnest.in | support@marketnest.in', 40, 80);

      // Invoice info block
      doc
        .fontSize(16)
        .fillColor('#111827')
        .text('TAX INVOICE', 380, 40, { align: 'right' })
        .fontSize(9)
        .fillColor('#4b5563')
        .text(`Invoice No: INV-${order.orderNumber || order._id}`, 380, 62, { align: 'right' })
        .text(`Order Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN')}`, 380, 74, { align: 'right' })
        .text(`Payment: ${order.paymentMethod ? order.paymentMethod.toUpperCase() : 'ONLINE'} (${order.paymentStatus || 'PAID'})`, 380, 86, { align: 'right' });

      doc.moveTo(40, 110).lineTo(555, 110).strokeColor('#e5e7eb').lineWidth(1).stroke();

      // Customer Details
      doc
        .fontSize(11)
        .fillColor('#111827')
        .text('Billed To:', 40, 125)
        .fontSize(9)
        .fillColor('#4b5563')
        .text(order.shippingAddress?.name || order.customerId?.name || 'Valued Customer', 40, 142)
        .text(order.shippingAddress?.street || '123 Market St', 40, 154)
        .text(`${order.shippingAddress?.city || ''} ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.pincode || ''}`, 40, 166)
        .text(`Phone: ${order.shippingAddress?.phone || 'N/A'}`, 40, 178);

      // Table Header
      let y = 210;
      doc.rect(40, y, 515, 24).fill('#f3f4f6');
      doc
        .fontSize(9)
        .fillColor('#374151')
        .text('Item Description', 48, y + 7)
        .text('Qty', 340, y + 7, { width: 40, align: 'center' })
        .text('Price (INR)', 390, y + 7, { width: 70, align: 'right' })
        .text('Total (INR)', 470, y + 7, { width: 75, align: 'right' });

      // Table Rows
      y += 28;
      const items = order.items || [];
      items.forEach((item, index) => {
        const rowBg = index % 2 === 0 ? '#ffffff' : '#fafafa';
        doc.rect(40, y - 4, 515, 20).fill(rowBg);

        doc
          .fontSize(9)
          .fillColor('#1f2937')
          .text(item.name || 'Marketplace Item', 48, y, { width: 280, ellipsis: true })
          .text(String(item.quantity || 1), 340, y, { width: 40, align: 'center' })
          .text(`₹${(item.price || 0).toLocaleString('en-IN')}`, 390, y, { width: 70, align: 'right' })
          .text(`₹${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}`, 470, y, { width: 75, align: 'right' });

        y += 22;
      });

      // Summary section
      y = Math.max(y + 10, 360);
      doc.moveTo(350, y).lineTo(555, y).strokeColor('#e5e7eb').lineWidth(1).stroke();
      y += 8;

      doc
        .fontSize(9)
        .fillColor('#6b7280')
        .text('Subtotal:', 350, y)
        .fillColor('#111827')
        .text(`₹${(order.subtotal || order.totalAmount || 0).toLocaleString('en-IN')}`, 470, y, { width: 75, align: 'right' });

      if (order.discountAmount > 0) {
        y += 16;
        doc
          .fillColor('#10b981')
          .text(`Discount (${order.couponApplied?.code || 'COUPON'}):`, 350, y)
          .text(`-₹${order.discountAmount.toLocaleString('en-IN')}`, 470, y, { width: 75, align: 'right' });
      }

      if (order.shippingCharge > 0) {
        y += 16;
        doc
          .fillColor('#6b7280')
          .text('Shipping:', 350, y)
          .fillColor('#111827')
          .text(`₹${order.shippingCharge.toLocaleString('en-IN')}`, 470, y, { width: 75, align: 'right' });
      }

      y += 20;
      doc.rect(340, y - 4, 215, 26).fill('#eef2ff');
      doc
        .fontSize(11)
        .fillColor('#4338ca')
        .text('Grand Total:', 350, y + 2)
        .text(`₹${(order.totalAmount || 0).toLocaleString('en-IN')}`, 450, y + 2, { width: 95, align: 'right' });

      // Footer note
      doc
        .fontSize(8)
        .fillColor('#9ca3af')
        .text('This is a computer-generated invoice and does not require a physical signature.', 40, 750, { align: 'center' })
        .text('Thank you for shopping on MarketNest Multi-Vendor Marketplace!', 40, 762, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generate invoice and return local/mock URL
 * @param {Object} order
 * @returns {Promise<string>}
 */
exports.generateInvoice = async (order) => {
  return `/api/payments/orders/${order._id}/invoice`;
};
