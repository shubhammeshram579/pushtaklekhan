const express = require('express');
const router = express.Router();
const admin = require('../controllers/admin.controller');
const { protect } = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/admin.middleware');

router.use(protect, requireAdmin);

router.get('/dashboard', admin.getDashboardStats);

router.get('/users', admin.getUsers);
router.get('/users/:id', admin.getUserDetail);
router.patch('/users/:id/block', admin.blockUser);
router.patch('/users/:id/unblock', admin.unblockUser);
router.patch('/users/:id/role', admin.changeUserRole);
router.patch('/users/:id/credits', admin.grantCredits);
router.delete('/users/:id', admin.deleteUser);

router.get('/ai-usage', admin.getAIUsage);
router.get('/revenue', admin.getRevenue);
router.get('/storage', admin.getStorageUsage);

router.get('/reports', admin.getReports);
router.patch('/reports/:id', admin.reviewReport);

module.exports = router;
