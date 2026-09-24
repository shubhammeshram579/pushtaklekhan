const mongoose = require('mongoose');

const characterSchema = new mongoose.Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
    index: true,
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Character name is required'],
    trim: true,
    maxlength: 100,
  },
  role: {
    type: String,
    enum: ['protagonist', 'antagonist', 'supporting', 'minor', 'narrator'],
    default: 'supporting',
  },
  personality: { type: String, default: '', maxlength: 1000 },
  appearance: { type: String, default: '', maxlength: 1000 },
  backstory: { type: String, default: '', maxlength: 3000 },
  goals: { type: String, default: '', maxlength: 500 },
  relationships: [{
    characterName: String,
    relationshipType: String,
  }],
  tags: [{ type: String, trim: true }],
  avatar: { type: String, default: null },
  notes: { type: String, default: '', maxlength: 2000 },
}, { timestamps: true });

characterSchema.index({ bookId: 1, name: 1 });

module.exports = mongoose.model('Character', characterSchema);
