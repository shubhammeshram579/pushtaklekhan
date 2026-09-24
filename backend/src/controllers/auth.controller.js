// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// // POST /api/auth/register
// exports.register = async (req, res, next) => {
//   try {
//     const { name, email, password } = req.body;
//     if (!name || !email || !password) {
//       return res.status(400).json({ success: false, message: 'Name, email and password are required' });
//     }

//     const existing = await User.findOne({ email: email.toLowerCase() });
//     if (existing) {
//       return res.status(400).json({ success: false, message: 'Email already registered' });
//     }

//     const user = await User.create({ name, email, password });
//     const token = signToken(user._id);

//     res.status(201).json({ success: true, token, user });
//   } catch (err) {
//     next(err);
//   }
// };

// // POST /api/auth/login
// exports.login = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;
//     if (!email || !password) {
//       return res.status(400).json({ success: false, message: 'Email and password are required' });
//     }

//     const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
//     if (!user || !(await user.comparePassword(password))) {
//       return res.status(401).json({ success: false, message: 'Invalid email or password' });
//     }

//     const token = signToken(user._id);
//     res.json({ success: true, token, user });
//   } catch (err) {
//     next(err);
//   }
// };

// // GET /api/auth/me
// exports.getMe = async (req, res, next) => {
//   try {
//     const user = await User.findById(req.user._id);
//     res.json({ success: true, user });
//   } catch (err) {
//     next(err);
//   }
// };

// // PUT /api/auth/me
// exports.updateMe = async (req, res, next) => {
//   try {
//     const { name, preferences } = req.body;
//     const updates = {};
//     if (name) updates.name = name;
//     if (preferences) updates.preferences = { ...req.user.preferences, ...preferences };

//     const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
//     res.json({ success: true, user });
//   } catch (err) {
//     next(err);
//   }
// };

// // PUT /api/auth/change-password
// exports.changePassword = async (req, res, next) => {
//   try {
//     const { currentPassword, newPassword } = req.body;
//     const user = await User.findById(req.user._id).select('+password');
//     if (!(await user.comparePassword(currentPassword))) {
//       return res.status(400).json({ success: false, message: 'Current password is incorrect' });
//     }
//     user.password = newPassword;
//     await user.save();
//     const token = signToken(user._id);
//     res.json({ success: true, token, message: 'Password updated successfully' });
//   } catch (err) {
//     next(err);
//   }
// };




// const jwt = require('jsonwebtoken');
// const crypto = require('crypto');
// const User = require('../models/User');
// const { sendEmail } = require('../utils/emailsend');
// const { redisUtils } = require('../config/redis');
// const { asyncHandler } = require('../utils/asyncHandler');
// const { ApiError } = require('../utils/ApiError');
// const { ApiResponse } = require('../utils/ApiResponse');

// // Hash token helper
// const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// // Token Generators
// const generateTokens = (userId) => {
//   const accessToken = jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET, {
//     expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
//   });

//   const refreshToken = jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, {
//     expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
//   });

//   return { accessToken, refreshToken };
// };

// // Cookie Configuration Options
// const isProduction = process.env.NODE_ENV === 'production';
// const cookieOptions = {
//   httpOnly: true,
//   secure: isProduction, // HTTPS required in production
//   sameSite: isProduction ? 'strict' : 'lax', // 'lax' prevents cross-port local dev cookie stripping
//   path: '/',
// };

// // Generate 6-digit OTP
// const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// // 1. REGISTER - Send OTP via Redis
// exports.register = asyncHandler(async (req, res) => {
//   const { name, email, password } = req.body;
//   if (!name || !email || !password) {
//     throw new ApiError(400, 'Name, email, and password are required');
//   }

//   const cleanEmail = email.toLowerCase().trim();

//   // Check if verified user exists
//   const existingUser = await User.findOne({ email: cleanEmail });
//   if (existingUser && existingUser.isVerified) {
//     throw new ApiError(400, 'Email already registered');
//   }

//   // Redis Cooldown Check
//   const cooldown = await redisUtils.getKey(`otp_cooldown:${cleanEmail}`);
//   if (cooldown) {
//     throw new ApiError(429, 'Please wait 60 seconds before requesting a new OTP.');
//   }

//   const otp = generateOTP();
//   const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

//   const registerPayload = { name, email: cleanEmail, password, hashedOTP };

//   // Store in Redis (10 min TTL) & Cooldown (60s TTL)
//   await redisUtils.setKey(`register_otp:${cleanEmail}`, registerPayload, 600);
//   await redisUtils.setKey(`otp_cooldown:${cleanEmail}`, true, 60);

//   // Send Email
//   sendEmail({
//     email: cleanEmail,
//     subject: 'Your Registration OTP',
//     html: `<h3>Your registration OTP is: <b>${otp}</b></h3><p>Valid for 10 minutes.</p>`,
//   }).catch((err) => console.error('Email send failed:', err.message));

//   return res
//     .status(200)
//     .json(new ApiResponse(200, null, 'OTP sent to your email. Please verify to complete registration.'));
// });

// // 2. VERIFY REGISTRATION OTP
// exports.verifyRegistrationOTP = asyncHandler(async (req, res) => {
//   const { email, otp } = req.body;
//   if (!email || !otp) {
//     throw new ApiError(400, 'Email and OTP are required');
//   }

//   const cleanEmail = email.toLowerCase().trim();
//   const cachedData = await redisUtils.getKey(`register_otp:${cleanEmail}`);

//   if (!cachedData) {
//     throw new ApiError(400, 'OTP expired or invalid request');
//   }

//   const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
//   if (cachedData.hashedOTP !== hashedOTP) {
//     throw new ApiError(400, 'Invalid OTP');
//   }

//   let user = await User.findOne({ email: cleanEmail });
//   if (!user) {
//     user = await User.create({
//       name: cachedData.name,
//       email: cachedData.email,
//       password: cachedData.password,
//       isVerified: true,
//     });
//   } else {
//     user.isVerified = true;
//     user.password = cachedData.password;
//     await user.save();
//   }

//   await redisUtils.deleteKey(`register_otp:${cleanEmail}`);

//   return res
//     .status(201)
//     .json(new ApiResponse(201, { userId: user._id }, 'Registration successful! You can now log in.'));
// });

// // 3. LOGIN
// exports.login = asyncHandler(async (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password) {
//     throw new ApiError(400, 'Email and password are required');
//   }

//   const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
//   if (!user || !(await user.comparePassword(password))) {
//     throw new ApiError(401, 'Invalid email or password');
//   }

//   if (!user.isVerified) {
//     throw new ApiError(403, 'Please verify your email before logging in');
//   }

//   const { accessToken, refreshToken } = generateTokens(user._id);
//   const tokenHash = hashToken(refreshToken);

//   // Atomic update: Maintain max 5 sessions without calling user.save()
//   await User.findByIdAndUpdate(user._id, {
//     $push: {
//       refreshTokens: {
//         $each: [{ tokenHash }],
//         $slice: -5,
//       },
//     },
//   });

//   res.cookie('refreshToken', refreshToken, {
//     ...cookieOptions,
//     maxAge: 7 * 24 * 60 * 60 * 1000,
//   });

//   return res.status(200).json(
//     new ApiResponse(
//       200,
//       {
//         accessToken,
//         user: { id: user._id, name: user.name, email: user.email, role: user.role },
//       },
//       'User logged in successfully'
//     )
//   );
// });

// // 4. REFRESH ACCESS TOKEN (FIXED: Prioritize Cookie over Body & Single Atomic Swap)
// exports.refreshToken = asyncHandler(async (req, res) => {
//   // Always prefer HTTP-only cookie first
//   const token = req.cookies?.refreshToken || req.body?.refreshToken;

//   if (!token) {
//     throw new ApiError(401, 'Refresh token missing');
//   }

//   let decoded;
//   try {
//     decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
//   } catch (err) {
//     res.clearCookie('refreshToken', cookieOptions);
//     throw new ApiError(401, 'Invalid or expired refresh token');
//   }

//   const oldTokenHash = hashToken(token);
//   const newTokens = generateTokens(decoded.id);
//   const newTokenHash = hashToken(newTokens.refreshToken);

//   // Single Atomic Atomic Swap: Replace old token hash with new token hash in one query
//   const updatedUser = await User.findOneAndUpdate(
//     { _id: decoded.id, 'refreshTokens.tokenHash': oldTokenHash },
//     {
//       $set: { 'refreshTokens.$.tokenHash': newTokenHash },
//     },
//     { new: true }
//   );

//   if (!updatedUser) {
//     res.clearCookie('refreshToken', cookieOptions);
//     throw new ApiError(401, 'Token revoked or invalid');
//   }

//   // Clear Redis session cache so protect middleware gets fresh state
//   await redisUtils.deleteKey(`user_session:${decoded.id}`);

//   res.cookie('refreshToken', newTokens.refreshToken, {
//     ...cookieOptions,
//     maxAge: 7 * 24 * 60 * 60 * 1000,
//   });

//   return res
//     .status(200)
//     .json(new ApiResponse(200, { accessToken: newTokens.accessToken }, 'Token refreshed successfully'));
// });

// // 5. FORGOT PASSWORD
// exports.forgotPassword = asyncHandler(async (req, res) => {
//   const { email } = req.body;
//   if (!email) {
//     throw new ApiError(400, 'Email is required');
//   }

//   const user = await User.findOne({ email: email.toLowerCase().trim() });
//   if (!user) {
//     return res.status(200).json(new ApiResponse(200, null, 'If email exists, OTP has been sent.'));
//   }

//   const otp = user.createOTP();
//   await user.save();

//   await sendEmail({
//     email: user.email,
//     subject: 'Password Reset OTP',
//     html: `<h3>Your password reset OTP is <b>${otp}</b></h3>`,
//   });

//   return res.status(200).json(new ApiResponse(200, null, 'If email exists, OTP has been sent.'));
// });

// // 6. RESET PASSWORD
// exports.resetPassword = asyncHandler(async (req, res) => {
//   const { email, otp, newPassword } = req.body;
//   if (!email || !otp || !newPassword) {
//     throw new ApiError(400, 'Email, OTP, and new password are required');
//   }

//   const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
//   const user = await User.findOne({
//     email: email.toLowerCase().trim(),
//     otpHash: hashedOTP,
//     otpExpires: { $gt: Date.now() },
//   }).select('+otpHash +otpExpires');

//   if (!user) {
//     throw new ApiError(400, 'Invalid or expired OTP');
//   }

//   user.password = newPassword;
//   user.otpHash = undefined;
//   user.otpExpires = undefined;
//   user.refreshTokens = []; // Revoke all sessions on password reset
//   await user.save();

//   // Clear user cache in Redis
//   await redisUtils.deleteKey(`user_session:${user._id}`);

//   return res.status(200).json(new ApiResponse(200, null, 'Password reset successful. Please login with your new password.'));
// });

// // 7. LOGOUT
// exports.logout = asyncHandler(async (req, res) => {
//   const authHeader = req.headers.authorization;
//   const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

//   if (authHeader && authHeader.startsWith('Bearer ')) {
//     const accessToken = authHeader.split(' ')[1];
//     const decoded = jwt.decode(accessToken);

//     if (decoded && decoded.exp) {
//       const timeToLive = decoded.exp - Math.floor(Date.now() / 1000);
//       if (timeToLive > 0) {
//         await redisUtils.setKey(`blacklist:${accessToken}`, true, timeToLive);
//       }
//     }
//   }

//   if (refreshToken) {
//     const tokenHash = hashToken(refreshToken);
//     await User.updateOne(
//       { 'refreshTokens.tokenHash': tokenHash },
//       { $pull: { refreshTokens: { tokenHash } } }
//     );
//   }

//   if (req.user?.id) {
//     await redisUtils.deleteKey(`user_session:${req.user.id}`);
//   }

//   res.clearCookie('refreshToken', cookieOptions);
//   return res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
// });

// // 8. GET CURRENT USER
// exports.getMe = asyncHandler(async (req, res) => {
//   const user = await User.findById(req.user.id);
//   if (!user) {
//     throw new ApiError(404, 'User not found');
//   }
//   return res.status(200).json(new ApiResponse(200, user, 'User details retrieved successfully'));
// });

// // 9. UPDATE ME
// exports.updateMe = asyncHandler(async (req, res) => {
//   const { name } = req.body;
//   const user = await User.findByIdAndUpdate(req.user.id, { name }, { new: true, runValidators: true });
  
//   // Keep cached user updated in Redis
//   await redisUtils.deleteKey(`user_session:${req.user.id}`);

//   return res.status(200).json(new ApiResponse(200, user, 'User updated successfully'));
// });



const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailsend');
const { redisUtils } = require('../config/redis');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');
const { ApiResponse } = require('../utils/ApiResponse');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  });

  const refreshToken = jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  });

  return { accessToken, refreshToken };
};

const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'strict' : 'lax',
  path: '/',
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// 1. REGISTER
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email, and password are required');
  }

  const cleanEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({ email: cleanEmail });
  if (existingUser && existingUser.isVerified) {
    throw new ApiError(400, 'Email already registered');
  }

  const cooldown = await redisUtils.getKey(`otp_cooldown:${cleanEmail}`);
  if (cooldown) {
    throw new ApiError(429, 'Please wait 60 seconds before requesting a new OTP.');
  }

  const otp = generateOTP();
  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

  const registerPayload = { name, email: cleanEmail, password, hashedOTP };

  await redisUtils.setKey(`register_otp:${cleanEmail}`, registerPayload, 600);
  await redisUtils.setKey(`otp_cooldown:${cleanEmail}`, true, 60);

  sendEmail({
    email: cleanEmail,
    subject: 'Your Registration OTP',
    html: `<h3>Your registration OTP is: <b>${otp}</b></h3><p>Valid for 10 minutes.</p>`,
  }).catch((err) => console.error('Email send failed:', err.message));

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'OTP sent to your email. Please verify to complete registration.'));
});

// 2. VERIFY REGISTRATION OTP
exports.verifyRegistrationOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    throw new ApiError(400, 'Email and OTP are required');
  }

  const cleanEmail = email.toLowerCase().trim();
  const cachedData = await redisUtils.getKey(`register_otp:${cleanEmail}`);

  if (!cachedData) {
    throw new ApiError(400, 'OTP expired or invalid request');
  }

  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
  if (cachedData.hashedOTP !== hashedOTP) {
    throw new ApiError(400, 'Invalid OTP');
  }

  let user = await User.findOne({ email: cleanEmail });
  if (!user) {
    user = await User.create({
      name: cachedData.name,
      email: cachedData.email,
      password: cachedData.password,
      isVerified: true,
    });
  } else {
    user.isVerified = true;
    user.password = cachedData.password;
    await user.save();
  }

  await redisUtils.deleteKey(`register_otp:${cleanEmail}`);

  return res
    .status(201)
    .json(new ApiResponse(201, { userId: user._id }, 'Registration successful! You can now log in.'));
});

// 3. LOGIN (Updated: Sets both Access & Refresh Token Cookies)
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isVerified) {
    throw new ApiError(403, 'Please verify your email before logging in');
  }

  const { accessToken, refreshToken } = generateTokens(user._id);
  const tokenHash = hashToken(refreshToken);

  await User.findByIdAndUpdate(user._id, {
    $push: {
      refreshTokens: {
        $each: [{ tokenHash }],
        $slice: -5,
      },
    },
  });

  // Set Access Token Cookie (15m)
  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  // Set Refresh Token Cookie (7d)
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { user: { id: user._id, name: user.name, email: user.email, role: user.role } },
      'User logged in successfully'
    )
  );
});

// 4. REFRESH ACCESS TOKEN (Updated: Sets Access Token Cookie)
exports.refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    throw new ApiError(401, 'Refresh token missing');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const oldTokenHash = hashToken(token);
  const newTokens = generateTokens(decoded.id);
  const newTokenHash = hashToken(newTokens.refreshToken);

  const updatedUser = await User.findOneAndUpdate(
    { _id: decoded.id, 'refreshTokens.tokenHash': oldTokenHash },
    {
      $set: { 'refreshTokens.$.tokenHash': newTokenHash },
    },
    { new: true }
  );

  if (!updatedUser) {
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
    throw new ApiError(401, 'Token revoked or invalid');
  }

  await redisUtils.deleteKey(`user_session:${decoded.id}`);

  // Set New Access Token Cookie
  res.cookie('accessToken', newTokens.accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  // Set Rotated Refresh Token Cookie
  res.cookie('refreshToken', newTokens.refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json(new ApiResponse(200, null, 'Token refreshed successfully'));
});

// 5. FORGOT PASSWORD
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, 'Email is required');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return res.status(200).json(new ApiResponse(200, null, 'If email exists, OTP has been sent.'));
  }

  const otp = user.createOTP();
  await user.save();

  await sendEmail({
    email: user.email,
    subject: 'Password Reset OTP',
    html: `<h3>Your password reset OTP is <b>${otp}</b></h3>`,
  });

  return res.status(200).json(new ApiResponse(200, null, 'If email exists, OTP has been sent.'));
});

// 6. RESET PASSWORD
exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    throw new ApiError(400, 'Email, OTP, and new password are required');
  }

  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
  const user = await User.findOne({
    email: email.toLowerCase().trim(),
    otpHash: hashedOTP,
    otpExpires: { $gt: Date.now() },
  }).select('+otpHash +otpExpires');

  if (!user) {
    throw new ApiError(400, 'Invalid or expired OTP');
  }

  user.password = newPassword;
  user.otpHash = undefined;
  user.otpExpires = undefined;
  user.refreshTokens = [];
  await user.save();

  await redisUtils.deleteKey(`user_session:${user._id}`);

  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);

  return res.status(200).json(new ApiResponse(200, null, 'Password reset successful. Please login with your new password.'));
});

// 7. LOGOUT (Updated: Clears both cookies & checks Cookie for Access Token)
exports.logout = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  const accessToken = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : req.cookies?.accessToken;

  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (accessToken) {
    const decoded = jwt.decode(accessToken);
    if (decoded && decoded.exp) {
      const timeToLive = decoded.exp - Math.floor(Date.now() / 1000);
      if (timeToLive > 0) {
        await redisUtils.setKey(`blacklist:${accessToken}`, true, timeToLive);
      }
    }
  }

  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await User.updateOne(
      { 'refreshTokens.tokenHash': tokenHash },
      { $pull: { refreshTokens: { tokenHash } } }
    );
  }

  if (req.user?.id) {
    await redisUtils.deleteKey(`user_session:${req.user.id}`);
  }

  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);

  return res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});

// 8. GET CURRENT USER
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return res.status(200).json(new ApiResponse(200, user, 'User details retrieved successfully'));
});

// 9. UPDATE ME
exports.updateMe = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const user = await User.findByIdAndUpdate(req.user.id, { name }, { new: true, runValidators: true });

  await redisUtils.deleteKey(`user_session:${req.user.id}`);

  return res.status(200).json(new ApiResponse(200, user, 'User updated successfully'));
});