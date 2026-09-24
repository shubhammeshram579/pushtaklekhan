const express = require('express');
const router = express.Router();
const credits = require('../controllers/credits.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);
router.get('/balance', credits.getBalance);
router.get('/history', credits.getHistory);
router.get('/usage-summary', credits.getUsageSummary);

module.exports = router;
