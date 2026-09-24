const CreditTransaction = require('../models/CreditTransaction');

// GET /api/credits/balance
exports.getBalance = async (req, res, next) => {
  try {

    // console.log("req.user check creidt blacne",req.user)
    await req.user.refreshCreditsIfDue();
    res.json({ success: true, credits: req.user.aiCredits, plan: req.user.subscription.plan });
  } catch (err) { next(err); }
};

// GET /api/credits/history — recent debit/grant transactions
exports.getHistory = async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    const transactions = await CreditTransaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    res.json({ success: true, transactions });
  } catch (err) { next(err); }
};

// GET /api/credits/usage-summary — grouped by action, for a simple usage chart
exports.getUsageSummary = async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const summary = await CreditTransaction.aggregate([
      { $match: { userId: req.user._id, type: 'debit', createdAt: { $gte: since } } },
      { $group: { _id: '$action', totalCredits: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { totalCredits: -1 } },
    ]);
    res.json({ success: true, summary });
  } catch (err) { next(err); }
};
