const express = require('express');
const router = express.Router();
const variantController = require('../controllers/variant.controller');
const exportController = require('../controllers/export.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Tuyến đường xử lý Phương án (Bắt buộc đăng nhập)
router.post('/save', verifyToken, variantController.saveVariant);
router.get('/project/:projectId', verifyToken, variantController.getVariantsByProject);

// Tuyến đường Xuất báo cáo [cite: 216-236]
router.get('/export/:variantId', verifyToken, exportController.exportThuyetMinh);

module.exports = router;