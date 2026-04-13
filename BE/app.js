const express = require('express');
const cors = require('cors'); // Của bạn kia (giúp kết nối Frontend)
const { Sequelize } = require('sequelize'); // Của Lâm
require('dotenv').config();

const app = express();

// ==========================================
// 1. MIDDLEWARE CHUNG
// ==========================================
// CORS config chi tiết
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Language'],
}));

app.use(express.json());

// Simple test endpoint để kiểm tra server có chạy không
app.get('/api/v1/test', (req, res) => {
    console.log('✅ Test endpoint called');
    res.json({ success: true, message: 'Backend is running' });
});

// Simple mock login endpoint - không dùng controller
app.post('/api/v1/auth/login-simple', (req, res) => {
    console.log('📝 Simple login received:', req.body);
    const { username, password } = req.body;
    
    if (username === 'admin') {
        console.log('✅ Simple login - user found');
        return res.json({
            success: true,
            message: 'Login successful',
            token: 'test-token-' + Date.now(),
            user: { id: 1, username: 'admin', role: 'admin' }
        });
    }
    
    res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// ==========================================
// 2. IMPORT TẤT CẢ ROUTES
// ==========================================
const motorRoutes = require('./routes/motor.routes');
const authRoutes = require('./routes/auth.routes');
const variantRoutes = require('./routes/variant.routes');
const calculationRoutes = require('./routes/calculation.routes');
const projectRoutes = require('./routes/project.routes');
const supportRoutes = require('./routes/support.routes');
const reportRoutes = require('./routes/report.routes');
const adminRoutes = require('./routes/admin.routes');
const notificationRoutes = require('./routes/notification.routes');
const aiRoutes = require('./routes/ai.routes');
const Project = require('./models/project.model');
const DesignVariant = require('./models/variant.model');
const { mockProjects, mockVariants } = require('./utils/mockData');

const isCompletedStatus = (status) => {
    const value = String(status || '').toLowerCase();
    return value.includes('complete') || value.includes('hoan') || value.includes('done') || value.includes('finish');
};

const buildMockStats = () => {
    const projects = mockProjects.length;
    const analyses = mockProjects.filter((item) => isCompletedStatus(item.status)).length;
    const exports = mockVariants.length;

    return {
        projects,
        analyses,
        exports,
    };
};

// ==========================================
// 3. GẮN ROUTES
// ==========================================
app.use('/api/v1/motor', motorRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/variants', variantRoutes);
app.use('/api/v1/calculate', calculationRoutes);
app.use('/api/v1/project', projectRoutes);
app.use('/api/v1/support', supportRoutes);
app.use('/api/v1/export', reportRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/notification', notificationRoutes);
app.use('/api/v1/ai', aiRoutes);

app.get('/api/v1/public/stats', async (req, res) => {
    try {
        if (process.env.SKIP_DB === 'true') {
            const stats = buildMockStats();
            return res.status(200).json({
                success: true,
                data: stats,
                fallback: true,
            });
        }

        const [projectCount, variantCount, statusRows] = await Promise.all([
            Project.count(),
            DesignVariant.count(),
            Project.findAll({
                attributes: ['status'],
                raw: true,
            }),
        ]);

        const analyses = (statusRows || []).filter((item) => isCompletedStatus(item.status)).length;

        return res.status(200).json({
            success: true,
            data: {
                projects: projectCount,
                analyses,
                exports: variantCount,
            },
        });
    } catch (error) {
        const stats = buildMockStats();
        return res.status(200).json({
            success: true,
            data: stats,
            fallback: true,
        });
    }
});

// Xử lý lỗi 404 (Của bạn kia)
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Đường dẫn API không tồn tại" });
});

// ==========================================
// 4. KẾT NỐI MYSQL & KHỞI ĐỘNG SERVER
// ==========================================
const sequelize = require('./config/database'); // File cấu hình của Lâm
const PORT = process.env.PORT || 8080;
let startedServer = null;

const startHttpServer = (onStarted) => {
    if (startedServer) {
        return startedServer;
    }

    startedServer = app.listen(PORT, () => {
        if (typeof onStarted === 'function') {
            onStarted();
        }
    });

    startedServer.on('error', (err) => {
        if (err?.code === 'EADDRINUSE') {
            console.error(`❌ Cổng ${PORT} đang bị chiếm. Hãy tắt process cũ rồi chạy lại.`);
            console.error(`💡 Gợi ý (WSL): lsof -ti:${PORT} | xargs -r kill -9`);
        } else {
            console.error('❌ Server error:', err);
        }
        process.exit(1);
    });

    return startedServer;
};

// Chế độ Mock: Khởi động server ngay mà không cần database
const SKIP_DB = process.env.SKIP_DB === 'true';

const ensureUserTableCompatibility = async () => {
    const queryInterface = sequelize.getQueryInterface();
    let columns;

    try {
        columns = await queryInterface.describeTable('users');
    } catch (error) {
        return;
    }

    const changes = [];

    if (!columns.email) {
        changes.push(queryInterface.addColumn('users', 'email', {
            type: Sequelize.STRING,
            allowNull: true,
        }));
    }

    if (!columns.password_plain) {
        changes.push(queryInterface.addColumn('users', 'password_plain', {
            type: Sequelize.TEXT,
            allowNull: true,
        }));
    }

    if (!columns.is_banned) {
        changes.push(queryInterface.addColumn('users', 'is_banned', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        }));
    }

    if (!columns.ban_reason) {
        changes.push(queryInterface.addColumn('users', 'ban_reason', {
            type: Sequelize.TEXT,
            allowNull: true,
        }));
    }

    if (!columns.banned_by) {
        changes.push(queryInterface.addColumn('users', 'banned_by', {
            type: Sequelize.INTEGER,
            allowNull: true,
        }));
    }

    if (!columns.banned_at) {
        changes.push(queryInterface.addColumn('users', 'banned_at', {
            type: Sequelize.DATE,
            allowNull: true,
        }));
    }

    if (!columns.language) {
        changes.push(queryInterface.addColumn('users', 'language', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'vi',
        }));
    }

    if (!columns.theme) {
        changes.push(queryInterface.addColumn('users', 'theme', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'light',
        }));
    }

    if (!columns.last_login_at) {
        changes.push(queryInterface.addColumn('users', 'last_login_at', {
            type: Sequelize.DATE,
            allowNull: true,
        }));
    }

    if (!columns.last_seen_at) {
        changes.push(queryInterface.addColumn('users', 'last_seen_at', {
            type: Sequelize.DATE,
            allowNull: true,
        }));
    }

    if (!columns.createdAt) {
        changes.push(queryInterface.addColumn('users', 'createdAt', {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        }));
    }

    if (!columns.updatedAt) {
        changes.push(queryInterface.addColumn('users', 'updatedAt', {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        }));
    }

    if (changes.length) {
        await Promise.all(changes);
        console.log('✅ Đã cập nhật schema tương thích cho bảng users');
    }
};

const ensureSupportTableCompatibility = async () => {
    const queryInterface = sequelize.getQueryInterface();

    try {
        const ticketColumns = await queryInterface.describeTable('support_tickets');
        const ticketChanges = [];

        if (!ticketColumns.user_edit_count) {
            ticketChanges.push(queryInterface.addColumn('support_tickets', 'user_edit_count', {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            }));
        }

        if (!ticketColumns.user_edited_at) {
            ticketChanges.push(queryInterface.addColumn('support_tickets', 'user_edited_at', {
                type: Sequelize.DATE,
                allowNull: true,
            }));
        }

        if (!ticketColumns.banned_by_admin_id) {
            ticketChanges.push(queryInterface.addColumn('support_tickets', 'banned_by_admin_id', {
                type: Sequelize.INTEGER,
                allowNull: true,
            }));
        }

        if (!ticketColumns.banned_reason) {
            ticketChanges.push(queryInterface.addColumn('support_tickets', 'banned_reason', {
                type: Sequelize.TEXT,
                allowNull: true,
            }));
        }

        if (!ticketColumns.banned_at) {
            ticketChanges.push(queryInterface.addColumn('support_tickets', 'banned_at', {
                type: Sequelize.DATE,
                allowNull: true,
            }));
        }

        if (!ticketColumns.deleted_by_admin_id) {
            ticketChanges.push(queryInterface.addColumn('support_tickets', 'deleted_by_admin_id', {
                type: Sequelize.INTEGER,
                allowNull: true,
            }));
        }

        if (!ticketColumns.deleted_by_admin_reason) {
            ticketChanges.push(queryInterface.addColumn('support_tickets', 'deleted_by_admin_reason', {
                type: Sequelize.TEXT,
                allowNull: true,
            }));
        }

        if (!ticketColumns.deleted_by_admin_at) {
            ticketChanges.push(queryInterface.addColumn('support_tickets', 'deleted_by_admin_at', {
                type: Sequelize.DATE,
                allowNull: true,
            }));
        }

        if (!ticketColumns.deleted_by_user_reason) {
            ticketChanges.push(queryInterface.addColumn('support_tickets', 'deleted_by_user_reason', {
                type: Sequelize.TEXT,
                allowNull: true,
            }));
        }

        if (!ticketColumns.deleted_by_user_at) {
            ticketChanges.push(queryInterface.addColumn('support_tickets', 'deleted_by_user_at', {
                type: Sequelize.DATE,
                allowNull: true,
            }));
        }

        if (ticketChanges.length) {
            await Promise.all(ticketChanges);
            console.log('✅ Đã cập nhật schema tương thích cho bảng support_tickets');
        }
    } catch (error) {
        // ignore when table does not exist yet; sequelize.sync will create it.
    }

    try {
        const messageColumns = await queryInterface.describeTable('support_messages');
        const messageChanges = [];

        if (!messageColumns.is_edited) {
            messageChanges.push(queryInterface.addColumn('support_messages', 'is_edited', {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            }));
        }

        if (!messageColumns.edited_count) {
            messageChanges.push(queryInterface.addColumn('support_messages', 'edited_count', {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            }));
        }

        if (!messageColumns.edited_at) {
            messageChanges.push(queryInterface.addColumn('support_messages', 'edited_at', {
                type: Sequelize.DATE,
                allowNull: true,
            }));
        }

        if (messageChanges.length) {
            await Promise.all(messageChanges);
            console.log('✅ Đã cập nhật schema tương thích cho bảng support_messages');
        }
    } catch (error) {
        // ignore when table does not exist yet; sequelize.sync will create it.
    }

    try {
        const [ticketCleanup] = await sequelize.query(`
            DELETE st
            FROM support_tickets st
            LEFT JOIN users u ON u.id = st.user_id
            WHERE st.user_id IS NULL
               OR st.user_id <= 0
               OR u.id IS NULL
        `);

        const removedTickets = Number(ticketCleanup?.affectedRows || 0);
        if (removedTickets > 0) {
            console.log(`🧹 Đã dọn ${removedTickets} support ticket mồ côi để đảm bảo khóa ngoại.`);
        }
    } catch (error) {
        // ignore when table does not exist yet; sequelize.sync will create it.
    }

    try {
        const [messageByTicketCleanup] = await sequelize.query(`
            DELETE sm
            FROM support_messages sm
            LEFT JOIN support_tickets st ON st.id = sm.ticket_id
            WHERE sm.ticket_id IS NULL
               OR sm.ticket_id <= 0
               OR st.id IS NULL
        `);

        const [messageBySenderCleanup] = await sequelize.query(`
            DELETE sm
            FROM support_messages sm
            LEFT JOIN users u ON u.id = sm.sender_user_id
            WHERE sm.sender_user_id IS NULL
               OR sm.sender_user_id <= 0
               OR u.id IS NULL
        `);

        const removedMessages = Number(messageByTicketCleanup?.affectedRows || 0) + Number(messageBySenderCleanup?.affectedRows || 0);
        if (removedMessages > 0) {
            console.log(`🧹 Đã dọn ${removedMessages} support message mồ côi để đảm bảo khóa ngoại.`);
        }
    } catch (error) {
        // ignore when table does not exist yet; sequelize.sync will create it.
    }
};

const ensureNotificationTableCompatibility = async () => {
    const queryInterface = sequelize.getQueryInterface();
    let columns;

    try {
        columns = await queryInterface.describeTable('notifications');
    } catch (error) {
        // ignore when table does not exist yet; sequelize.sync will create it.
        return;
    }

    const changes = [];

    if (!columns.is_pinned) {
        changes.push(queryInterface.addColumn('notifications', 'is_pinned', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        }));
    }

    if (!columns.pinned_at) {
        changes.push(queryInterface.addColumn('notifications', 'pinned_at', {
            type: Sequelize.DATE,
            allowNull: true,
        }));
    }

    if (changes.length) {
        await Promise.all(changes);
        console.log('✅ Đã cập nhật schema tương thích cho bảng notifications');
    }

    const [cleanupResult] = await sequelize.query(`
        DELETE n
        FROM notifications n
        LEFT JOIN users u ON u.id = n.user_id
        WHERE n.user_id IS NULL
           OR n.user_id <= 0
           OR u.id IS NULL
    `);

    const removed = Number(cleanupResult?.affectedRows || 0);
    if (removed > 0) {
        console.log(`🧹 Đã dọn ${removed} notification mồ côi để đảm bảo khóa ngoại.`);
    }
};

const ensureAdminActionLogTableCompatibility = async () => {
    const queryInterface = sequelize.getQueryInterface();
    let columns;

    try {
        columns = await queryInterface.describeTable('admin_action_logs');
    } catch (error) {
        // ignore when table does not exist yet; sequelize.sync will create it.
        return;
    }

    const changes = [];

    if (!columns.is_read) {
        changes.push(queryInterface.addColumn('admin_action_logs', 'is_read', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        }));
    }

    if (!columns.read_at) {
        changes.push(queryInterface.addColumn('admin_action_logs', 'read_at', {
            type: Sequelize.DATE,
            allowNull: true,
        }));
    }

    if (changes.length) {
        await Promise.all(changes);
        console.log('✅ Đã cập nhật schema tương thích cho bảng admin_action_logs');
    }
};

if (SKIP_DB) {
    // ✅ Chế độ Mock Data - chạy mà không cần MySQL
    startHttpServer(() => {
        console.log(`🚀 [MOCK MODE] Backend Cơ khí đang chạy tại http://localhost:${PORT}`);
        console.log(`⚠️  Cơ sở dữ liệu đã bị tắt - đang dùng Mock Data`);
        console.log(`✅ Server sẵn sàng nhận request...`);
    });
} else {
    // ✅ Chế độ Normal - kết nối MySQL
    sequelize.authenticate()
        .then(() => {
            return ensureUserTableCompatibility();
        })
        .then(() => {
            return ensureSupportTableCompatibility();
        })
        .then(() => {
            return ensureAdminActionLogTableCompatibility();
        })
        .then(() => {
            return ensureNotificationTableCompatibility();
        })
        .then(() => sequelize.sync({ alter: true }))
        .then(() => {
            console.log(`🎉 Đã kết nối thành công với MySQL Local (Database: ${process.env.DB_NAME})!`);
            startHttpServer(() => {
                console.log(`🚀 Hệ thống Backend Cơ khí đang chạy tại http://localhost:${PORT}`);
            });
        })
        .catch((err) => {
            console.error("❌ Lỗi kết nối MySQL:", err);
            console.log("💡 Mẹo: Đặt SKIP_DB=true trong .env để chạy chế độ Mock Data");
        });
}