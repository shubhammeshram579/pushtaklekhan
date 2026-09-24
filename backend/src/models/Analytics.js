const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
  },
  date: {
    type: String, // "YYYY-MM-DD"
    required: true,
  },
  wordsWritten: { type: Number, default: 0 },
  sessionsCount: { type: Number, default: 0 },
  writingMinutes: { type: Number, default: 0 },
  aiUsageCount: { type: Number, default: 0 },
}, { timestamps: true });

analyticsSchema.index({ authorId: 1, date: -1 });
analyticsSchema.index({ authorId: 1, bookId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Analytics', analyticsSchema);
