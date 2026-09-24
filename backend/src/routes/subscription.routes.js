const express = require('express');
const router = express.Router();
const sub = require('../controllers/subscription.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/plans', sub.getPlans); // public — no auth needed for pricing page

router.use(protect);
router.get('/me', sub.getMyStatus);
router.post('/create-order', sub.createSubscriptionOrder);
router.post('/verify', sub.verifyPayment);
router.post('/cancel', sub.cancelSubscription);
router.get('/history', sub.getPaymentHistory);

module.exports = router;
