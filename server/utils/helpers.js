const generateSKU = (name, vendorId) => {
  const prefix = name.substring(0, 3).toUpperCase();
  const vendor = vendorId.toString().slice(-4).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${vendor}-${random}`;
};

const calculateCommission = (amount, rate) => {
  return parseFloat((amount * rate / 100).toFixed(2));
};

const paginate = (page = 1, limit = 20) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  return { skip, limit: parseInt(limit) };
};

const buildPaginationMeta = (total, page, limit) => ({
  total,
  page: parseInt(page),
  limit: parseInt(limit),
  totalPages: Math.ceil(total / limit),
  hasNextPage: parseInt(page) < Math.ceil(total / limit),
  hasPrevPage: parseInt(page) > 1,
});

module.exports = { generateSKU, calculateCommission, paginate, buildPaginationMeta };
