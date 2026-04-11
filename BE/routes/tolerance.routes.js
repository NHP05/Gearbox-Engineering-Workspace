const express = require('express');
const router = express.Router();
const toleranceController = require('../controllers/tolerance.controller');

// API này chỉ dùng để tra cứu nên dùng GET
router.get('/', toleranceController.fetchTolerances);

module.exports = router;