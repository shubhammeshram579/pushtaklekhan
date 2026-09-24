const CreditTransaction = require('../models/CreditTransaction');
const { getCreditCost } = require('../config/plans');


const User = require('../models/User'); // Import your User model

const requireCredits = (action) => async (req, res, next) => {
  try {
    const cost = getCreditCost(action);
    const user = req.user;

    await user.refreshCreditsIfDue();

    if (user.aiCredits.remaining < cost) {
      return res.status(402).json({
        success: false,
        code: 'INSUFFICIENT_CREDITS',
        message: `You've used all your AI credits for this period.`,
        credits: {
          remaining: user.aiCredits.remaining,
          total: user.aiCredits.total,
          resetAt: user.aiCredits.resetAt,
        },
        plan: user.subscription.plan,
      });
    }

    req.aiCreditCost = cost;
    
    // Attach fixed deduction function
    req.deductCredits = async (meta = {}) => {
      // 1. Calculate new remaining credit balance safely
      const newBalance = Math.max(0, user.aiCredits.remaining - cost);

      // 2. Perform atomic update in MongoDB (bypasses full schema validation)
      await User.updateOne(
        { _id: user._id },
        { $set: { 'aiCredits.remaining': newBalance } }
      );

      // 3. Update the in-memory req.user object for the current request context
      user.aiCredits.remaining = newBalance;

      // 4. Log the transaction
      await CreditTransaction.create({
        userId: user._id,
        type: 'debit',
        action,
        amount: cost,
        balanceAfter: newBalance,
        bookId: req.body.bookId || null,
        meta,
      });

      return newBalance;
    };

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireCredits };
