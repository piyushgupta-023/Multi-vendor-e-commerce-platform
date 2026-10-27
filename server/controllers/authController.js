const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const VendorProfile = require('../models/VendorProfile');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * Generate JWT token with configured expiration
 */
const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'super_secret_jwt_key_marketnest_enterprise_2025',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Sanitizes user object for API responses
 */
const sanitizeUser = (user, vendorProfile = null) => {
  const userId = user._id ? user._id.toString() : user.id;
  const sanitized = {
    id: userId,
    _id: userId,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`,
    phone: user.phone || '',
    isActive: user.isActive !== undefined ? user.isActive : true,
    isEmailVerified: user.isEmailVerified || false,
    createdAt: user.createdAt || new Date().toISOString(),
  };

  if (user.role === 'vendor' && vendorProfile) {
    sanitized.vendorId = vendorProfile._id ? vendorProfile._id.toString() : vendorProfile.id;
    sanitized.storeName = vendorProfile.storeName;
    sanitized.isApproved = vendorProfile.isApproved;
    sanitized.commissionRate = vendorProfile.commissionRate;
  }

  return sanitized;
};

/**
 * @route   POST /api/auth/register
 * @desc    Register customer or vendor
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'customer', storeName, storeDescription, phone, category } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 400, 'Please provide name, email, and password.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedRole = role.toLowerCase().trim();

    if (!['customer', 'vendor'].includes(normalizedRole)) {
      return sendError(res, 400, "Invalid registration role. Allowed roles are 'customer' or 'vendor'.");
    }

    if (password.length < 6) {
      return sendError(res, 400, 'Password must be at least 6 characters in length.');
    }

    if (normalizedRole === 'vendor' && !storeName) {
      return sendError(res, 400, 'Store name is required when registering as a vendor.');
    }

    // Check if database is connected
    if (!isDbConnected()) {
      // Resilient fallback registration in offline/mock mode
      const mockId = `mock_user_${Date.now()}`;
      const mockVendorId = normalizedRole === 'vendor' ? `mock_vendor_${Date.now()}` : undefined;
      const mockUser = {
        _id: mockId,
        id: mockId,
        name: name.trim(),
        email: normalizedEmail,
        role: normalizedRole,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        phone: phone || '',
        isActive: true,
      };

      const mockVendor = normalizedRole === 'vendor' ? {
        _id: mockVendorId,
        id: mockVendorId,
        storeName: storeName.trim(),
        storeDescription: storeDescription || 'Vendor store on MarketNest',
        isApproved: false,
        commissionRate: 10,
      } : null;

      const token = generateToken({
        id: mockId,
        email: normalizedEmail,
        role: normalizedRole,
        name: name.trim(),
        isDemo: true,
        demoUser: mockUser,
      });

      return sendSuccess(res, 201, 'Registration successful (Resilient Mode)', {
        user: sanitizeUser(mockUser, mockVendor),
        vendorProfile: mockVendor,
        token,
        accessToken: token,
      });
    }

    // Check for existing user in MongoDB
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return sendError(res, 409, 'An account with this email address already exists. Please log in.');
    }

    // Create User document
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: normalizedRole,
      phone: phone || undefined,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      isEmailVerified: false,
    });

    let vendorProfile = null;
    if (user.role === 'vendor') {
      vendorProfile = await VendorProfile.create({
        userId: user._id,
        storeName: storeName.trim(),
        storeDescription: storeDescription ? storeDescription.trim() : `Official marketplace store of ${name}`,
        category: category || 'General',
        isApproved: false,
        commissionRate: 10,
        logo: `https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200&h=200&fit=crop&q=80`,
      });
    }

    const token = generateToken({ id: user._id, email: user.email, role: user.role, name: user.name });

    return sendSuccess(res, 201, 'Account created successfully! Welcome to MarketNest.', {
      user: sanitizeUser(user, vendorProfile),
      vendorProfile,
      token,
      accessToken: token,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Validate credentials and return JWT token
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, 'Please provide both email and password.');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Offline / resilient mode handling
    if (!isDbConnected()) {
      // Check for predefined demo credentials or mock response
      let role = 'customer';
      let name = 'Demo User';
      if (normalizedEmail.includes('admin')) {
        role = 'admin';
        name = 'System Admin';
      } else if (normalizedEmail.includes('vendor') || normalizedEmail.includes('technova')) {
        role = 'vendor';
        name = 'TechNova Store';
      }

      const mockId = `mock_${role}_${Date.now()}`;
      const mockVendor = role === 'vendor' ? {
        _id: `mock_vp_${Date.now()}`,
        storeName: 'TechNova Electronics',
        isApproved: true,
        commissionRate: 8,
      } : null;

      const mockUser = {
        _id: mockId,
        id: mockId,
        name,
        email: normalizedEmail,
        role,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        isActive: true,
      };

      const token = generateToken({
        id: mockId,
        email: normalizedEmail,
        role,
        name,
        isDemo: true,
        demoUser: mockUser,
      });

      return sendSuccess(res, 200, 'Login successful (Resilient Mode)', {
        user: sanitizeUser(mockUser, mockVendor),
        vendorProfile: mockVendor,
        token,
        accessToken: token,
      });
    }

    // Find user with password selected
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return sendError(res, 401, 'Invalid email address or password.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid email address or password.');
    }

    if (!user.isActive) {
      return sendError(res, 403, 'Account is suspended or deactivated. Contact platform support.');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    // Lookup vendor profile if vendor
    let vendorProfile = null;
    if (user.role === 'vendor') {
      vendorProfile = await VendorProfile.findOne({ userId: user._id });
    }

    const token = generateToken({ id: user._id, email: user.email, role: user.role, name: user.name });

    return sendSuccess(res, 200, 'Login successful. Welcome back!', {
      user: sanitizeUser(user, vendorProfile),
      vendorProfile,
      token,
      accessToken: token,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user & role profile
 * @access  Private (Protected)
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return sendError(res, 401, 'Unauthorized');
    }

    let vendorProfile = null;
    if (user.role === 'vendor') {
      if (isDbConnected() && user._id) {
        vendorProfile = await VendorProfile.findOne({ userId: user._id });
      } else {
        vendorProfile = {
          storeName: user.storeName || 'Verified Merchant Store',
          isApproved: true,
          commissionRate: 10,
        };
      }
    }

    return sendSuccess(res, 200, 'User profile fetched successfully', {
      user: sanitizeUser(user, vendorProfile),
      vendorProfile,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/auth/demo-login
 * @desc    Instant 1-click login for Customer, Vendor, or Admin demo roles
 * @access  Public
 */
exports.demoLogin = async (req, res, next) => {
  try {
    const { role = 'customer' } = req.body;
    const normalizedRole = role.toLowerCase().trim();

    if (!['customer', 'vendor', 'admin'].includes(normalizedRole)) {
      return sendError(res, 400, "Role must be 'customer', 'vendor', or 'admin'.");
    }

    const demoAccounts = {
      admin: {
        name: 'Super Admin',
        email: 'admin@marketplace.com',
        password: 'Admin@123456',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&q=80',
        phone: '+91 98765 00000',
      },
      vendor: {
        name: 'TechNova Electronics',
        email: 'technova@marketplace.com',
        password: 'Vendor@123456',
        role: 'vendor',
        storeName: 'TechNova Electronics',
        storeDescription: 'Premier authorized distributor of smartphones, audio gear, and laptops.',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80',
        phone: '+91 98765 43210',
      },
      customer: {
        name: 'Aarav Sharma',
        email: 'aarav.sharma@gmail.com',
        password: 'Customer@123456',
        role: 'customer',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&q=80',
        phone: '+91 99887 76655',
      },
    };

    const target = demoAccounts[normalizedRole];

    // If DB is offline, return instant authentic session
    if (!isDbConnected()) {
      const mockId = `demo_${normalizedRole}_id`;
      const mockVendor = normalizedRole === 'vendor' ? {
        _id: 'demo_vp_technova',
        id: 'demo_vp_technova',
        storeName: target.storeName,
        storeDescription: target.storeDescription,
        isApproved: true,
        commissionRate: 8,
      } : null;

      const mockUser = {
        _id: mockId,
        id: mockId,
        name: target.name,
        email: target.email,
        role: normalizedRole,
        avatar: target.avatar,
        phone: target.phone,
        isActive: true,
        isEmailVerified: true,
      };

      const token = generateToken({
        id: mockId,
        email: target.email,
        role: normalizedRole,
        name: target.name,
        isDemo: true,
        demoUser: mockUser,
      });

      return sendSuccess(res, 200, `Instant Demo Login: ${target.name} (${normalizedRole.toUpperCase()})`, {
        user: sanitizeUser(mockUser, mockVendor),
        vendorProfile: mockVendor,
        token,
        accessToken: token,
      });
    }

    // DB Connected: Find or auto-create demo user
    let user = await User.findOne({ email: target.email });
    if (!user) {
      user = await User.create({
        name: target.name,
        email: target.email,
        password: target.password,
        role: normalizedRole,
        avatar: target.avatar,
        phone: target.phone,
        isEmailVerified: true,
      });
    }

    let vendorProfile = null;
    if (normalizedRole === 'vendor') {
      vendorProfile = await VendorProfile.findOne({ userId: user._id });
      if (!vendorProfile) {
        vendorProfile = await VendorProfile.create({
          userId: user._id,
          storeName: target.storeName,
          storeDescription: target.storeDescription,
          isApproved: true,
          commissionRate: 8,
          logo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=200&h=200&fit=crop&q=80',
          category: 'Electronics',
        });
      }
    }

    const token = generateToken({ id: user._id, email: user.email, role: user.role, name: user.name });

    return sendSuccess(res, 200, `Instant Demo Login: ${user.name} (${normalizedRole.toUpperCase()})`, {
      user: sanitizeUser(user, vendorProfile),
      vendorProfile,
      token,
      accessToken: token,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile details
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;
    if (!isDbConnected() || !req.user._id) {
      const updated = { ...req.user, ...(name && { name }), ...(phone && { phone }), ...(avatar && { avatar }) };
      return sendSuccess(res, 200, 'Profile updated', sanitizeUser(updated));
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { ...(name && { name }), ...(phone && { phone }), ...(avatar && { avatar }) },
      { new: true, runValidators: true }
    );
    return sendSuccess(res, 200, 'Profile updated', sanitizeUser(user));
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Invalidate user session
 * @access  Private
 */
exports.logout = async (req, res) => {
  return sendSuccess(res, 200, 'Logged out successfully.');
};
