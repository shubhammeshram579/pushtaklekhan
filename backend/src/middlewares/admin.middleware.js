/**
 * Stack this after `protect` on any admin route:
 *   router.use(protect, requireAdmin);
 * Assumes req.user is already populated by protect.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

module.exports = { requireAdmin };
