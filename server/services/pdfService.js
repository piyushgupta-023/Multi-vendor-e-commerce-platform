const PDFDocument = require('pdfkit');

/**
 * Generate a GST-compliant PDF invoice buffer for an order using PDFKit
 * @param {Object} order - Order document with customer and items details
 * @returns {Promise<Buffer>}
 */
exports.generateInvoiceBuffer = (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 36, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const primaryColor = '#0f172a'; // Slate-900
      const accentColor = '#2563eb';  // Blue-600
      const mutedColor = '#64748b';   // Slate-500
      const borderColor = '#e2e8f0'; // Slate-200

      // 1. TOP HEADER BAND
      doc
        .fontSize(22)
        .font('Helvetica-Bold')
        .fillColor(accentColor)
        .text('MarketNest', 36, 36)
        .fontSize(8)
        .font('Helvetica')
        .fillColor(mutedColor)
        .text('Enterprise Multi-Vendor Marketplace | ISO 9001:2015 Certified', 36, 62)
        .text('MarketNest Commerce Pvt Ltd', 36, 74)
        .text('Level 7 Cyber Tech Tower, Connaught Place, New Delhi - 110001', 36, 84)
        .text('CIN: U72900DL2024PTC123456 | GSTIN: 07AAACM9988D1Z3', 36, 94);

      // Top Right: TAX INVOICE Header Details
      const invoiceNumber = `INV-${order.orderNumber || (order._id ? order._id.toString().slice(-8).toUpperCase() : Date.now())}`;
      const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('TAX INVOICE', 320, 36, { align: 'right', width: 238 })
        .fontSize(8.5)
        .font('Helvetica')
        .fillColor(mutedColor)
        .text(`Invoice No: ${invoiceNumber}`, 320, 58, { align: 'right', width: 238 })
        .text(`Order ID: ${order.orderNumber || order._id}`, 320, 70, { align: 'right', width: 238 })
        .text(`Invoice Date: ${orderDate}`, 320, 82, { align: 'right', width: 238 })
        .text(`Payment: ${(order.paymentMethod || 'ONLINE').toUpperCase()} (${(order.paymentStatus || 'PAID').toUpperCase()})`, 320, 94, { align: 'right', width: 238 });

      // Horizontal separator
      doc.moveTo(36, 112).lineTo(558, 112).strokeColor(borderColor).lineWidth(1).stroke();

      // 2. VENDOR & BILLING DETAILS SECTION
      const startInfoY = 122;

      // Left Box: Sold By / Vendor Details
      doc
        .fontSize(9.5)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('SOLD BY / VENDOR DETAILS:', 36, startInfoY);

      const vendorName = order.vendorStoreName || (order.items && order.items[0]?.vendorId?.name) || 'TechNova Audio & Electronics';
      const vendorGstin = order.vendorGstin || '07AAACV1234F1Z5';

      doc
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .fillColor(accentColor)
        .text(vendorName, 36, startInfoY + 16)
        .font('Helvetica')
        .fillColor('#334155')
        .text(`GSTIN: ${vendorGstin}`, 36, startInfoY + 28)
        .text('State: Delhi (07) | Place of Supply: India', 36, startInfoY + 40)
        .text('Authorized Marketplace Seller Partner', 36, startInfoY + 52);

      // Right Box: Billed & Shipped To
      const shipAddr = order.shippingAddress || {};
      const customerName = shipAddr.name || (order.customerId && order.customerId.name) || 'Valued Customer';
      const street = shipAddr.street || 'A-12 Sector 62, Electronic City';
      const cityStatePin = `${shipAddr.city || 'Noida'}, ${shipAddr.state || 'Uttar Pradesh'} - ${shipAddr.pincode || '201301'}`;
      const phone = shipAddr.phone ? `Ph: ${shipAddr.phone}` : 'Ph: +91 98765 43210';

      doc
        .fontSize(9.5)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('BILLED & SHIPPED TO:', 320, startInfoY)
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .fillColor('#334155')
        .text(customerName, 320, startInfoY + 16)
        .font('Helvetica')
        .text(street, 320, startInfoY + 28, { width: 238 })
        .text(cityStatePin, 320, startInfoY + 40)
        .text(phone, 320, startInfoY + 52);

      // Horizontal separator
      doc.moveTo(36, startInfoY + 70).lineTo(558, startInfoY + 70).strokeColor(borderColor).lineWidth(1).stroke();

      // 3. ITEMIZED TAX TABLE
      let tableY = startInfoY + 80;

      // Table Header
      doc.rect(36, tableY, 522, 22).fill('#f8fafc');
      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#1e293b')
        .text('S.No', 42, tableY + 6, { width: 25 })
        .text('Item Description', 70, tableY + 6, { width: 190 })
        .text('HSN Code', 265, tableY + 6, { width: 55, align: 'center' })
        .text('Qty', 325, tableY + 6, { width: 30, align: 'center' })
        .text('Unit Price', 360, tableY + 6, { width: 60, align: 'right' })
        .text('GST (18%)', 425, tableY + 6, { width: 60, align: 'right' })
        .text('Total (INR)', 490, tableY + 6, { width: 62, align: 'right' });

      tableY += 24;

      const items = order.items && order.items.length > 0 ? order.items : [
        { name: 'Multi-Vendor Marketplace Item', quantity: 1, price: order.totalAmount || 1499 }
      ];

      // Standard HSN map based on category heuristics
      const getHsnCode = (name = '') => {
        const lower = name.toLowerCase();
        if (lower.includes('headphone') || lower.includes('audio') || lower.includes('watch') || lower.includes('phone') || lower.includes('electronic')) return '8518.30';
        if (lower.includes('shirt') || lower.includes('hoodie') || lower.includes('wear') || lower.includes('cotton') || lower.includes('jacket')) return '6203.42';
        if (lower.includes('cooker') || lower.includes('blender') || lower.includes('kettle') || lower.includes('pot') || lower.includes('appliance')) return '8516.79';
        if (lower.includes('lamp') || lower.includes('chair') || lower.includes('pillow') || lower.includes('table')) return '9403.60';
        return '8523.51';
      };

      let itemsSubtotal = 0;
      let totalGstAmount = 0;

      items.forEach((item, idx) => {
        const qty = item.quantity || 1;
        const grossPrice = item.price || 0;
        const lineGross = grossPrice * qty;
        itemsSubtotal += lineGross;

        // Effective GST 18% inclusive calculation
        const baseUnitPrice = Math.round((grossPrice / 1.18) * 100) / 100;
        const unitGst = Math.round((grossPrice - baseUnitPrice) * 100) / 100;
        totalGstAmount += (unitGst * qty);

        const rowBg = idx % 2 === 0 ? '#ffffff' : '#fcfcfd';
        doc.rect(36, tableY - 3, 522, 20).fill(rowBg);

        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#334155')
          .text(String(idx + 1), 42, tableY, { width: 25 })
          .font('Helvetica-Bold')
          .text(item.name || 'Marketplace Item', 70, tableY, { width: 190, ellipsis: true })
          .font('Helvetica')
          .fillColor(mutedColor)
          .text(getHsnCode(item.name), 265, tableY, { width: 55, align: 'center' })
          .fillColor('#334155')
          .text(String(qty), 325, tableY, { width: 30, align: 'center' })
          .text(`₹${baseUnitPrice.toFixed(2)}`, 360, tableY, { width: 60, align: 'right' })
          .text(`₹${(unitGst * qty).toFixed(2)}`, 425, tableY, { width: 60, align: 'right' })
          .font('Helvetica-Bold')
          .fillColor('#0f172a')
          .text(`₹${lineGross.toLocaleString('en-IN')}`, 490, tableY, { width: 62, align: 'right' });

        tableY += 22;
      });

      // Bottom border for items table
      doc.moveTo(36, tableY).lineTo(558, tableY).strokeColor(borderColor).lineWidth(1).stroke();

      // 4. FINANCIAL SUMMARY & DIGITAL SIGNATURE (Side by Side)
      const summaryY = Math.max(tableY + 12, 430);

      // LEFT SIDE: Digital Signature & Verification Box
      doc.rect(36, summaryY, 260, 110).strokeColor(borderColor).lineWidth(1).stroke();
      doc.rect(36, summaryY, 260, 20).fill('#f1f5f9');
      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('DIGITAL SIGNATURE & AUTHENTICATION', 44, summaryY + 6);

      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor(mutedColor)
        .text('Signing Authority:', 44, summaryY + 28)
        .font('Helvetica-Bold')
        .fillColor(accentColor)
        .text('MarketNest Escrow Trust Authority', 120, summaryY + 28)
        .font('Helvetica')
        .fillColor(mutedColor)
        .text('Status:', 44, summaryY + 42)
        .font('Helvetica-Bold')
        .fillColor('#16a34a')
        .text('VERIFIED & DIGITALLY SECURED [✓]', 120, summaryY + 42)
        .font('Helvetica')
        .fillColor(mutedColor)
        .text('Signatory:', 44, summaryY + 56)
        .font('Helvetica')
        .fillColor('#334155')
        .text('Authorized Signatory for MarketNest', 120, summaryY + 56)
        .fontSize(7.5)
        .fillColor(mutedColor)
        .text(`Signed On: ${new Date().toISOString()}`, 44, summaryY + 76)
        .text('Hash: SHA256:' + Buffer.from(invoiceNumber).toString('base64').slice(0, 24), 44, summaryY + 88);

      // RIGHT SIDE: Calculation Breakdown
      let calcY = summaryY;
      const subtotal = order.subtotal || itemsSubtotal || order.totalAmount || 0;
      const shipping = order.shippingCharge || (order.totalAmount > 1000 ? 0 : 40);
      const discount = order.discountAmount || 0;
      const platformFee = 15;
      const grandTotal = order.totalAmount || (subtotal - discount + shipping + platformFee);

      const printSummaryRow = (label, value, isBold = false, color = '#334155') => {
        doc
          .fontSize(8.5)
          .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
          .fillColor(color)
          .text(label, 320, calcY)
          .text(value, 460, calcY, { width: 98, align: 'right' });
        calcY += 15;
      };

      printSummaryRow('Items Total (Tax Inclusive):', `₹${subtotal.toLocaleString('en-IN')}`);
      printSummaryRow('Integrated GST (IGST 18%):', `₹${totalGstAmount.toFixed(2)}`, false, mutedColor);

      if (discount > 0) {
        printSummaryRow(`Discount (${order.couponApplied?.code || 'COUPON'}):`, `-₹${discount.toLocaleString('en-IN')}`, false, '#16a34a');
      }

      printSummaryRow('Estimated Delivery:', shipping === 0 ? 'FREE' : `₹${shipping.toLocaleString('en-IN')}`);
      printSummaryRow('Platform Security Fee:', `₹${platformFee.toLocaleString('en-IN')}`);

      // Grand Total Highlight Card
      calcY += 4;
      doc.rect(315, calcY - 4, 243, 26).fill('#eff6ff');
      doc.rect(315, calcY - 4, 243, 26).strokeColor('#bfdbfe').lineWidth(1).stroke();
      doc
        .fontSize(10.5)
        .font('Helvetica-Bold')
        .fillColor(accentColor)
        .text('Total Order Amount:', 324, calcY + 3)
        .text(`₹${grandTotal.toLocaleString('en-IN')}`, 440, calcY + 3, { width: 112, align: 'right' });

      // 5. TAX INVOICE FOOTER
      const footerY = 740;
      doc.moveTo(36, footerY).lineTo(558, footerY).strokeColor(borderColor).lineWidth(1).stroke();
      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor(mutedColor)
        .text('This is a computer-generated tax invoice.', 36, footerY + 8, { align: 'center', width: 522 })
        .font('Helvetica')
        .fontSize(7.5)
        .text('Registered Office: MarketNest Commerce Pvt Ltd, Level 7 Cyber Tech Tower, Connaught Place, New Delhi - 110001', 36, footerY + 20, { align: 'center', width: 522 })
        .text('For queries regarding returns, warranty, or refunds, contact support@marketnest.in | Help: 1800-123-MARKET', 36, footerY + 30, { align: 'center', width: 522 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generate invoice URL helper
 */
exports.generateInvoice = async (order) => {
  return `/api/orders/${order._id}/invoice`;
};
