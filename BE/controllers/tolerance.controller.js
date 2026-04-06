const toleranceService = require('../services/tolerance.service');

const fetchTolerances = async (req, res) => {
    try {
        // Ví dụ URL: GET /api/v1/tolerances?type=gear_shaft
        const { type } = req.query; 

        if (!type) {
            return res.status(400).json({ success: false, message: "Thiếu tham số connection_type (type)" });
        }

        const data = await toleranceService.getRecommendedFits(type);
        
        return res.status(200).json({
            success: true,
            message: "Tra cứu dung sai tiêu chuẩn thành công",
            data: data
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { fetchTolerances };