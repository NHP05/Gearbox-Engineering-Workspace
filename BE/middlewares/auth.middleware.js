const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { mockUsers } = require('../utils/mockData');
const JWT_SECRET = process.env.JWT_SECRET || 'gearbox_secret_key_2026';
const SKIP_DB = process.env.SKIP_DB === 'true';

const touchUserLastSeen = async (userId) => {
    if (!userId) return;

    if (SKIP_DB) {
        const user = mockUsers.find((item) => Number(item.id) === Number(userId));
        if (user) {
            user.last_seen_at = new Date();
            user.updatedAt = new Date();
        }
        return;
    }

    try {
        await User.update(
            { last_seen_at: new Date() },
            { where: { id: Number(userId) } }
        );
    } catch (error) {
        // Ignore touch failures to avoid breaking protected routes.
    }
};

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
        touchUserLastSeen(decoded?.id);
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn!" });
    }
};

const requireAdmin = async (req, res, next) => {
    try {
        const userId = Number(req.user?.id);
        if (!Number.isFinite(userId) || userId <= 0) {
            return res.status(401).json({ success: false, message: 'Unauthorized.' });
        }

        let role = '';

        if (SKIP_DB) {
            const user = mockUsers.find((item) => Number(item.id) === userId);
            role = String(user?.role || req.user?.role || '').toUpperCase();
        } else {
            const user = await User.findByPk(userId, { attributes: ['role'] });
            role = String(user?.role || req.user?.role || '').toUpperCase();
        }

        if (role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Admin permission required.' });
        }

        req.user.role = 'ADMIN';
        return next();
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { verifyToken, requireAdmin };