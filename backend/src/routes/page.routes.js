const express = require('express');
const router = express.Router();
const page = require('../controllers/page.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);
router.post('/', page.createPage);
router.get('/:chapterId', page.getPages);
router.get('/single/:id', page.getPage);
router.put('/:id', page.updatePage);
router.delete('/:id', page.deletePage);
router.get('/:id/drafts', page.getDrafts);

module.exports = router;
