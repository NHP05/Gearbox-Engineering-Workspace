const Project = require('../models/project.model');
const User = require('../models/user.model');
const { mockProjects, mockUsers } = require('../utils/mockData');
const { createUserNotification } = require('../services/notification.service');

// SKIP_DB check
const SKIP_DB = process.env.SKIP_DB === 'true';

const toRole = (value) => String(value || 'USER').toUpperCase();
const toLanguage = (value) => (String(value || '').toLowerCase() === 'en' ? 'en' : 'vi');
const byLanguage = (language, vi, en) => (toLanguage(language) === 'en' ? en : vi);

const listAdminUsers = async () => {
    if (SKIP_DB) {
        return mockUsers
            .filter((item) => toRole(item.role) === 'ADMIN')
            .map((item) => ({
                id: Number(item.id),
                username: item.username,
                language: toLanguage(item.language),
            }));
    }

    const rows = await User.findAll({
        attributes: ['id', 'username', 'role', 'language'],
    });

    return rows
        .filter((item) => toRole(item.role) === 'ADMIN')
        .map((item) => ({
            id: Number(item.id),
            username: item.username,
            language: toLanguage(item.language),
        }));
};

const notifyAdminsOnProjectDelete = async ({ actorUserId, actorUsername, projectId, projectName }) => {
    const admins = await listAdminUsers();
    if (!admins.length) return;

    await Promise.all(admins.map((admin) => createUserNotification({
        userId: admin.id,
        type: 'PROJECT_DELETED_BY_USER',
        title: byLanguage(admin.language, 'Người dùng đã xóa đồ án', 'User project deleted'),
        message: byLanguage(
            admin.language,
            `Người dùng ${actorUsername || `#${actorUserId}`} đã xóa đồ án \"${projectName || `#${projectId}`}\".`,
            `User ${actorUsername || `#${actorUserId}`} deleted project \"${projectName || `#${projectId}`}\".`
        ),
        metadata: {
            actorUserId: Number(actorUserId) || null,
            actorUsername: actorUsername || null,
            projectId: Number(projectId) || null,
            projectName: projectName || null,
        },
    })));
};

// [POST] Tạo một đồ án mới
const createProject = async (req, res) => {
    try {
        // req.user được nhét vào từ Auth Middleware
        const userId = req.user.id; 
        const { project_name, power_P, speed_n, lifetime_L, load_type, status } = req.body;
        const normalizedName = String(project_name || '').trim();
        const normalizedStatus = String(status || '').trim().toLowerCase();
        const allowedStatus = ['draft', 'in_progress', 'completed'];

        if (!normalizedName) {
            return res.status(400).json({ success: false, message: 'Project name is required.' });
        }

        const payload = {
            project_name: normalizedName,
            power_P: Number(power_P) > 0 ? Number(power_P) : 15.5,
            speed_n: Number(speed_n) > 0 ? Number(speed_n) : 1450,
            lifetime_L: Number(lifetime_L) > 0 ? Number(lifetime_L) : 20000,
            load_type: load_type || 'constant',
            status: allowedStatus.includes(normalizedStatus) ? normalizedStatus : 'draft',
        };

        if (SKIP_DB) {
            // Mock Mode: Return mock project data
            console.log('📝 Creating mock project for user:', userId);
            const mockProject = {
                id: Date.now(),
                user_id: userId,
                ...payload,
                status: 'draft',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Lưu vào mảng mock để dashboard đọc lại được ngay trong phiên server hiện tại
            mockProjects.unshift(mockProject);

            return res.status(201).json({ 
                success: true, 
                message: "Đã khởi tạo đồ án thành công!", 
                data: mockProject 
            });
        }

        const newProject = await Project.create({
            user_id: userId,
            ...payload
        });

        return res.status(201).json({ 
            success: true, 
            message: "Đã khởi tạo đồ án thành công!", 
            data: newProject 
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// [GET] Lấy danh sách đồ án của user đang đăng nhập
const getMyProjects = async (req, res) => {
    try {
        const userId = req.user.id;

        if (SKIP_DB) {
            // Mock Mode: Return mock projects
            console.log('🔍 Fetching mock projects for user:', userId);
            const userProjects = mockProjects.filter((item) => Number(item.user_id) === Number(userId));
            return res.status(200).json({ 
                success: true, 
                data: userProjects 
            });
        }

        // Chỉ query những dự án thuộc về user này
        const projects = await Project.findAll({ 
            where: { user_id: userId },
            order: [['createdAt', 'DESC']] // Sắp xếp dự án mới nhất lên đầu
        });

        return res.status(200).json({ success: true, data: projects });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// [PUT] Cập nhật thông tin đồ án
const updateProject = async (req, res) => {
    try {
        const userId = Number(req.user.id);
        const projectIdRaw = String(req.params.id || '').trim();
        const projectId = Number(projectIdRaw);
        const { project_name, power_P, speed_n, lifetime_L, load_type, status } = req.body;

        const payload = {
            ...(project_name ? { project_name } : {}),
            ...(Number(power_P) > 0 ? { power_P: Number(power_P) } : {}),
            ...(Number(speed_n) > 0 ? { speed_n: Number(speed_n) } : {}),
            ...(Number(lifetime_L) > 0 ? { lifetime_L: Number(lifetime_L) } : {}),
            ...(load_type ? { load_type } : {}),
            ...(status ? { status } : {}),
        };

        if (SKIP_DB) {
            const idx = mockProjects.findIndex((item) => String(item.id) === projectIdRaw && Number(item.user_id) === userId);
            if (idx < 0) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy đồ án.' });
            }

            mockProjects[idx] = {
                ...mockProjects[idx],
                ...payload,
                updatedAt: new Date(),
            };

            return res.status(200).json({ success: true, message: 'Đã cập nhật đồ án.', data: mockProjects[idx] });
        }

        if (!Number.isFinite(projectId)) {
            return res.status(400).json({ success: false, message: 'ID đồ án không hợp lệ.' });
        }

        const project = await Project.findOne({
            where: {
                id: projectId,
                user_id: userId,
            },
        });

        if (!project) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đồ án.' });
        }

        await project.update(payload);
        return res.status(200).json({ success: true, message: 'Đã cập nhật đồ án.', data: project });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// [DELETE] Xóa đồ án
const deleteProject = async (req, res) => {
    try {
        const userId = Number(req.user.id);
        const actorUsername = String(req.user?.username || '').trim() || null;
        const projectIdRaw = String(req.params.id || '').trim();
        const projectId = Number(projectIdRaw);

        if (SKIP_DB) {
            const idx = mockProjects.findIndex((item) => String(item.id) === projectIdRaw && Number(item.user_id) === userId);
            if (idx < 0) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy đồ án.' });
            }

            const [removed] = mockProjects.splice(idx, 1);

            await notifyAdminsOnProjectDelete({
                actorUserId: userId,
                actorUsername,
                projectId: removed?.id,
                projectName: removed?.project_name,
            });

            return res.status(200).json({ success: true, message: 'Đã xóa đồ án.', data: removed });
        }

        if (!Number.isFinite(projectId)) {
            return res.status(400).json({ success: false, message: 'ID đồ án không hợp lệ.' });
        }

        const project = await Project.findOne({
            where: {
                id: projectId,
                user_id: userId,
            },
        });

        if (!project) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đồ án.' });
        }

        const snapshot = {
            id: project.id,
            project_name: project.project_name,
        };

        await project.destroy();

        await notifyAdminsOnProjectDelete({
            actorUserId: userId,
            actorUsername,
            projectId: snapshot.id,
            projectName: snapshot.project_name,
        });

        return res.status(200).json({ success: true, message: 'Đã xóa đồ án.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createProject,
    getMyProjects,
    updateProject,
    deleteProject,
};