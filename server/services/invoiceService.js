const pdfService = require('./pdfService');

/**
 * Service to generate downloadable GST-compliant invoice
 */
exports.generateInvoiceBuffer = async (order) => {
  return await pdfService.generateInvoiceBuffer(order);
};

exports.generateInvoice = async (order) => {
  return await pdfService.generateInvoice(order);
};
