// character.routes.js
const express = require('express');
const router = express.Router();
const c = require('../controllers/character.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);
router.post('/', c.createCharacter);
router.get('/:bookId', c.getCharacters);
router.get('/single/:id', c.getCharacter);
router.put('/:id', c.updateCharacter);
router.delete('/:id', c.deleteCharacter);

module.exports = router;
