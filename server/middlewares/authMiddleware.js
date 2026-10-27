const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/apiResponse');

/**
 * Protect middleware: verifies JWT Bearer token from authorization header
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Access denied. No authentication token provided.');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return sendError(res, 401, 'Access denied. Malformed authorization token.');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_marketnest_enterprise_2025');

    // Handle mock demo tokens if DB is in fallback mode
    if (decoded.isDemo && decoded.demoUser) {
      req.user = decoded.demoUser;
      return next();
    }

    // Verify user exists in database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      // If user not in DB (e.g. demo session), construct from token payload
      if (decoded.role && decoded.email) {
        req.user = {
          _id: decoded.id,
          id: decoded.id,
          name: decoded.name || 'Demo User',
          email: decoded.email,
          role: decoded.role,
          isActive: true,
        };
        return next();
      }
      return sendError(res, 401, 'The user belonging to this token no longer exists.');
    }

    if (!user.isActive) {
      return sendError(res, 403, 'Your account has been deactivated. Please contact support.');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Your session has expired. Please log in again.');
    }
    return sendError(res, 401, 'Invalid authentication token. Authorization failed.');
  }
};

/**
 * RBAC authorization middleware: restricts access to specific roles
 * @param  {...string} roles - Allowed roles e.g. 'admin', 'vendor', 'customer'
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, 401, 'User identity not established. Please log in.');
    }

    const userRole = req.user.role.toLowerCase();
    const normalizedRoles = roles.map(r => r.toLowerCase());

    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' does not have permission to access this resource.`,
        requiredRoles: roles,
        userRole: req.user.role,
      });
    }

    next();
  };
};

// Aliases for compatibility
const authorize = authorizeRoles;

module.exports = {
  protect,
  authorizeRoles,
  authorize,
};
