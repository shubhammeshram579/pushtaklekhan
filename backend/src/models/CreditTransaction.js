const mongoose = require('mongoose');

const creditTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['debit', 'grant', 'refund'],
    required: true,
  },
  action: {
    type: String, // 'fix-grammar', 'rewrite', 'plan-renewal', 'plan-upgrade', 'manual-refund', etc.
    required: true,
  },
  amount: {
    type: Number, // positive number; type field tells you direction
    required: true,
  },
  balanceAfter: { type: Number, required: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', default: null },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

creditTransactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('CreditTransaction', creditTransactionSchema);
