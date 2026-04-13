const express = require('express');
const router = express.Router();
const bearingController = require('../controllers/bearing.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Get all bearings with optional filters
router.get('/', verifyToken, bearingController.getAllBearings);

// Get bearing by model name
router.get('/:modelName', verifyToken, bearingController.getBearingByModel);

// Select bearing based on shaft diameter and load
router.post('/select', verifyToken, bearingController.selectBearing);

// Estimate required bearing load capacity
router.post('/estimate-load', verifyToken, bearingController.estimateLoadCapacity);

module.exports = router;
