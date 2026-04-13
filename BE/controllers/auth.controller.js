const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const DeletedAccount = require('../models/deleted_account.model');
const { mockUsers, mockDeletedAccounts } = require('../utils/mockData');

const JWT_SECRET = process.env.JWT_SECRET || 'gearbox_secret_key_2026';
const SKIP_DB = process.env.SKIP_DB === 'true';
const ONLINE_WINDOW_MS = 5 * 60 * 1000;
const SUPPORTED_LANGUAGES = [
    { code: 'vi', label: 'Tiếng Việt' },
    { code: 'en', label: 'English' },
];

const toRole = (value) => String(value || 'USER').toUpperCase();

const toDateOrNull = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isOnlineByLastSeen = (lastSeenAt) => {
    const parsed = toDateOrNull(lastSeenAt);
    if (!parsed) return false;
    return (Date.now() - parsed.getTime()) <= ONLINE_WINDOW_MS;
};

const findDeletedAccountByUsername = async (username) => {
    const safeUsername = String(username || '').trim();
    if (!safeUsername) return null;

    if (SKIP_DB) {
        return mockDeletedAccounts
            .filter((item) => String(item.username || '') === safeUsername)
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0] || null;
    }

    return DeletedAccount.findOne({
        where: { username: safeUsername },
        order: [['createdAt', 'DESC']],
    });
};

const normalizeUserPayload = (user) => ({
    id: user.id,
    username: user.username,
    email: user.email || '',
    role: toRole(user.role),
    is_banned: Boolean(user.is_banned),
    ban_reason: user.ban_reason || null,
    language: user.language || 'vi',
    theme: user.theme || 'light',
    last_login_at: user.last_login_at || null,
    last_seen_at: user.last_seen_at || null,
    is_online: isOnlineByLastSeen(user.last_seen_at),
});

const verifyPassword = async (plainPassword, user) => {
    if (!plainPassword) return false;

    if (user.password_hash) {
        try {
            const matched = await bcrypt.compare(plainPassword, user.password_hash);
            if (matched) return true;
        } catch (error) {
            // Ignore invalid hash format in legacy mock data.
        }
    }

    if (user.password_plain) {
        return plainPassword === user.password_plain;
    }

    return false;
};

// [POST] Đăng ký tài khoản
const register = async (req, res) => {
    try {
        const { username, password, email, language } = req.body;
        const safeLanguage = language === 'en' ? 'en' : 'vi';

        if (!username || username.length < 3) {
            return res.status(400).json({ success: false, message: 'Tên đăng nhập phải có ít nhất 3 ký tự.' });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
        }

        if (SKIP_DB) {
            const existingUser = mockUsers.find((item) => item.username === username);
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'Tên đăng nhập đã tồn tại!' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = {
                id: mockUsers.length ? Math.max(...mockUsers.map((u) => Number(u.id) || 0)) + 1 : 1,
                username,
                email: email || '',
                role: 'USER',
                is_banned: false,
                ban_reason: null,
                banned_by: null,
                banned_at: null,
                language: safeLanguage,
                theme: 'light',
                last_login_at: null,
                last_seen_at: null,
                password_hash: hashedPassword,
                password_plain: password,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockUsers.push(newUser);

            return res.status(201).json({ success: true, message: 'Đăng ký thành công!', data: normalizeUserPayload(newUser) });
        }

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
            email: email || null,
            password_hash: hashedPassword,
            password_plain: password,
            role: 'USER',
            is_banned: false,
            ban_reason: null,
            banned_by: null,
            banned_at: null,
            language: safeLanguage,
            theme: 'light',
            last_login_at: null,
            last_seen_at: null,
        });

        return res.status(201).json({ success: true, message: "Đăng ký thành công!", data: normalizeUserPayload(newUser) });
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
                const deletedRecord = await findDeletedAccountByUsername(username);
                if (deletedRecord) {
                    return res.status(403).json({
                        success: false,
                        message: `Tài khoản này đã bị xóa bởi quản trị viên.${deletedRecord.reason ? ` Lý do: ${deletedRecord.reason}` : ''}`,
                    });
                }
                console.log('❌ User not found:', username);
                return res.status(401).json({ success: false, message: "Sai tên đăng nhập hoặc mật khẩu!" });
            }

            if (user.is_banned) {
                return res.status(403).json({
                    success: false,
                    message: `Tài khoản của bạn đã bị khóa bởi quản trị viên.${user.ban_reason ? ` Lý do: ${user.ban_reason}` : ''}`,
                });
            }

            const isMatch = await verifyPassword(password, user);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: "Sai tên đăng nhập hoặc mật khẩu!" });
            }

            if (!user.password_plain) {
                user.password_plain = password;
            }
            console.log('✅ User found:', user.username);
        } else {
            // Mode Normal: Dùng database
            user = await User.findOne({ where: { username } });
            if (!user) {
                const deletedRecord = await findDeletedAccountByUsername(username);
                if (deletedRecord) {
                    return res.status(403).json({
                        success: false,
                        message: `Tài khoản này đã bị xóa bởi quản trị viên.${deletedRecord.reason ? ` Lý do: ${deletedRecord.reason}` : ''}`,
                    });
                }
                return res.status(401).json({ success: false, message: "Sai tên đăng nhập hoặc mật khẩu!" });
            }

            if (user.is_banned) {
                return res.status(403).json({
                    success: false,
                    message: `Tài khoản của bạn đã bị khóa bởi quản trị viên.${user.ban_reason ? ` Lý do: ${user.ban_reason}` : ''}`,
                });
            }

            // 2. So sánh mật khẩu
            const isMatch = await verifyPassword(password, user);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: "Sai tên đăng nhập hoặc mật khẩu!" });
            }

            if (!user.password_plain) {
                user.password_plain = password;
            }
        }

        const now = new Date();
        if (SKIP_DB) {
            user.last_login_at = now;
            user.last_seen_at = now;
            user.updatedAt = now;
        } else {
            user.last_login_at = now;
            user.last_seen_at = now;
            await user.save();
        }

        // 3. Tạo JWT Token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: toRole(user.role) },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        const responseData = {
            success: true,
            message: "Đăng nhập thành công!",
            token: token,
            user: normalizeUserPayload(user)
        };
        
        console.log('✅ Login successful, sending response:', responseData);
        
        return res.status(200).json(responseData);
    } catch (error) {
        console.error('❌ Login error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getPublicAuthOptions = async (req, res) => {
    return res.status(200).json({
        success: true,
        data: {
            default_language: 'vi',
            supported_languages: SUPPORTED_LANGUAGES,
        },
    });
};

// [GET] Lấy thông tin user hiện tại
const getMe = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Thiếu thông tin xác thực.' });
        }

        if (SKIP_DB) {
            const user = mockUsers.find((item) => Number(item.id) === Number(userId));
            if (!user) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy user.' });
            }

            return res.status(200).json({ success: true, data: normalizeUserPayload(user) });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy user.' });
        }

        return res.status(200).json({ success: true, data: normalizeUserPayload(user) });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// [PUT] Cập nhật hồ sơ user
const updateMe = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { username, email, language, theme } = req.body || {};

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Thiếu thông tin xác thực.' });
        }

        if (username && String(username).trim().length < 3) {
            return res.status(400).json({ success: false, message: 'Tên đăng nhập phải có ít nhất 3 ký tự.' });
        }

        const safeLanguage = language === 'en' ? 'en' : language === 'vi' ? 'vi' : null;
        const safeTheme = theme === 'dark' ? 'dark' : theme === 'light' ? 'light' : null;

        if (SKIP_DB) {
            const user = mockUsers.find((item) => Number(item.id) === Number(userId));
            if (!user) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy user.' });
            }

            if (username && username !== user.username) {
                const duplicated = mockUsers.find((item) => item.username === username && Number(item.id) !== Number(userId));
                if (duplicated) {
                    return res.status(400).json({ success: false, message: 'Tên đăng nhập đã tồn tại.' });
                }
                user.username = username;
            }

            if (typeof email !== 'undefined') user.email = email || '';
            if (safeLanguage) user.language = safeLanguage;
            if (safeTheme) user.theme = safeTheme;

            return res.status(200).json({ success: true, message: 'Đã cập nhật thông tin.', data: normalizeUserPayload(user) });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy user.' });
        }

        if (username && username !== user.username) {
            const duplicated = await User.findOne({ where: { username } });
            if (duplicated && Number(duplicated.id) !== Number(userId)) {
                return res.status(400).json({ success: false, message: 'Tên đăng nhập đã tồn tại.' });
            }
            user.username = username;
        }

        if (typeof email !== 'undefined') user.email = email || null;
        if (safeLanguage) user.language = safeLanguage;
        if (safeTheme) user.theme = safeTheme;

        await user.save();

        return res.status(200).json({ success: true, message: 'Đã cập nhật thông tin.', data: normalizeUserPayload(user) });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// [PUT] Đổi mật khẩu
const changePassword = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { oldPassword, newPassword } = req.body || {};

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Thiếu thông tin xác thực.' });
        }

        if (!newPassword || String(newPassword).length < 6) {
            return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
        }

        if (SKIP_DB) {
            const user = mockUsers.find((item) => Number(item.id) === Number(userId));
            if (!user) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy user.' });
            }

            const matched = await verifyPassword(oldPassword, user);
            if (!matched) {
                return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng.' });
            }

            user.password_hash = await bcrypt.hash(newPassword, 10);
            user.password_plain = newPassword;

            return res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công.' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy user.' });
        }

        const isMatch = await verifyPassword(oldPassword, user);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng.' });
        }

        user.password_hash = await bcrypt.hash(newPassword, 10);
        user.password_plain = newPassword;
        await user.save();

        return res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    register,
    login,
    getPublicAuthOptions,
    getMe,
    updateMe,
    changePassword,
};