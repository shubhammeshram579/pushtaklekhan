const express = require('express');
const multer = require('multer');
const router = express.Router();
const book = require('../controllers/book.controller');

const { protect } = require('../middlewares/auth.middleware');

const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

router.route('/').post(book.createBook).get(book.getBooks);
router.route('/:id').get(book.getBook).put(upload.single('coverImage'),book.updateBook).delete(book.deleteBook);
router.get('/:id/export', book.exportBook);
router.get(
  "/:id/export/docx",
  book.exportBookDocx
);


router.get(
  "/:id/export/pdf",
  book.exportBookPdf
);

router.get(
  "/:id/export/epub",
  book.exportBookEpub
);

module.exports = router;
