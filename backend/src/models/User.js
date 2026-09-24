const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // FIX 1: Required missing dependency

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [
        function () {
          return this.isNew; // Required ONLY during User creation
        },
        'Password is required',
      ],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    avatar: {
      type: String,
      default: null,
    },
    preferences: {
      theme: { type: String, enum: ['light', 'dark'], default: 'light' },
      fontSize: { type: Number, default: 17, min: 12, max: 24 },
      autoSave: { type: Boolean, default: true },
    },

    // ── Subscription & AI credits ──
    subscription: {
      plan: { type: String, enum: ['free', 'pro', 'studio'], default: 'free' },
      status: { type: String, enum: ['active', 'past_due', 'cancelled', 'none'], default: 'none' },
      razorpayCustomerId: { type: String, default: null, index: true },
      razorpaySubscriptionId: { type: String, default: null, index: true },
      currentPeriodEnd: { type: Date, default: null },
      cancelAtPeriodEnd: { type: Boolean, default: false },
    },
    aiCredits: {
      total: { type: Number, default: 100 },
      remaining: { type: Number, default: 100 },
      resetAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    },

    // ── Role & Moderation ──
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    moderation: {
      isBlocked: { type: Boolean, default: false },
      blockedReason: { type: String, default: null },
      blockedAt: { type: Date, default: null },
      blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },

    isVerified: { type: Boolean, default: false },

    // OTP Management
    otpHash: { type: String, select: false },
    otpExpires: { type: Date, select: false },

    // Refresh Tokens
    refreshTokens: [
      {
        tokenHash: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// High-Traffic Indexes
userSchema.index({ 'refreshTokens.tokenHash': 1 });

// Password hashing before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    throw new Error('Password field was not selected in query. Use .select("+password")');
  }
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.refreshCreditsIfDue = async function () {
  const now = new Date();

  if (this.aiCredits.resetAt && now >= this.aiCredits.resetAt) {
    const { getPlan } = require('../config/plans');

    let planName = this.subscription.plan;
    let status = this.subscription.status;
    let cancelAtPeriodEnd = this.subscription.cancelAtPeriodEnd;

    if (this.subscription.cancelAtPeriodEnd) {
      planName = 'free';
      status = 'cancelled';
      cancelAtPeriodEnd = false;
    }

    const plan = getPlan(planName);

    // ✅ Use updateOne to avoid full document validation & missing password errors
    await this.constructor.updateOne(
      { _id: this._id },
      {
        $set: {
          'subscription.plan': planName,
          'subscription.status': status,
          'subscription.cancelAtPeriodEnd': cancelAtPeriodEnd,
          'aiCredits.total': plan.aiCreditsPerMonth,
          'aiCredits.remaining': plan.aiCreditsPerMonth,
          'aiCredits.resetAt': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      }
    );

    // Update in-memory properties so caller has fresh state
    this.subscription.plan = planName;
    this.subscription.status = status;
    this.subscription.cancelAtPeriodEnd = cancelAtPeriodEnd;
    this.aiCredits.total = plan.aiCreditsPerMonth;
    this.aiCredits.remaining = plan.aiCreditsPerMonth;
    this.aiCredits.resetAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  return this;
};

// Sanitize outputs
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otpHash;
  delete obj.otpExpires;
  delete obj.refreshTokens;
  return obj;
};

// Generate & Hash 6-digit OTP
userSchema.methods.createOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  this.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  return otp;
};

module.exports = mongoose.model('User', userSchema);
