const Project = require('../models/project.model');
const { mockProjects } = require('../utils/mockData');

// SKIP_DB check
const SKIP_DB = process.env.SKIP_DB === 'true';

// [POST] Tạo một đồ án mới
const createProject = async (req, res) => {
    try {
        // req.user được nhét vào từ Auth Middleware
        const userId = req.user.id; 
        const { project_name, power_P, speed_n, lifetime_L, load_type } = req.body;

        if (SKIP_DB) {
            // Mock Mode: Return mock project data
            console.log('📝 Creating mock project for user:', userId);
            const mockProject = {
                id: Date.now(),
                user_id: userId,
                project_name,
                power_P,
                speed_n,
                lifetime_L,
                load_type,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            return res.status(201).json({ 
                success: true, 
                message: "Đã khởi tạo đồ án thành công!", 
                data: mockProject 
            });
        }

        const newProject = await Project.create({
            user_id: userId,
            project_name,
            power_P,
            speed_n,
            lifetime_L,
            load_type
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
            return res.status(200).json({ 
                success: true, 
                data: mockProjects 
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

module.exports = { createProject, getMyProjects };