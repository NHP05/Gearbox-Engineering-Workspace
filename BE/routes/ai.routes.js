const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/generate-draft', verifyToken, aiController.generateDraft);
router.post('/review-step', verifyToken, aiController.reviewStepInput);

module.exports = router;
