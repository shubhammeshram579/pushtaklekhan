const Page = require('../models/Page');
const Chapter = require('../models/Chapter');
const Book = require('../models/Book');

const verifyAccess = async (chapterId, userId) => {
  const chapter = await Chapter.findById(chapterId);
  if (!chapter) return null;
  const book = await Book.findOne({ _id: chapter.bookId, authorId: userId });
  if (!book) return null;
  return { chapter, book };
};

// POST /api/pages
exports.createPage = async (req, res, next) => {
  try {
    const { chapterId, title, content } = req.body;
    const access = await verifyAccess(chapterId, req.user._id);
    if (!access) return res.status(404).json({ success: false, message: 'Chapter not found or access denied' });

    const count = await Page.countDocuments({ chapterId });
    const page = await Page.create({
      chapterId,
      bookId: access.chapter.bookId,
      title: title || `Page ${count + 1}`,
      content: content || '',
      pageNumber: count + 1,
    });

    res.status(201).json({ success: true, page });
  } catch (err) {
    next(err);
  }
};

// GET /api/pages/:chapterId
exports.getPages = async (req, res, next) => {
  try {
    const access = await verifyAccess(req.params.chapterId, req.user._id);
    if (!access) return res.status(404).json({ success: false, message: 'Chapter not found' });

    const pages = await Page.find({ chapterId: req.params.chapterId })
      .sort({ pageNumber: 1 })
      .select('-drafts'); // exclude drafts from list view

    res.json({ success: true, pages });
  } catch (err) {
    next(err);
  }
};

// GET /api/pages/single/:id
exports.getPage = async (req, res, next) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });

    const access = await verifyAccess(page.chapterId, req.user._id);
    if (!access) return res.status(403).json({ success: false, message: 'Forbidden' });

    res.json({ success: true, page });
  } catch (err) {
    next(err);
  }
};

// PUT /api/pages/:id
exports.updatePage = async (req, res, next) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });

    const access = await verifyAccess(page.chapterId, req.user._id);
    if (!access) return res.status(403).json({ success: false, message: 'Forbidden' });

    const { title, content } = req.body;
    if (title !== undefined) page.title = title;
    if (content !== undefined) page.content = content;
    await page.save();

    // Update chapter word count
    const allPages = await Page.find({ chapterId: page.chapterId });
    const totalWords = allPages.reduce((s, p) => s + (p.wordCount || 0), 0);
    await Chapter.findByIdAndUpdate(page.chapterId, { wordCount: totalWords });

    res.json({ success: true, page });
  } catch (err) {
    next(err);
  }
};


// DELETE /api/pages/:id
exports.deletePage = async (req, res, next) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });

    const access = await verifyAccess(page.chapterId, req.user._id);
    if (!access) return res.status(403).json({ success: false, message: 'Forbidden' });

    await page.deleteOne();

    // Reorder remaining pages
    const remaining = await Page.find({ chapterId: page.chapterId }).sort({ pageNumber: 1 });
    await Promise.all(remaining.map((p, i) => Page.findByIdAndUpdate(p._id, { pageNumber: i + 1 })));

    res.json({ success: true, message: 'Page deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/pages/:id/drafts — list saved drafts for recovery
exports.getDrafts = async (req, res, next) => {
  try {
    const page = await Page.findById(req.params.id).select('drafts title');
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
    res.json({ success: true, drafts: page.drafts });
  } catch (err) {
    next(err);
  }
};
