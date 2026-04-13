const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/report', verifyToken, reportController.exportReport);

module.exports = router;
