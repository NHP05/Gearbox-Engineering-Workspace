const bearingService = require('../services/bearing.service');

/**
 * Select bearing based on shaft diameter and load
 * POST /api/v1/bearings/select
 * Body: {
 *   shaftDiameter: number (mm),
 *   loadCapacity: number (kN),
 *   operatingSpeed: number (RPM, optional, default 1450)
 * }
 */
const selectBearing = async (req, res) => {
    try {
        const { shaftDiameter, loadCapacity, operatingSpeed } = req.body;

        // Validate inputs
        if (!shaftDiameter || shaftDiameter <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Thiếu hoặc sai giá trị shaftDiameter (phải > 0)" 
            });
        }

        if (!loadCapacity || loadCapacity <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Thiếu hoặc sai giá trị loadCapacity (phải > 0)" 
            });
        }

        const result = await bearingService.selectBearing(
            shaftDiameter, 
            loadCapacity, 
            operatingSpeed || 1450
        );

        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get all bearings with optional filters
 * GET /api/v1/bearings
 * Query params:
 * - minBoreDiameter: number
 * - maxBoreDiameter: number
 * - minLoadCapacity: number
 * - bearingType: string
 */
const getAllBearings = async (req, res) => {
    try {
        const filters = {
            minBoreDiameter: req.query.minBoreDiameter ? parseFloat(req.query.minBoreDiameter) : null,
            maxBoreDiameter: req.query.maxBoreDiameter ? parseFloat(req.query.maxBoreDiameter) : null,
            minLoadCapacity: req.query.minLoadCapacity ? parseFloat(req.query.minLoadCapacity) : null,
            bearingType: req.query.bearingType || null
        };

        // Remove null filters
        Object.keys(filters).forEach(key => filters[key] === null && delete filters[key]);

        const bearings = await bearingService.getAllBearings(filters);

        return res.status(200).json({ 
            success: true, 
            data: bearings,
            count: bearings.length 
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get bearing by model name
 * GET /api/v1/bearings/:modelName
 */
const getBearingByModel = async (req, res) => {
    try {
        const { modelName } = req.params;

        if (!modelName) {
            return res.status(400).json({ 
                success: false, 
                message: "Thiếu model name" 
            });
        }

        const bearing = await bearingService.getBearingByModel(modelName);

        return res.status(200).json({ success: true, data: bearing });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Estimate required bearing load
 * POST /api/v1/bearings/estimate-load
 * Body: {
 *   torque: number (N·m),
 *   shaftDiameter: number (mm),
 *   loadFactor: number (optional, default 1.5)
 * }
 */
const estimateLoadCapacity = async (req, res) => {
    try {
        const { torque, shaftDiameter, loadFactor } = req.body;

        if (!torque || torque <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Thiếu hoặc sai giá trị torque (phải > 0)" 
            });
        }

        if (!shaftDiameter || shaftDiameter <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Thiếu hoặc sai giá trị shaftDiameter (phải > 0)" 
            });
        }

        const result = bearingService.estimateRequiredLoad(
            torque, 
            shaftDiameter, 
            loadFactor || 1.5
        );

        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    selectBearing,
    getAllBearings,
    getBearingByModel,
    estimateLoadCapacity
};
