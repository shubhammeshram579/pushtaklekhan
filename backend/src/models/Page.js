const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  chapterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    required: true,
    index: true,
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
    index: true,
  },
  title: {
    type: String,
    trim: true,
    default: 'Untitled Page',
    maxlength: 100,
  },
  content: {
    type: String,
    default: '',
  },
  images: [{
    url: String,
    publicId: String,
    caption: String,
  }],
  pageNumber: {
    type: Number,
    default: 1,
  },
  version: {
    type: Number,
    default: 1,
  },
  wordCount: {
    type: Number,
    default: 0,
  },
  // Draft recovery — store last 5 auto-saves
  drafts: [{
    content: String,
    savedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

pageSchema.index({ chapterId: 1, pageNumber: 1 });

// Auto-calculate word count
pageSchema.pre('save', function (next) {
  if (this.isModified('content')) {
    const text = this.content.replace(/<[^>]*>/g, ' ').trim();
    this.wordCount = text ? text.split(/\s+/).length : 0;
    // Keep last 5 drafts
    if (this.drafts.length >= 5) {
      this.drafts = this.drafts.slice(-4);
    }
    this.drafts.push({ content: this.content, savedAt: new Date() });
    this.version += 1;
  }
  next();
});

module.exports = mongoose.model('Page', pageSchema);
