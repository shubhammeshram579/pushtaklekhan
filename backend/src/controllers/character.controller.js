const Character = require('../models/Character');
const Book = require('../models/Book');

const verifyBookAccess = async (bookId, userId) => {
  return Book.findOne({ _id: bookId, authorId: userId });
};

// POST /api/characters
exports.createCharacter = async (req, res, next) => {
  try {
    const { bookId, name, role, personality, appearance, backstory, goals, relationships, tags, notes } = req.body;
    const book = await verifyBookAccess(bookId, req.user._id);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

    const character = await Character.create({
      bookId, authorId: req.user._id,
      name, role, personality, appearance,
      backstory, goals, relationships, tags, notes,
    });
    res.status(201).json({ success: true, character });
  } catch (err) { next(err); }
};

// GET /api/characters/:bookId
exports.getCharacters = async (req, res, next) => {
  try {
    const book = await verifyBookAccess(req.params.bookId, req.user._id);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

    const characters = await Character.find({ bookId: req.params.bookId }).sort({ role: 1, name: 1 });
    res.json({ success: true, characters });
  } catch (err) { next(err); }
};

// GET /api/characters/single/:id
exports.getCharacter = async (req, res, next) => {
  try {
    const character = await Character.findOne({ _id: req.params.id, authorId: req.user._id });
    if (!character) return res.status(404).json({ success: false, message: 'Character not found' });
    res.json({ success: true, character });
  } catch (err) { next(err); }
};

// PUT /api/characters/:id
exports.updateCharacter = async (req, res, next) => {
  try {
    const allowed = ['name','role','personality','appearance','backstory','goals','relationships','tags','notes','avatar'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const character = await Character.findOneAndUpdate(
      { _id: req.params.id, authorId: req.user._id },
      updates,
      { new: true, runValidators: true }
    );
    if (!character) return res.status(404).json({ success: false, message: 'Character not found' });
    res.json({ success: true, character });
  } catch (err) { next(err); }
};

// DELETE /api/characters/:id
exports.deleteCharacter = async (req, res, next) => {
  try {
    const character = await Character.findOneAndDelete({ _id: req.params.id, authorId: req.user._id });
    if (!character) return res.status(404).json({ success: false, message: 'Character not found' });
    res.json({ success: true, message: 'Character deleted' });
  } catch (err) { next(err); }
};
