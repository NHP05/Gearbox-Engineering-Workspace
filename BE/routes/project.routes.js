const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Phải có Token hợp lệ mới được tạo và xem dự án
router.post('/create', verifyToken, projectController.createProject);
router.get('/my-projects', verifyToken, projectController.getMyProjects);
router.put('/:id', verifyToken, projectController.updateProject);
router.delete('/:id', verifyToken, projectController.deleteProject);

module.exports = router;