const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/rateLimiter');
const { validateRegister, validateLogin, validate } = require('../utils/validators');

// Public routes
router.post('/register', authLimiter, validateRegister, validate, authController.register);
router.post('/login', authLimiter, validateLogin, validate, authController.login);
router.post('/demo-login', authLimiter, authController.demoLogin);

// Google & Phone Authentication
router.post('/firebase', authLimiter, authController.firebaseAuth);
router.post('/google', authLimiter, authController.googleAuth);
router.post('/phone/verify', authLimiter, authController.verifyPhoneAuth);
router.post('/phone/verify-otp', authLimiter, authController.verifyPhoneAuth);
router.post('/phone/send-otp', authLimiter, authController.sendPhoneOtp);

// Protected routes
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, authController.updateProfile);
router.post('/logout', protect, authController.logout);

module.exports = router;
