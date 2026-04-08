const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { mockUsers } = require('../utils/mockData');

const JWT_SECRET = process.env.JWT_SECRET || 'gearbox_secret_key_2026';
const SKIP_DB = process.env.SKIP_DB === 'true';

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

        console.log('📝 Login request received:', { username, password: '***' });
        console.log('🔍 SKIP_DB mode:', SKIP_DB);

        let user;

        // Mode Mock: Không dùng database
        if (SKIP_DB) {
            console.log('🔍 Tìm user trong mockUsers...');
            console.log('📋 Mock users available:', mockUsers.map(u => u.username));
            
            user = mockUsers.find(u => u.username === username);
            
            if (!user) {
                console.log('❌ User not found:', username);
                return res.status(401).json({ success: false, message: "Sai tên đăng nhập hoặc mật khẩu!" });
            }
            console.log('✅ User found:', user.username);
        } else {
            // Mode Normal: Dùng database
            user = await User.findOne({ where: { username } });
            if (!user) {
                return res.status(401).json({ success: false, message: "Sai tên đăng nhập hoặc mật khẩu!" });
            }

            // 2. So sánh mật khẩu
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: "Sai tên đăng nhập hoặc mật khẩu!" });
            }
        }

        // 3. Tạo JWT Token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role || 'user' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        const responseData = {
            success: true,
            message: "Đăng nhập thành công!",
            token: token,
            user: { id: user.id, username: user.username, role: user.role || 'user' }
        };
        
        console.log('✅ Login successful, sending response:', responseData);
        
        return res.status(200).json(responseData);
    } catch (error) {
        console.error('❌ Login error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { register, login };