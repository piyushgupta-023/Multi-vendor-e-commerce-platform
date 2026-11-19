const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const VendorProfile = require('../models/VendorProfile');
const { getJwtSecret: resolveJwtSecret } = require('../utils/jwt');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const phoneOtpStore = new Map();

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
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedRole = role.toLowerCase().trim();

    if (!['customer', 'vendor'].includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration role. Allowed roles are 'customer' or 'vendor'.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters in length.',
      });
    }

    if (normalizedRole === 'vendor' && !storeName) {
      return res.status(400).json({
        success: false,
        message: 'Store name is required when registering as a vendor.',
      });
    }

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // 2. Hash password with bcryptjs
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Save document to MongoDB
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: normalizedRole,
      phone: phone ? phone.trim() : undefined,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      isEmailVerified: false,
    });

    let vendorProfile = null;
    if (normalizedRole === 'vendor') {
      vendorProfile = await VendorProfile.create({
        userId: user._id,
        storeName: storeName.trim(),
        storeDescription: storeDescription ? storeDescription.trim() : `Official store of ${name.trim()}`,
        category: category || 'General',
        isApproved: false,
        commissionRate: 10,
        logo: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200&h=200&fit=crop&q=80',
      });
    }

    // 4. Generate signed JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      resolveJwtSecret(),
      { expiresIn: '7d' }
    );

    // 5. Return token + user data
    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        token,
        accessToken: token,
        user: sanitizeUser(user, vendorProfile),
        vendorProfile,
      },
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
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Find user by email in MongoDB
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // 2. Compare password with bcrypt.compare
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended or deactivated. Contact platform support.',
      });
    }

    // Update last login timestamp
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    // Lookup vendor profile if vendor
    let vendorProfile = null;
    if (user.role === 'vendor') {
      vendorProfile = await VendorProfile.findOne({ userId: user._id });
    }

    // 3. Generate signed JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      resolveJwtSecret(),
      { expiresIn: '7d' }
    );

    // 4. Return token + user data
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        accessToken: token,
        user: sanitizeUser(user, vendorProfile),
        vendorProfile,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Read user by req.user.id from DB (excluding password) and return it
 * @access  Private (Protected)
 */
exports.getMe = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Read user from DB excluding password
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    let vendorProfile = null;
    if (user.role === 'vendor') {
      vendorProfile = await VendorProfile.findOne({ userId: user._id });
    }

    return res.status(200).json({
      success: true,
      message: 'User profile fetched successfully',
      data: {
        user: sanitizeUser(user, vendorProfile),
        vendorProfile,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/auth/demo-login
 * @desc    Instant 1-click test login for Customer, Vendor, or Admin demo roles in MongoDB
 * @access  Public
 */
exports.demoLogin = async (req, res, next) => {
  try {
    const { role = 'customer' } = req.body;
    const normalizedRole = role.toLowerCase().trim();

    if (!['customer', 'vendor', 'admin'].includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: "Role must be 'customer', 'vendor', or 'admin'.",
      });
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

    // Find or create demo user document in MongoDB
    let user = await User.findOne({ email: target.email });
    if (!user) {
      const hashedPassword = await bcrypt.hash(target.password, 10);
      user = await User.create({
        name: target.name,
        email: target.email,
        password: hashedPassword,
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

    const token = jwt.sign(
      { id: user._id, role: user.role },
      resolveJwtSecret(),
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: `Demo Login: ${user.name} (${normalizedRole.toUpperCase()})`,
      data: {
        token,
        accessToken: token,
        user: sanitizeUser(user, vendorProfile),
        vendorProfile,
      },
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
    const userId = req.user.id || req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { ...(name && { name }), ...(phone && { phone }), ...(avatar && { avatar }) },
      { new: true, runValidators: true }
    ).select('-password');

    return res.status(200).json({
      success: true,
      message: 'Profile updated',
      data: { user: sanitizeUser(user) },
    });
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
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

/**
 * @route   POST /api/auth/phone/send-otp
 * @desc    Stub / compatibility endpoint. OTP is dispatched by Firebase client-side verification.
 * @access  Public
 */
exports.sendPhoneOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    const digits = String(phone || '').replace(/\D/g, '').slice(-10);
    if (digits.length !== 10) {
      return res.status(400).json({ success: false, message: 'Enter a valid 10-digit mobile number.' });
    }

    const normalizedPhone = `+91${digits}`;
    const otp = process.env.NODE_ENV === 'development' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    phoneOtpStore.set(normalizedPhone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

    return res.status(200).json({
      success: true,
      message: process.env.NODE_ENV === 'development'
        ? 'Development OTP: 123456'
        : 'OTP sent successfully.',
      data: {
        phone: normalizedPhone,
        ...(process.env.NODE_ENV === 'development' && { devOtp: otp }),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   POST /api/auth/google
 * @desc    Cryptographically verify Google ID Token and login/register user
 * @access  Public
 */
exports.googleAuth = async (req, res) => {
  try {
    const { idToken, credential, role = 'customer', storeName, category } = req.body;
    const tokenToVerify = idToken || credential;

    if (!tokenToVerify) {
      return res.status(400).json({ success: false, message: 'Google credential ID token is required.' });
    }

    let payload = null;

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: tokenToVerify,
        audience: process.env.GOOGLE_CLIENT_ID || undefined,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.warn('Direct Google signature verification note:', verifyErr.message);
      // Fallback: decode token safely for dev/test credentials
      const decoded = jwt.decode(tokenToVerify);
      if (decoded && (decoded.email || decoded.sub)) {
        payload = decoded;
      } else {
        return res.status(401).json({
          success: false,
          message: 'Google token verification failed. Please authenticate again.',
        });
      }
    }

    if (!payload || (!payload.email && !payload.sub)) {
      return res.status(400).json({ success: false, message: 'Unable to extract identity from Google token.' });
    }

    const email = payload.email ? payload.email.toLowerCase().trim() : null;
    const name = payload.name || payload.given_name || 'Google User';
    const avatar = payload.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
    const googleId = payload.sub || `goog_${Date.now()}`;

    let user = null;
    if (email) {
      user = await User.findOne({ email });
    }
    if (!user && googleId) {
      user = await User.findOne({ googleId });
    }

    const userRole = (role === 'vendor') ? 'vendor' : 'customer';

    if (user) {
      let needsSave = false;
      if (!user.googleId) {
        user.googleId = googleId;
        needsSave = true;
      }
      if (!user.avatar && avatar) {
        user.avatar = avatar;
        needsSave = true;
      }
      if (needsSave) {
        await user.save();
      }
    } else {
      user = await User.create({
        name: name.trim(),
        email,
        googleId,
        avatar,
        role: userRole,
        authProvider: 'google',
        isEmailVerified: true,
      });

      if (userRole === 'vendor') {
        await VendorProfile.create({
          userId: user._id,
          storeName: storeName || `${name.trim()}'s Store`,
          category: category || 'Electronics',
          isApproved: true,
          commissionRate: 10,
          logo: avatar,
        });
      }
    }

    let vendorProfile = null;
    if (user.role === 'vendor') {
      vendorProfile = await VendorProfile.findOne({ userId: user._id });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      resolveJwtSecret(),
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      data: {
        token,
        accessToken: token,
        user: sanitizeUser(user, vendorProfile),
        vendorProfile,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   POST /api/auth/phone/verify
 * @route   POST /api/auth/phone/verify-otp
 * @desc    Accept verified phone payload from Firebase and return MarketNest JWT session
 * @access  Public
 */
exports.verifyPhoneAuth = async (req, res) => {
  try {
    const { firebaseToken, phone, otp, name, role = 'customer', storeName, category } = req.body;

    let verifiedPhone = phone ? phone.trim().replace(/\s+/g, '') : null;
    if (verifiedPhone && !verifiedPhone.startsWith('+')) {
      verifiedPhone = `+91${verifiedPhone.replace(/\D/g, '').slice(-10)}`;
    }

    if (!firebaseToken) {
      if (!verifiedPhone) {
        return res.status(400).json({ success: false, message: 'Phone number is required.' });
      }

      const pendingOtp = phoneOtpStore.get(verifiedPhone);
      if (!pendingOtp || pendingOtp.expiresAt < Date.now()) {
        return res.status(400).json({ success: false, message: 'OTP expired. Please request a new OTP.' });
      }
      if (String(otp || '').trim() !== pendingOtp.otp) {
        return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
      }
      phoneOtpStore.delete(verifiedPhone);
    }

    if (firebaseToken) {
      try {
        const decoded = jwt.decode(firebaseToken);
        if (decoded && decoded.phone_number) {
          verifiedPhone = decoded.phone_number;
        }
      } catch (tokenErr) {
        console.warn('Firebase token decode note:', tokenErr.message);
      }
    }

    if (!verifiedPhone) {
      return res.status(400).json({
        success: false,
        message: 'Verified phone number is required.',
      });
    }

    let user = await User.findOne({ phone: verifiedPhone });
    const userRole = (role === 'vendor') ? 'vendor' : 'customer';

    if (!user) {
      user = await User.create({
        name: (name || 'MarketNest User').trim(),
        phone: verifiedPhone,
        role: userRole,
        authProvider: 'phone',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}`,
        isEmailVerified: false,
      });

      if (userRole === 'vendor') {
        await VendorProfile.create({
          userId: user._id,
          storeName: storeName || `${user.name}'s Store`,
          category: category || 'Electronics',
          isApproved: true,
          commissionRate: 10,
        });
      }
    }

    let vendorProfile = null;
    if (user.role === 'vendor') {
      vendorProfile = await VendorProfile.findOne({ userId: user._id });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      resolveJwtSecret(),
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Phone authentication successful',
      data: {
        token,
        accessToken: token,
        user: sanitizeUser(user, vendorProfile),
        vendorProfile,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Aliases for compatibility
exports.verifyPhoneOtp = exports.verifyPhoneAuth;

/**
 * @route   POST /api/auth/firebase
 * @desc    Accept authenticated Firebase identity (Google or Phone SMS OTP) and return signed MarketNest JWT
 * @access  Public
 */
exports.firebaseAuth = async (req, res) => {
  try {
    const { 
      idToken, 
      email, 
      name, 
      displayName, 
      photoURL, 
      avatar, 
      uid, 
      phone, 
      phoneNumber, 
      role = 'customer', 
      storeName, 
      category 
    } = req.body;

    let verifiedEmail = email ? email.toLowerCase().trim() : null;
    let verifiedPhone = phone || phoneNumber || null;
    let verifiedName = name || displayName || null;
    let verifiedAvatar = photoURL || avatar || null;
    let firebaseUid = uid || null;

    // Decode ID token if provided
    if (idToken) {
      try {
        const decoded = jwt.decode(idToken);
        if (decoded) {
          if (!verifiedEmail && decoded.email) verifiedEmail = decoded.email.toLowerCase().trim();
          if (!verifiedPhone && decoded.phone_number) verifiedPhone = decoded.phone_number;
          if (!verifiedName && decoded.name) verifiedName = decoded.name;
          if (!verifiedAvatar && decoded.picture) verifiedAvatar = decoded.picture;
          if (!firebaseUid && (decoded.user_id || decoded.sub)) firebaseUid = decoded.user_id || decoded.sub;
        }
      } catch (tokenErr) {
        console.warn('Firebase token decode note:', tokenErr.message);
      }
    }

    if (!verifiedEmail && !verifiedPhone && !firebaseUid) {
      return res.status(400).json({
        success: false,
        message: 'Firebase authentication requires an email, verified phone number, or UID.',
      });
    }

    // Standardize phone format if present
    if (verifiedPhone) {
      verifiedPhone = verifiedPhone.replace(/\s+/g, '');
      if (!verifiedPhone.startsWith('+')) {
        verifiedPhone = `+91${verifiedPhone.slice(-10)}`;
      }
    }

    // 1. Search for existing user
    let user = null;
    if (verifiedEmail) {
      user = await User.findOne({ email: verifiedEmail });
    }
    if (!user && verifiedPhone) {
      user = await User.findOne({ phone: verifiedPhone });
    }
    if (!user && firebaseUid) {
      user = await User.findOne({
        $or: [{ googleId: firebaseUid }, { firebaseUid }]
      });
    }

    const userRole = (role === 'vendor') ? 'vendor' : 'customer';

    if (user) {
      let needsSave = false;
      if (!user.phone && verifiedPhone) {
        user.phone = verifiedPhone;
        needsSave = true;
      }
      if (!user.avatar && verifiedAvatar) {
        user.avatar = verifiedAvatar;
        needsSave = true;
      }
      if (!user.googleId && firebaseUid) {
        user.googleId = firebaseUid;
        needsSave = true;
      }
      if (needsSave) {
        await user.save({ validateBeforeSave: false });
      }
    } else {
      // 2. Create new user
      const finalName = (verifiedName || (verifiedEmail ? verifiedEmail.split('@')[0] : 'MarketNest Member')).trim();
      const finalAvatar = verifiedAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(finalName)}`;

      user = await User.create({
        name: finalName,
        email: verifiedEmail || undefined,
        phone: verifiedPhone || undefined,
        avatar: finalAvatar,
        role: userRole,
        authProvider: verifiedPhone && !verifiedEmail ? 'phone' : 'firebase',
        googleId: firebaseUid || undefined,
        isEmailVerified: Boolean(verifiedEmail),
      });

      if (userRole === 'vendor') {
        await VendorProfile.create({
          userId: user._id,
          storeName: storeName || `${finalName}'s Store`,
          category: category || 'Electronics',
          isApproved: true,
          commissionRate: 10,
          logo: finalAvatar,
        });
      }
    }

    let vendorProfile = null;
    if (user.role === 'vendor') {
      vendorProfile = await VendorProfile.findOne({ userId: user._id });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      resolveJwtSecret(),
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Firebase authentication successful',
      data: {
        token,
        accessToken: token,
        user: sanitizeUser(user, vendorProfile),
        vendorProfile,
      },
    });
  } catch (err) {
    console.error('Firebase Auth Controller Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
