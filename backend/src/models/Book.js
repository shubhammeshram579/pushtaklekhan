const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
    default: '',
  },
  coverImage: {
    type: String,
    default: null,
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30,
  }],
  genre: {
    type: String,
    enum: ['fiction', 'non-fiction', 'fantasy', 'sci-fi', 'mystery', 'romance', 'thriller', 'biography', 'self-help', 'technical', 'other'],
    default: 'other',
  },
  status: {
    type: String,
    enum: ['draft', 'in-progress', 'completed', 'published'],
    default: 'draft',
  },
  wordCountGoal: {
    type: Number,
    default: 0,
  },
  totalWordCount: {
    type: Number,
    default: 0,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

bookSchema.index({ authorId: 1, createdAt: -1 });
bookSchema.index({ authorId: 1, status: 1 });

module.exports = mongoose.model('Book', bookSchema);
