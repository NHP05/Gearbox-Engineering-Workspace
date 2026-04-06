const express = require('express');
const router = express.Router();
const calcController = require('../controllers/calculation.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Các Endpoint API tương ứng với từng bước trên UI Wizard của React
router.post('/motor', verifyToken, calcController.calcMotor);
router.post('/belt', verifyToken, calcController.calcBelt);
router.post('/gear/bevel', verifyToken, calcController.calcBevelGear);
router.post('/gear/spur', verifyToken, calcController.calcSpurGear);
router.post('/shaft', verifyToken, calcController.calcShaft);

module.exports = router;