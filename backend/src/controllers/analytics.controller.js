const Analytics = require('../models/Analytics');
const Book = require('../models/Book');
const Page = require('../models/Page');
const Chapter = require('../models/Chapter');

const todayStr = () => new Date().toISOString().slice(0, 10);

// POST /api/analytics/track — called on each save
exports.trackWriting = async (req, res, next) => {
  try {
    const { bookId, wordsAdded, aiUsed } = req.body;
    const book = await Book.findOne({ _id: bookId, authorId: req.user._id });
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

    const date = todayStr();
    const update = {
      $inc: {
        wordsWritten: wordsAdded || 0,
        sessionsCount: 1,
        aiUsageCount: aiUsed ? 1 : 0,
      },
    };
    const analytics = await Analytics.findOneAndUpdate(
      { authorId: req.user._id, bookId, date },
      update,
      { upsert: true, new: true }
    );
    res.json({ success: true, analytics });
  } catch (err) { next(err); }
};

// GET /api/analytics/book/:bookId — book-level stats
exports.getBookAnalytics = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.bookId, authorId: req.user._id });
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

    // Last 30 days
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    const records = await Analytics.find({
      authorId: req.user._id,
      bookId: req.params.bookId,
      date: { $in: days },
    });

    const byDate = {};
    records.forEach(r => { byDate[r.date] = r; });

    const chartData = days.map(d => ({
      date: d,
      words: byDate[d]?.wordsWritten || 0,
      ai: byDate[d]?.aiUsageCount || 0,
    }));

    // Total stats
    const chapters = await Chapter.find({ bookId: req.params.bookId });
    const pages = await Page.find({ bookId: req.params.bookId });
    const totalWords = pages.reduce((s, p) => s + (p.wordCount || 0), 0);
    const totalAI = records.reduce((s, r) => s + (r.aiUsageCount || 0), 0);

    // Streak
    let streak = 0;
    for (let i = 0; i < days.length; i++) {
      const d = days[days.length - 1 - i];
      if (byDate[d]?.wordsWritten > 0) streak++;
      else break;
    }

    res.json({
      success: true,
      stats: {
        totalWords,
        totalChapters: chapters.length,
        totalPages: pages.length,
        totalAIUsage: totalAI,
        writingStreak: streak,
        wordCountGoal: book.wordCountGoal,
        goalProgress: book.wordCountGoal ? Math.round((totalWords / book.wordCountGoal) * 100) : 0,
        estimatedReadingMinutes: Math.ceil(totalWords / 250),
      },
      chartData,
    });
  } catch (err) { next(err); }
};

// GET /api/analytics/dashboard — overall user stats
exports.getDashboardAnalytics = async (req, res, next) => {
  try {
    const today = todayStr();
    const todayRecord = await Analytics.find({ authorId: req.user._id, date: today });
    const todayWords = todayRecord.reduce((s, r) => s + r.wordsWritten, 0);

    const allBooks = await Book.find({ authorId: req.user._id });
    const allPages = await Page.find({ bookId: { $in: allBooks.map(b => b._id) } });
    const totalWords = allPages.reduce((s, p) => s + (p.wordCount || 0), 0);

    res.json({
      success: true,
      stats: {
        totalBooks: allBooks.length,
        totalWords,
        todayWords,
        estimatedReadingHours: Math.ceil(totalWords / 15000),
      },
    });
  } catch (err) { next(err); }
};
