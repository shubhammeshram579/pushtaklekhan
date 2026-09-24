const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay order for a one-time (monthly) charge.
 * amountInRupees: e.g. 499 for ₹499 — Razorpay wants paise (integer).
 */
async function createOrder(amountInRupees, receipt, notes = {}) {
  return razorpay.orders.create({
    amount: Math.round(amountInRupees * 100), // paise
    currency: 'INR',
    receipt,
    notes,
  });
}

/**
 * Verify the signature Razorpay sends back after checkout completes.
 * This proves the payment wasn't tampered with client-side.
 */
function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
}

/**
 * Verify a Razorpay webhook payload signature (for the /webhook endpoint).
 */
function verifyWebhookSignature(rawBody, signature) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return expected === signature;
}

module.exports = { razorpay, createOrder, verifyPaymentSignature, verifyWebhookSignature };
