const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'gearbox_secret_key_2026';

const verifyToken = (req, res, next) => {
    // Lấy token từ header Authorization (Định dạng: Bearer <token>)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ success: false, message: "Không tìm thấy Token. Vui lòng đăng nhập!" });
    }

    try {
        // Giải mã token
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Gắn thông tin user vào request để dùng ở các controller tiếp theo
        next(); // Cho phép đi tiếp vào API
    } catch (error) {
        return res.status(401).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn!" });
    }
};

module.exports = { verifyToken };