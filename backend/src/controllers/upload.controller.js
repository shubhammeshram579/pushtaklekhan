const cloudinary = require('../utils/cloudinary');
const multer = require('multer');
const UploadLog = require('../models/UploadLog');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

exports.uploadMiddleware = upload.single('image');

// POST /api/uploads/image
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    // Convert buffer to base64 for Cloudinary upload
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: `inkwell/${req.user._id}`,
      resource_type: 'image',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });

    // NEW: log storage usage for the admin panel
    await UploadLog.create({
      userId: req.user._id,
      publicId: result.public_id,
      bytes: result.bytes,
      format: result.format,
      width: result.width,
      height: result.height,
    });

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/uploads/image
exports.deleteImage = async (req, res, next) => {
  try {
    const { publicId } = req.body;
    if (!publicId) return res.status(400).json({ success: false, message: 'publicId required' });

    await cloudinary.uploader.destroy(publicId);
    // NEW: mark as deleted instead of removing, to keep storage history accurate
    await UploadLog.updateOne({ publicId }, { deleted: true });
    res.json({ success: true, message: 'Image deleted' });
  } catch (err) {
    next(err);
  }
};
