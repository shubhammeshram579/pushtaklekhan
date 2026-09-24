const User = require('../models/User');
const Book = require('../models/Book');
const Chapter = require('../models/Chapter');
const Page = require('../models/Page');
const CreditTransaction = require('../models/CreditTransaction');
const Payment = require('../models/Payment');
const Report = require('../models/Report');
const UploadLog = require('../models/UploadLog');

const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

// ═══════════════════════════════════════════
// GET /api/admin/dashboard — the headline stat cards
// ═══════════════════════════════════════════
exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = startOfDay();
    const weekAgo = daysAgo(7);

    const [
      totalUsers,
      newUsersThisWeek,
      totalBooks,
      draftBooks,
      inProgressBooks,
      completedBooks,
      publishedBooks,
      aiRequestsToday,
      activeSubs,
      blockedUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      Book.countDocuments(),
      Book.countDocuments({ status: 'draft' }),
      Book.countDocuments({ status: 'in-progress' }),
      Book.countDocuments({ status: 'completed' }),
      Book.countDocuments({ status: 'published' }),
      CreditTransaction.countDocuments({ type: 'debit', createdAt: { $gte: today } }),
      User.countDocuments({ 'subscription.plan': { $in: ['pro', 'studio'] }, 'subscription.status': 'active' }),
      User.countDocuments({ 'moderation.isBlocked': true }),
    ]);

    const topWritersAgg = await Page.aggregate([
      { $group: { _id: '$bookId', words: { $sum: '$wordCount' } } },
      { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'book' } },
      { $unwind: '$book' },
      { $group: { _id: '$book.authorId', totalWords: { $sum: '$words' }, bookCount: { $addToSet: '$book._id' } } },
      { $sort: { totalWords: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { name: '$user.name', email: '$user.email', totalWords: 1, bookCount: { $size: '$bookCount' } } },
    ]);

    const topAIFeatures = await CreditTransaction.aggregate([
      { $match: { type: 'debit', createdAt: { $gte: daysAgo(30) } } },
      { $group: { _id: '$action', count: { $sum: 1 }, credits: { $sum: '$amount' } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const revenueAgg = await Payment.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const revenueThisMonth = (revenueAgg[0]?.total || 0) / 100;

    res.json({
      success: true,
      stats: {
        totalUsers, newUsersThisWeek, totalBooks,
        draftBooks, inProgressBooks, completedBooks, publishedBooks,
        aiRequestsToday, activeSubscriptions: activeSubs, blockedUsers,
        revenueThisMonth,
      },
      topWriters: topWritersAgg,
      topAIFeatures,
    });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════
// USER MANAGEMENT
// ═══════════════════════════════════════════

exports.getUsers = async (req, res, next) => {
  try {
    const { search = '', plan = '', role = '', blocked = '', page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    if (plan) query['subscription.plan'] = plan;
    if (role) query.role = role;
    if (blocked === 'true') query['moderation.isBlocked'] = true;
    if (blocked === 'false') query['moderation.isBlocked'] = false;

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-password');

    const total = await User.countDocuments(query);

    const userIds = users.map(u => u._id);
    const bookCounts = await Book.aggregate([
      { $match: { authorId: { $in: userIds } } },
      { $group: { _id: '$authorId', count: { $sum: 1 } } },
    ]);
    const bookCountMap = Object.fromEntries(bookCounts.map(b => [b._id.toString(), b.count]));

    const enriched = users.map(u => ({ ...u.toObject(), bookCount: bookCountMap[u._id.toString()] || 0 }));

    res.json({ success: true, users: enriched, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

exports.getUserDetail = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const [books, creditHistory, payments] = await Promise.all([
      Book.find({ authorId: user._id }).select('title status totalWordCount createdAt'),
      CreditTransaction.find({ userId: user._id }).sort({ createdAt: -1 }).limit(20),
      Payment.find({ userId: user._id, status: 'paid' }).sort({ createdAt: -1 }),
    ]);

    res.json({ success: true, user, books, creditHistory, payments });
  } catch (err) { next(err); }
};

exports.blockUser = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot block an admin' });

    user.moderation = {
      isBlocked: true,
      blockedReason: reason || 'Violation of terms of service',
      blockedAt: new Date(),
      blockedBy: req.user._id,
    };
    await user.save();
    res.json({ success: true, message: `${user.name} has been blocked`, user });
  } catch (err) { next(err); }
};

exports.unblockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.moderation = { isBlocked: false, blockedReason: null, blockedAt: null, blockedBy: null };
    await user.save();
    res.json({ success: true, message: `${user.name} has been unblocked`, user });
  } catch (err) { next(err); }
};

exports.changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: `${user.name} is now ${role}`, user });
  } catch (err) { next(err); }
};

exports.grantCredits = async (req, res, next) => {
  try {
    const { amount, reason } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Amount must be positive' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.aiCredits.remaining += Number(amount);
    user.aiCredits.total += Number(amount);
    await user.save();

    await CreditTransaction.create({
      userId: user._id,
      type: 'grant',
      action: 'admin-grant',
      amount: Number(amount),
      balanceAfter: user.aiCredits.remaining,
      meta: { reason: reason || 'Manual grant by admin', grantedBy: req.user._id.toString() },
    });

    res.json({ success: true, message: `Granted ${amount} credits to ${user.name}`, credits: user.aiCredits });
  } catch (err) { next(err); }
};

exports.deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot delete an admin' });

    const books = await Book.find({ authorId: user._id });
    const bookIds = books.map(b => b._id);
    const chapters = await Chapter.find({ bookId: { $in: bookIds } });
    const chapterIds = chapters.map(c => c._id);

    await Promise.all([
      Page.deleteMany({ chapterId: { $in: chapterIds } }),
      Chapter.deleteMany({ bookId: { $in: bookIds } }),
      Book.deleteMany({ authorId: user._id }),
      CreditTransaction.deleteMany({ userId: user._id }),
      UploadLog.deleteMany({ userId: user._id }),
      User.findByIdAndDelete(user._id),
    ]);

    res.json({ success: true, message: `${user.name}'s account and all content deleted` });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════
// AI USAGE MONITORING
// ═══════════════════════════════════════════

exports.getAIUsage = async (req, res, next) => {
  try {
    const since = daysAgo(30);

    const dailyRaw = await CreditTransaction.aggregate([
      { $match: { type: 'debit', createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, requests: { $sum: 1 }, credits: { $sum: '$amount' } } },
      { $sort: { _id: 1 } },
    ]);
    const dailyMap = Object.fromEntries(dailyRaw.map(d => [d._id, d]));
    const daily = [];
    for (let i = 29; i >= 0; i--) {
      const key = daysAgo(i).toISOString().slice(0, 10);
      daily.push({ date: key, requests: dailyMap[key]?.requests || 0, credits: dailyMap[key]?.credits || 0 });
    }

    const byAction = await CreditTransaction.aggregate([
      { $match: { type: 'debit', createdAt: { $gte: since } } },
      { $group: { _id: '$action', requests: { $sum: 1 }, credits: { $sum: '$amount' } } },
      { $sort: { requests: -1 } },
    ]);

    const topUsers = await CreditTransaction.aggregate([
      { $match: { type: 'debit', createdAt: { $gte: since } } },
      { $group: { _id: '$userId', requests: { $sum: 1 }, credits: { $sum: '$amount' } } },
      { $sort: { credits: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { name: '$user.name', email: '$user.email', plan: '$user.subscription.plan', requests: 1, credits: 1 } },
    ]);

    const totalRequests = daily.reduce((s, d) => s + d.requests, 0);
    const totalCredits = daily.reduce((s, d) => s + d.credits, 0);

    res.json({ success: true, daily, byAction, topUsers, totals: { totalRequests, totalCredits } });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════
// REVENUE ANALYTICS
// ═══════════════════════════════════════════

exports.getRevenue = async (req, res, next) => {
  try {
    const since = daysAgo(90);

    const monthlyRaw = await Payment.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const planDistribution = await User.aggregate([
      { $group: { _id: '$subscription.plan', count: { $sum: 1 } } },
    ]);

    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const mrr = planDistribution.reduce((sum, p) => {
      const prices = { free: 0, pro: 499, studio: 1299 };
      return sum + (prices[p._id] || 0) * p.count;
    }, 0);

    res.json({
      success: true,
      monthly: monthlyRaw.map(m => ({ month: m._id, revenue: m.total / 100, count: m.count })),
      planDistribution,
      totalRevenueAllTime: (totalRevenue[0]?.total || 0) / 100,
      estimatedMRR: mrr,
    });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════
// STORAGE USAGE
// ═══════════════════════════════════════════

exports.getStorageUsage = async (req, res, next) => {
  try {
    const totalAgg = await UploadLog.aggregate([
      { $match: { deleted: false } },
      { $group: { _id: null, totalBytes: { $sum: '$bytes' }, count: { $sum: 1 } } },
    ]);

    const byUser = await UploadLog.aggregate([
      { $match: { deleted: false } },
      { $group: { _id: '$userId', bytes: { $sum: '$bytes' }, count: { $sum: 1 } } },
      { $sort: { bytes: -1 } },
      { $limit: 15 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { name: '$user.name', email: '$user.email', bytes: 1, count: 1 } },
    ]);

    res.json({
      success: true,
      total: { bytes: totalAgg[0]?.totalBytes || 0, count: totalAgg[0]?.count || 0 },
      byUser,
    });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════
// REPORTS (content moderation foundation)
// ═══════════════════════════════════════════

exports.getReports = async (req, res, next) => {
  try {
    const { status = 'pending' } = req.query;
    const query = status === 'all' ? {} : { status };
    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .populate('reporterId', 'name email')
      .limit(100);
    res.json({ success: true, reports });
  } catch (err) { next(err); }
};

exports.reviewReport = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status, adminNote, reviewedBy: req.user._id, reviewedAt: new Date() },
      { new: true }
    );
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, report });
  } catch (err) { next(err); }
};
