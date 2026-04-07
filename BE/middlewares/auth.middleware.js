const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'gearbox_secret_key_2026';

const verifyToken = (req, res, next) => {
    // --- CHẾ ĐỘ TEST (BẬT KHI LÂM MUỐN TEST NHANH) ---
    // console.log("🛡️ Middleware: Chế độ TEST - Đang bỏ qua kiểm tra Token...");
    // return next(); 

    // --- CHẾ ĐỘ BẢO MẬT THẬT (CỦA BẠN KIA) ---
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ success: false, message: "Không tìm thấy Token. Vui lòng đăng nhập!" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; 
        next(); 
    } catch (error) {
        return res.status(401).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn!" });
    }
};

module.exports = { verifyToken };