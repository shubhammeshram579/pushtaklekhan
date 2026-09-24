const express = require('express');
const router = express.Router();
const v = require('../controllers/version.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);
router.post('/', v.createVersion);
router.get('/:pageId', v.getVersions);
router.get('/single/:id', v.getVersion);
router.post('/:id/restore', v.restoreVersion);
router.delete('/:id', v.deleteVersion);

module.exports = router;
