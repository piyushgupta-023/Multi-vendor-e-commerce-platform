const { protect, authorizeRoles, authorize } = require('./authMiddleware');

module.exports = {
  protect,
  authorizeRoles,
  authorize,
};
