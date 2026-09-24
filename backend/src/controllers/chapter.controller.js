const Chapter = require('../models/Chapter');
const Page = require('../models/Page');
const Book = require('../models/Book');

// POST /api/chapters
exports.createChapter = async (req, res, next) => {
  try {
    const { bookId, title } = req.body;
    const book = await Book.findOne({ _id: bookId, authorId: req.user._id });
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

    const count = await Chapter.countDocuments({ bookId });
    const chapter = await Chapter.create({ bookId, title, order: count });

    // Auto-create first page
    await Page.create({ chapterId: chapter._id, bookId, title: 'Page 1', pageNumber: 1 });

    res.status(201).json({ success: true, chapter });
  } catch (err) {
    next(err);
  }
};

// GET /api/chapters/:bookId
exports.getChapters = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.bookId, authorId: req.user._id });
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

    const chapters = await Chapter.find({ bookId: req.params.bookId }).sort({ order: 1 });
    res.json({ success: true, chapters });
  } catch (err) {
    next(err);
  }
};

// PUT /api/chapters/:id
exports.updateChapter = async (req, res, next) => {
  try {
    const { title, summary } = req.body;
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) return res.status(404).json({ success: false, message: 'Chapter not found' });

    const book = await Book.findOne({ _id: chapter.bookId, authorId: req.user._id });
    if (!book) return res.status(403).json({ success: false, message: 'Forbidden' });

    if (title) chapter.title = title;
    if (summary !== undefined) chapter.summary = summary;
    await chapter.save();

    res.json({ success: true, chapter });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/chapters/:id
exports.deleteChapter = async (req, res, next) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) return res.status(404).json({ success: false, message: 'Chapter not found' });

    const book = await Book.findOne({ _id: chapter.bookId, authorId: req.user._id });
    if (!book) return res.status(403).json({ success: false, message: 'Forbidden' });

    await Page.deleteMany({ chapterId: chapter._id });
    await chapter.deleteOne();

    // Reorder remaining chapters
    const remaining = await Chapter.find({ bookId: chapter.bookId }).sort({ order: 1 });
    await Promise.all(remaining.map((ch, i) => Chapter.findByIdAndUpdate(ch._id, { order: i })));

    res.json({ success: true, message: 'Chapter deleted' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/chapters/reorder
exports.reorderChapters = async (req, res, next) => {
  try {
    const { bookId, orderedIds } = req.body;
    const book = await Book.findOne({ _id: bookId, authorId: req.user._id });
    if (!book) return res.status(403).json({ success: false, message: 'Forbidden' });

    await Promise.all(orderedIds.map((id, i) => Chapter.findByIdAndUpdate(id, { order: i })));
    res.json({ success: true, message: 'Chapters reordered' });
  } catch (err) {
    next(err);
  }
};
