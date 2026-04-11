const Tolerance = require('../models/tolerance.model');

/**
 * Lấy danh sách dung sai đề xuất theo loại mối ghép
 * @param {string} connectionType - VD: 'gear_shaft', 'pulley_shaft', 'bearing_housing'
 */
const getRecommendedFits = async (connectionType) => {
    // Truy vấn Database lấy các dung sai phù hợp
    const fits = await Tolerance.findAll({
        where: { connection_type: connectionType },
        attributes: ['fit_character', 'hole_tolerance', 'shaft_tolerance', 'description']
    });

    if (!fits || fits.length === 0) {
        throw new Error("Không tìm thấy dữ liệu dung sai cho loại mối ghép này.");
    }

    // Format lại data cho Frontend React dễ dùng
    const formattedFits = fits.map(fit => ({
        label: `${fit.hole_tolerance}/${fit.shaft_tolerance} (${fit.fit_character})`,
        hole: fit.hole_tolerance,
        shaft: fit.shaft_tolerance,
        desc: fit.description
    }));

    return formattedFits;
};

module.exports = { getRecommendedFits };