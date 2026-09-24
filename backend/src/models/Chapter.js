const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Chapter title is required'],
    trim: true,
    maxlength: [200, 'Chapter title cannot exceed 200 characters'],
  },
  order: { type: Number, required: true, default: 0 },
  summary: { type: String, default: '', maxlength: 1000 },
  notes: { type: String, default: '', maxlength: 3000 },
  wordCount: { type: Number, default: 0 },
  color: { type: String, default: null }, // optional color label
}, { timestamps: true });

chapterSchema.index({ bookId: 1, order: 1 });

module.exports = mongoose.model('Chapter', chapterSchema);
