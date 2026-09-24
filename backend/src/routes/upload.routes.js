const express = require('express');
const router = express.Router();
const { uploadImage, deleteImage, uploadMiddleware } = require('../controllers/upload.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);
router.post('/image', uploadMiddleware, uploadImage);
router.delete('/image', deleteImage);

module.exports = router;
