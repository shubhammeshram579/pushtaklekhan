const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  plan: { type: String, enum: ['pro', 'studio'], required: true },
  razorpayOrderId: { type: String, required: true, unique: true },
  razorpayPaymentId: { type: String, default: null },
  razorpaySignature: { type: String, default: null },
  amount: { type: Number, required: true }, // in paise (smallest unit)
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['created', 'paid', 'failed'],
    default: 'created',
  },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
