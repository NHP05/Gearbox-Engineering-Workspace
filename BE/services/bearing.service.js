const Bearing = require('../models/bearing.model');
const { Op } = require('sequelize');

/**
 * Select appropriate bearing based on:
 * - Shaft diameter (bore_diameter)
 * - Required dynamic load capacity
 * - Speed/RPM
 */
const selectBearing = async (shaftDiameter, requiredLoadCapacity, operatingSpeed = 1450) => {
    try {
        // 1. Tìm ổ lăn với đường kính lỗ (bore) gần bằng đường kính trục
        // Cho phép 5% sai số trên/dưới
        const minBore = shaftDiameter * 0.95;
        const maxBore = shaftDiameter * 1.05;

        const candidates = await Bearing.findAll({
            where: {
                bore_diameter: {
                    [Op.between]: [minBore, maxBore]
                },
                dynamic_load_rating: {
                    [Op.gte]: requiredLoadCapacity // Chỉ lấy ổ lăn có khả năng chịu tải đủ
                },
                limiting_speed: {
                    [Op.gte]: operatingSpeed // Chỉ lấy ổ lăn hoạt động tốt ở tốc độ này
                }
            },
            order: [
                ['dynamic_load_rating', 'ASC'], // Ưu tiên ổ lăn nhỏ (đủ khả năng)
                ['price', 'ASC'] // Sau đó ưu tiên giá rẻ
            ],
            limit: 5 // Lấy top 5 candidates
        });

        if (candidates.length === 0) {
            throw new Error(
                `Không tìm thấy ổ lăn phù hợp với:\n` +
                `- Đường kính trục: ${shaftDiameter} mm\n` +
                `- Khả năng chịu tải cần thiết: ${requiredLoadCapacity} kN\n` +
                `- Tốc độ hoạt động: ${operatingSpeed} RPM`
            );
        }

        // 2. Chọn ổ lăn tốt nhất (đầu tiên trong danh sách)
        const selectedBearing = candidates[0];

        return {
            status: "Chọn ổ lăn thành công",
            selected_bearing: selectedBearing,
            alternative_options: candidates.slice(1), // Các tùy chọn thay thế
            selection_criteria: {
                shaft_diameter: shaftDiameter,
                required_load_capacity: requiredLoadCapacity,
                operating_speed: operatingSpeed,
                safety_margin: ((selectedBearing.dynamic_load_rating / requiredLoadCapacity - 1) * 100).toFixed(2) + '%'
            }
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Get all available bearings with filtering
 */
const getAllBearings = async (filters = {}) => {
    try {
        const whereClause = {};

        if (filters.minBoreDiameter) {
            whereClause.bore_diameter = whereClause.bore_diameter || {};
            whereClause.bore_diameter[Op.gte] = filters.minBoreDiameter;
        }

        if (filters.maxBoreDiameter) {
            whereClause.bore_diameter = whereClause.bore_diameter || {};
            whereClause.bore_diameter[Op.lte] = filters.maxBoreDiameter;
        }

        if (filters.minLoadCapacity) {
            whereClause.dynamic_load_rating = {
                [Op.gte]: filters.minLoadCapacity
            };
        }

        if (filters.bearingType) {
            whereClause.bearing_type = filters.bearingType;
        }

        const bearings = await Bearing.findAll({
            where: whereClause,
            order: [['bore_diameter', 'ASC']]
        });

        return bearings;
    } catch (error) {
        throw error;
    }
};

/**
 * Get bearing by model name
 */
const getBearingByModel = async (modelName) => {
    try {
        const bearing = await Bearing.findOne({
            where: { model_name: modelName }
        });

        if (!bearing) {
            throw new Error(`Ổ lăn model "${modelName}" không tìm thấy!`);
        }

        return bearing;
    } catch (error) {
        throw error;
    }
};

/**
 * Estimate required bearing load based on torque and shaft diameter
 * Using simplified formula: Load ≈ (Torque × Factor) / Diameter
 */
const estimateRequiredLoad = (torque, shaftDiameter, loadFactor = 1.5) => {
    try {
        // T in N·m, d in mm
        // L ≈ (T × 1000 × loadFactor) / d (in kN)
        const estimatedLoad = (torque * 1000 * loadFactor) / (shaftDiameter * 10);
        
        return {
            estimated_required_load_kN: parseFloat(estimatedLoad.toFixed(2)),
            calculation_basis: `Load = (T × 1000 × ${loadFactor}) / (d × 10)`,
            torque_Nm: torque,
            shaft_diameter_mm: shaftDiameter,
            load_factor: loadFactor
        };
    } catch (error) {
        throw error;
    }
};

module.exports = {
    selectBearing,
    getAllBearings,
    getBearingByModel,
    estimateRequiredLoad
};
