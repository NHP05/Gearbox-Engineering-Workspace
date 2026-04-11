const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const JWT_SECRET = process.env.JWT_SECRET || 'gearbox_secret_key_2026';

// [POST] Đăng ký tài khoản
const register = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Validation
        if (!username || !password) {
            return res.status(400).json({ success: false, message: "Username và password không được để trống!" });
        }

        // 2. Kiểm tra user đã tồn tại chưa
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Tên đăng nhập đã tồn tại!" });
        }

        // 3. Băm mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Lưu vào Database
        const newUser = await User.create({
            username,
            password_hash: hashedPassword,
            role: 'USER'
        });

        return res.status(201).json({ 
            success: true, 
            message: "Đăng ký thành công!",
            user: { id: newUser.id, username: newUser.username, role: newUser.role }
        });
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// [POST] Đăng nhập
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Validation
        if (!username || !password) {
            return res.status(400).json({ success: false, message: "Username và password không được để trống!" });
        }

        // 2. Tìm user trong database
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json({ success: false, message: "Sai tên đăng nhập hoặc mật khẩu!" });
        }

        // 3. So sánh mật khẩu
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Sai tên đăng nhập hoặc mật khẩu!" });
        }

        // 4. Tạo JWT Token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.status(200).json({
            success: true,
            message: "Đăng nhập thành công!",
            token: token,
            user: { id: user.id, username: user.username, role: user.role }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { register, login };