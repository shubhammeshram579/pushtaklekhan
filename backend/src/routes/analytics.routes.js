const express = require('express');
const router = express.Router();
const a = require('../controllers/analytics.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);
router.post('/track', a.trackWriting);
router.get('/book/:bookId', a.getBookAnalytics);
router.get('/dashboard', a.getDashboardAnalytics);

module.exports = router;
