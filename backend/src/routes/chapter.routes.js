// chapter.routes.js
const express = require('express');
const router = express.Router();
const chapter = require('../controllers/chapter.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);
router.post('/', chapter.createChapter);
router.get('/:bookId', chapter.getChapters);
router.put('/:id', chapter.updateChapter);
router.delete('/:id', chapter.deleteChapter);
router.patch('/reorder', chapter.reorderChapters);

module.exports = router;
