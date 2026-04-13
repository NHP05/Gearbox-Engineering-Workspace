// Mock Data cho chế độ test (không cần database)
const mockUsers = [
    {
        id: 1,
        username: 'admin',
        email: 'admin@gearbox.local',
        role: 'ADMIN',
        is_banned: false,
        ban_reason: null,
        banned_by: null,
        banned_at: null,
        language: 'vi',
        theme: 'light',
        last_login_at: new Date('2026-04-01T08:00:00Z'),
        last_seen_at: new Date('2026-04-01T08:10:00Z'),
        createdAt: new Date('2026-03-01T08:00:00Z'),
        updatedAt: new Date('2026-04-01T08:10:00Z'),
        password_hash: '$2b$10$dqy6pTZjSz4dzSwW13HU7eFpHHGFGVfHSHfNkPGzXXoCXu3vziGh2',
        password_plain: 'test'
    },
    {
        id: 2,
        username: 'engineer1',
        email: 'engineer1@gearbox.local',
        role: 'USER',
        is_banned: false,
        ban_reason: null,
        banned_by: null,
        banned_at: null,
        language: 'vi',
        theme: 'light',
        last_login_at: new Date('2026-04-01T09:00:00Z'),
        last_seen_at: new Date('2026-04-01T09:05:00Z'),
        createdAt: new Date('2026-03-10T08:00:00Z'),
        updatedAt: new Date('2026-04-01T09:05:00Z'),
        password_hash: '$2b$10$dqy6pTZjSz4dzSwW13HU7eFpHHGFGVfHSHfNkPGzXXoCXu3vziGh2',
        password_plain: 'test'
    }
];

const mockProjects = [
    { 
        id: 1, 
        user_id: 1, 
        project_name: 'Hệ thống truyền động Nhà máy A', 
        power_P: 15, 
        speed_n: 1500, 
        lifetime_L: 10000, 
        load_type: 'normal',
        createdAt: new Date('2026-04-01'),
        updatedAt: new Date('2026-04-01')
    },
    { 
        id: 2, 
        user_id: 2, 
        project_name: 'Thiết kế bánh răng công nghiệp', 
        power_P: 22, 
        speed_n: 1200, 
        lifetime_L: 15000, 
        load_type: 'heavy',
        createdAt: new Date('2026-03-28'),
        updatedAt: new Date('2026-03-28')
    }
];

const mockVariants = [
    { 
        id: 1, 
        project_id: 1, 
        variant_name: 'Biến thể 1',
        calculated_data: { motor: 'Y90L-4', power: 2.2 }
    }
];

const mockNotifications = [
    {
        id: 1,
        user_id: 2,
        type: 'WELCOME',
        title: 'Welcome',
        message: 'Your account is ready. Start your first gearbox project.',
        metadata: null,
        is_read: false,
        is_pinned: false,
        pinned_at: null,
        createdAt: new Date('2026-04-01T08:00:00Z'),
        updatedAt: new Date('2026-04-01T08:00:00Z'),
    },
];

const mockAdminActionLogs = [];
const mockDeletedAccounts = [];
const mockSupportTickets = [];
const mockSupportMessages = [];

const mockMotors = [
    { id: 1, name: 'Y90L-4 (2.2kW)', efficiency: 0.88, cost: 15000000 },
    { id: 2, name: 'Y100L1-4 (3.0kW)', efficiency: 0.89, cost: 18000000 },
    { id: 3, name: 'Y132S-4 (7.5kW)', efficiency: 0.91, cost: 35000000 },
    { id: 4, name: 'Y160M-4 (15kW)', efficiency: 0.925, cost: 65000000 }
];

const mockBearings = [
    { id: 1, name: '6200-2RS', load_capacity: 500, cost: 50000 },
    { id: 2, name: '6201-2RS', load_capacity: 640, cost: 60000 },
    { id: 3, name: '6202-2RS', load_capacity: 820, cost: 75000 },
    { id: 4, name: '6203-2RS', load_capacity: 1020, cost: 90000 }
];

module.exports = {
    mockUsers,
    mockProjects,
    mockVariants,
    mockNotifications,
    mockAdminActionLogs,
    mockDeletedAccounts,
    mockSupportTickets,
    mockSupportMessages,
    mockMotors,
    mockBearings
};
