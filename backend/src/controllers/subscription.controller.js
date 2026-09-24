const Payment = require('../models/Payment');
const CreditTransaction = require('../models/CreditTransaction');
const { createOrder, verifyPaymentSignature } = require('../services/razorpay.service');
const { PLANS, getPlan } = require('../config/plans');

// GET /api/subscription/plans — public plan list for the pricing page
exports.getPlans = async (req, res, next) => {
  try {
    res.json({ success: true, plans: Object.values(PLANS) });
  } catch (err) { next(err); }
};

// GET /api/subscription/me — current user's plan + credit status
exports.getMyStatus = async (req, res, next) => {
  try {
    await req.user.refreshCreditsIfDue();
    res.json({
      success: true,
      subscription: req.user.subscription,
      credits: req.user.aiCredits,
    });
  } catch (err) { next(err); }
};

// POST /api/subscription/create-order — start a Razorpay checkout for a plan upgrade
exports.createSubscriptionOrder = async (req, res, next) => {
  try {
    const { planId } = req.body;
    if (!['pro', 'studio'].includes(planId)) {
      return res.status(400).json({ success: false, message: 'Invalid plan selected' });
    }
    const plan = getPlan(planId);

    const receipt = `inkwell_${req.user._id}_${Date.now()}`;
    const order = await createOrder(plan.price, receipt, {
      userId: req.user._id.toString(),
      planId,
    });

    await Payment.create({
      userId: req.user._id,
      plan: planId,
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      status: 'created',
    });

    res.json({
      success: true,
      order: { id: order.id, amount: order.amount, currency: order.currency },
      keyId: process.env.RAZORPAY_KEY_ID, // public key — safe to expose to frontend
      plan,
    });
  } catch (err) { next(err); }
};

// POST /api/subscription/verify — called after Razorpay checkout completes on the frontend
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
    }

    const valid = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Payment signature verification failed' });
    }

    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id, userId: req.user._id });
    if (!payment) return res.status(404).json({ success: false, message: 'Order not found' });

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = 'paid';
    await payment.save();

    // Upgrade the user
    const plan = getPlan(payment.plan);
    const user = req.user;
    user.subscription.plan = payment.plan;
    user.subscription.status = 'active';
    user.subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    user.subscription.cancelAtPeriodEnd = false;

    user.aiCredits.total = plan.aiCreditsPerMonth;
    user.aiCredits.remaining = plan.aiCreditsPerMonth;
    user.aiCredits.resetAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await user.save();

    await CreditTransaction.create({
      userId: user._id,
      type: 'grant',
      action: 'plan-upgrade',
      amount: plan.aiCreditsPerMonth,
      balanceAfter: user.aiCredits.remaining,
      meta: { plan: payment.plan, paymentId: razorpay_payment_id },
    });

    res.json({ success: true, message: `Upgraded to ${plan.name}`, subscription: user.subscription, credits: user.aiCredits });
  } catch (err) { next(err); }
};

// POST /api/subscription/cancel — cancel at period end (keeps access until currentPeriodEnd)
exports.cancelSubscription = async (req, res, next) => {
  try {
    const user = req.user;
    if (user.subscription.plan === 'free') {
      return res.status(400).json({ success: false, message: 'You are already on the free plan' });
    }
    user.subscription.cancelAtPeriodEnd = true;
    await user.save();
    res.json({
      success: true,
      message: `Your plan will downgrade to Free on ${user.subscription.currentPeriodEnd.toDateString()}`,
      subscription: user.subscription,
    });
  } catch (err) { next(err); }
};

// GET /api/subscription/history — payment history for billing page
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await Payment.find({ userId: req.user._id, status: 'paid' }).sort({ createdAt: -1 });
    res.json({ success: true, payments });
  } catch (err) { next(err); }
};
