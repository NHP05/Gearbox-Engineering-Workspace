const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const JWT_SECRET = process.env.JWT_SECRET || 'gearbox_secret_key_2026'; // Nên để trong file .env

// [POST] Đăng ký tài khoản
const register = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Kiểm tra user đã tồn tại chưa
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Tên đăng nhập đã tồn tại!" });
        }

        // 2. Băm mật khẩu (Hashing)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Lưu vào Database
        const newUser = await User.create({
            username,
            password_hash: hashedPassword
        });

        return res.status(201).json({ success: true, message: "Đăng ký thành công!" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// [POST] Đăng nhập
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Tìm user trong DB
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json({ success: false, message: "Sai tên đăng nhập hoặc mật khẩu!" });
        }

        // 2. So sánh mật khẩu nhập vào với mật khẩu đã băm
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Sai tên đăng nhập hoặc mật khẩu!" });
        }

        // 3. Tạo JWT Token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role }, // Payload mang theo
            JWT_SECRET,
            { expiresIn: '24h' } // Token sống trong 24 giờ
        );

        return res.status(200).json({
            success: true,
            message: "Đăng nhập thành công!",
            token: token, // Frontend sẽ lưu token này lại
            user: { username: user.username, role: user.role }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { register, login };