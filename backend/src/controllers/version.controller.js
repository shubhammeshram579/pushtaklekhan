const Version = require('../models/Version');
const Page = require('../models/Page');
const Book = require('../models/Book');
const Chapter = require('../models/Chapter');

const verifyPageAccess = async (pageId, userId) => {
  const page = await Page.findById(pageId);
  if (!page) return null;
  const book = await Book.findOne({ _id: page.bookId, authorId: userId });
  return book ? page : null;
};

// POST /api/versions — save a named checkpoint
exports.createVersion = async (req, res, next) => {
  try {
    const { pageId, content, label } = req.body;
    const page = await verifyPageAccess(pageId, req.user._id);
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });

    const count = await Version.countDocuments({ pageId });
    const text = content.replace(/<[^>]*>/g, ' ').trim();
    const wordCount = text ? text.split(/\s+/).length : 0;

    const version = await Version.create({
      pageId,
      bookId: page.bookId,
      authorId: req.user._id,
      content,
      label: label || `Version ${count + 1}`,
      wordCount,
      versionNumber: count + 1,
      isAutoSave: !label,
    });
    res.status(201).json({ success: true, version });
  } catch (err) { next(err); }
};

// GET /api/versions/:pageId — list all versions for a page
exports.getVersions = async (req, res, next) => {
  try {
    const page = await verifyPageAccess(req.params.pageId, req.user._id);
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });

    const versions = await Version.find({ pageId: req.params.pageId })
      .sort({ createdAt: -1 })
      .select('-content') // exclude full content from list
      .limit(50);
    res.json({ success: true, versions });
  } catch (err) { next(err); }
};

// GET /api/versions/single/:id — get full version content
exports.getVersion = async (req, res, next) => {
  try {
    const version = await Version.findOne({ _id: req.params.id, authorId: req.user._id });
    if (!version) return res.status(404).json({ success: false, message: 'Version not found' });
    res.json({ success: true, version });
  } catch (err) { next(err); }
};

// POST /api/versions/:id/restore — restore a version to page content
exports.restoreVersion = async (req, res, next) => {
  try {
    const version = await Version.findOne({ _id: req.params.id, authorId: req.user._id });
    if (!version) return res.status(404).json({ success: false, message: 'Version not found' });

    // Save current as auto-backup before restoring
    const currentPage = await Page.findById(version.pageId);
    if (currentPage) {
      const count = await Version.countDocuments({ pageId: version.pageId });
      const text = (currentPage.content || '').replace(/<[^>]*>/g, ' ').trim();
      await Version.create({
        pageId: version.pageId,
        bookId: version.bookId,
        authorId: req.user._id,
        content: currentPage.content,
        label: `Auto-backup before restore`,
        wordCount: text ? text.split(/\s+/).length : 0,
        versionNumber: count + 1,
        isAutoSave: true,
      });
      currentPage.content = version.content;
      await currentPage.save();
    }

    res.json({ success: true, content: version.content, message: 'Version restored' });
  } catch (err) { next(err); }
};

// DELETE /api/versions/:id
exports.deleteVersion = async (req, res, next) => {
  try {
    await Version.findOneAndDelete({ _id: req.params.id, authorId: req.user._id });
    res.json({ success: true, message: 'Version deleted' });
  } catch (err) { next(err); }
};
