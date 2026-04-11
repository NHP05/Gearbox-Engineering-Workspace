const express = require('express');
const router = express.Router();
const variantController = require('../controllers/variant.controller');
const exportController = require('../controllers/export.controller');

// SỬA DÒNG NÀY: Dùng đúng tên 'verifyToken' mà mình đã tạo trong file middleware
const { verifyToken } = require('../middlewares/auth.middleware');

// Tuyến đường xử lý Phương án (Bắt buộc đăng nhập)
// SỬA CHỖ NÀY: Dùng 'verifyToken' thay cho 'verifyToken'
router.post('/save', verifyToken, variantController.saveVariant);
router.get('/project/:projectId', verifyToken, variantController.getvariantByProject);

// Tuyến đường Xuất báo cáo
router.get('/export/:variantId', verifyToken, exportController.exportThuyetMinh);

module.exports = router;