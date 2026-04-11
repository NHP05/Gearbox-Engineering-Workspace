const express = require('express');
const router = express.Router();
const motorController = require('../controllers/motor.controller');

// Khi Frontend gọi POST /api/motor/calculate, hệ thống sẽ chạy hàm trong controller
router.post('/calculate', motorController.getMotorcalculate);

module.exports = router;