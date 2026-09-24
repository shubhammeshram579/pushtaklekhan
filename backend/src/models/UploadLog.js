const mongoose = require('mongoose');

/**
 * One row per successful image upload. Lets the admin panel report real
 * storage usage instead of guessing. Written to by upload.controller.js
 * right after a Cloudinary upload succeeds (see upload.controller.js merge
 * instructions).
 */
const uploadLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  publicId: { type: String, required: true },
  bytes: { type: Number, required: true, default: 0 },
  format: { type: String, default: '' },
  width: { type: Number, default: 0 },
  height: { type: Number, default: 0 },
  deleted: { type: Boolean, default: false },
}, { timestamps: true });

uploadLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('UploadLog', uploadLogSchema);
