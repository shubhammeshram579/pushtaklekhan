// // auth.routes.js
// const express = require('express');
// const router = express.Router();
// const auth = require('../controllers/auth.controller');
// const { protect } = require('../middlewares/auth.middleware');

// router.post('/register', auth.register);
// router.post('/login', auth.login);
// router.get('/me', protect, auth.getMe);
// router.put('/me', protect, auth.updateMe);
// router.put('/change-password', protect, auth.changePassword);

// module.exports = router;


// auth.routes.js
const express = require('express');
const router = express.Router();
const auth = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

// Public Routes - Registration & OTP Flow
router.post('/register', auth.register);
router.post('/verify-registration-otp', auth.verifyRegistrationOTP);

// Public Routes - Authentication & Tokens
router.post('/login', auth.login);
router.post('/refresh-token', auth.refreshToken);

// Public Routes - Forgot & Reset Password
router.post('/forgot-password', auth.forgotPassword);
router.post('/reset-password', auth.resetPassword);

// Protected Routes (Requires valid Access Token)
router.post('/logout', protect, auth.logout);
router.get('/me', protect, auth.getMe);
router.put('/me', protect, auth.updateMe);

module.exports = router;
