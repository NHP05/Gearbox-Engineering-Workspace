const express = require('express');
const router = express.Router();
const calculationController = require('../controllers/calculation.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

/**
 * Phase 2 Update: Route to new calculation.controller which includes
 * proper load/life factor integration (K_load, φ_d)
 * 
 * FE calls: POST /api/v1/motor/calculate
 * This routes to: calculationController.calcMotor
 */
router.post('/calculate', verifyToken, calculationController.calcMotor);

module.exports = router;