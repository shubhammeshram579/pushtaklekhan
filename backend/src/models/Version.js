const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  pageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Page',
    required: true,
    index: true,
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: { type: String, required: true },
  label: {
    type: String,
    default: '',
    maxlength: 100,
    // e.g. "Before AI rewrite", "Draft 1", "Final revision"
  },
  wordCount: { type: Number, default: 0 },
  versionNumber: { type: Number, default: 1 },
  isAutoSave: { type: Boolean, default: true },
}, { timestamps: true });

versionSchema.index({ pageId: 1, createdAt: -1 });

module.exports = mongoose.model('Version', versionSchema);
