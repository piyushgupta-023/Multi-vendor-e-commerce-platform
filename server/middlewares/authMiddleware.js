const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../utils/jwt');

/**
 * Protect middleware: verifies JWT Bearer token from authorization header
 * and attaches user from MongoDB to req.user. If invalid, returns 401 'Not authorized'.
 */
const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split('Bearer ')[1]?.trim();
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact platform support.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
};

/**
 * RBAC authorization middleware: restricts access to specific roles
 * @param  {...string} roles - Allowed roles e.g. 'admin', 'vendor', 'customer'
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const userRole = req.user.role.toLowerCase();
    const normalizedRoles = roles.map((r) => r.toLowerCase());

    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' is not authorized to access this resource`,
        requiredRoles: roles,
        userRole: req.user.role,
      });
    }

    next();
  };
};

const authorize = authorizeRoles;

module.exports = {
  protect,
  authorizeRoles,
  authorize,
};
