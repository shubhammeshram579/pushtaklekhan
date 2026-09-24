const express = require('express');
const router = express.Router();
const ai = require('../controllers/ai.controller');
const { protect } = require('../middlewares/auth.middleware');
const { requireCredits } = require('../middlewares/credits.middleware');

router.use(protect);
router.post('/fix-grammar',    requireCredits('fix-grammar'),   ai.fixGrammar);
router.post('/rewrite',        requireCredits('rewrite'),     ai.rewrite);
router.post('/continue-writing',requireCredits('continue-writing'), ai.continueWriting);
router.post('/summarize',      requireCredits('summarize'),   ai.summarize);
router.post('/expand',       requireCredits('expand'),      ai.expand);
router.post('/simplify',       requireCredits('simplify'),  ai.simplify);
router.post('/tone',          requireCredits('tone'),   ai.adjustTone);
router.post('/writers-block',  requireCredits('writers-block'),   ai.writersBlock);
router.post('/custom',       requireCredits('custom'),     ai.customPrompt);
router.post('/generate-image', requireCredits('generate-image'), ai.generateImage);

module.exports = router;
