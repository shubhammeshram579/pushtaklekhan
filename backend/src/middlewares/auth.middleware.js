const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { redisUtils } = require('../config/redis');

const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Extract Token from Authorization Header OR Cookies
    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_MISSING',
        message: 'Not authorized — no token provided',
      });
    }

    // 2. Fast O(1) Redis Blacklist Check
    const isBlacklisted = await redisUtils.getKey(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_REVOKED',
        message: 'Token has been revoked. Please log in again.',
      });
    }

    // 3. Verify JWT Signature
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          code: 'TOKEN_EXPIRED',
          message: 'Access token expired',
        });
      }
      return res.status(401).json({
        success: false,
        code: 'TOKEN_INVALID',
        message: 'Invalid access token',
      });
    }

    // 4. Redis User Cache Optimization
    const cacheKey = `user_session:${decoded.id}`;
    let cachedUserData = await redisUtils.getKey(cacheKey);

    if (typeof cachedUserData === 'string') {
      try {
        cachedUserData = JSON.parse(cachedUserData);
      } catch (e) {
        cachedUserData = null;
      }
    }

    let user;

    if (cachedUserData) {
      // CACHE HIT: Hydrate Mongoose document directly without hitting DB
      user = User.hydrate(cachedUserData);
    } else {
      // CACHE MISS: Query DB and cache plain object
      user = await User.findById(decoded.id).select('-password');
      // console.log("user",user)
      if (!user) {
        return res.status(401).json({
          success: false,
          code: 'USER_NOT_FOUND',
          message: 'User account no longer exists',
        });
      }
      await redisUtils.setKey(cacheKey, user.toObject(), 300); // 5 min TTL
    }

    // 5. Attach user document to request
    req.user = user;
    next();
  } catch (err) {
    console.error('Protect Middleware Error:', err);
    return res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: 'Internal authorization error',
    });
  }
};

module.exports = { protect };