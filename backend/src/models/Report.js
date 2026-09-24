const mongoose = require('mongoose');

/**
 * Lightweight content-report model. No community features exist yet
 * (comments, public books, shared drafts), so this collection will be
 * empty in a fresh install — the admin panel's Reports tab reflects that
 * honestly instead of faking data. Once you add any user-to-user visible
 * content (public book previews, shared chapters, etc.), point a "Report"
 * button at POST /api/admin/reports and this model + admin UI are ready.
 */
const reportSchema = new mongoose.Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['book', 'user', 'comment'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reason: {
    type: String,
    enum: ['spam', 'harassment', 'copyright', 'inappropriate', 'other'],
    required: true,
  },
  details: { type: String, default: '', maxlength: 1000 },
  status: { type: String, enum: ['pending', 'reviewed', 'dismissed', 'actioned'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  adminNote: { type: String, default: '' },
}, { timestamps: true });

reportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
