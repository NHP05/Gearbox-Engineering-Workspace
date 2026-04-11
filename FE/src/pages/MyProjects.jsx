import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const MyProjects = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('gearbox_user') || '{}');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock project data with full history
  const allProjects = [
    {
      id: 1,
      name: 'Hộp Giảm Tốc Thùng Trộn #4',
      status: 'in-progress',
      power: '5.5 kW',
      rpm: '1450 v/p',
      progress: 60,
      createdDate: '2026-02-15',
      updatedDate: '2026-04-10',
      description: 'Thiết kế hộp giảm tốc cho máy trộn công nghiệp'
    },
    {
      id: 2,
      name: 'Hệ Dẫn Động Băng Tái',
      status: 'completed',
      power: '11.0 kW',
      rpm: '960 v/p',
      progress: 100,
      createdDate: '2026-01-20',
      updatedDate: '2026-04-09',
      description: 'Hệ thống dẫn động cho băng tải tái chế'
    },
    {
      id: 3,
      name: 'Động cơ Điều khiển Khí Nén',
      status: 'in-progress',
      power: '7.5 kW',
      rpm: '1200 v/p',
      progress: 45,
      createdDate: '2026-03-01',
      updatedDate: '2026-04-08',
      description: 'Thiết kế động cơ điều khiển hệ thống khí nén'
    },
    {
      id: 4,
      name: 'Giảm Tốc Trục Song Song',
      status: 'completed',
      power: '3.0 kW',
      rpm: '1800 v/p',
      progress: 100,
      createdDate: '2026-01-05',
      updatedDate: '2026-04-05',
      description: 'Giảm tốc trục song song chuẩn công nghiệp'
    }
  ];

  const filteredProjects = allProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateProject = () => {
    navigate('/wizard');
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('gearbox_user');
    navigate('/login', { replace: true });
  };

  const handleEditProject = (projectId) => {
    alert(`✏️ Chức năng chỉnh sửa dự án ${projectId} sẽ được phát triển thêm!`);
  };

  const handleProjectMenu = (projectId) => {
    alert(`📋 Menu tùy chọn cho dự án ${projectId} sẽ được phát triển thêm!`);
  };

  const getStatusBadge = (status) => {
    if (status === 'completed') {
      return <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">Hoàn thành</span>;
    }
    return <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Đang thực hiện</span>;
  };

  return (
    <div className="flex h-screen bg-[#f8f9fa] font-sans text-[#191c1d] overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 flex flex-col p-6 space-y-8 bg-[#f8f9fa]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold">G</div>
          <h1 className="text-lg font-bold tracking-tight">Gearbox Eng.</h1>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
            <span className="material-symbols-outlined text-xl">grid_view</span>
            Tổng quan
          </Link>
          <Link to="/my-projects" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 text-blue-700 font-semibold transition-colors">
            <span className="material-symbols-outlined text-xl">folder</span>
            Dự án của tôi
          </Link>
          <Link to="/standards-library" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
            <span className="material-symbols-outlined text-xl">library_books</span>
            Thư viện Tiêu chuẩn
          </Link>
        </nav>

        <div className="mt-auto">
          <button 
            onClick={handleCreateProject}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md">
            <span className="material-symbols-outlined text-xl">add</span>
            Tạo Đồ án Mới
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col bg-[#f8f9fa] overflow-y-auto">
        {/* HEADER */}
        <header className="sticky top-0 bg-white border-b border-slate-200 shadow-sm px-8 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Dự án của tôi</h2>
            <p className="text-sm text-slate-500 mt-1">Quản lý và xem lịch sử tất cả dự án của bạn</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold text-[#191c1d]">{user.username || 'khách'}</p>
              <p className="text-xs text-slate-500">Customer account</p>
            </div>
            <Link to="/user-profile" className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow">
              <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix" alt="User" className="w-full h-full object-cover" />
            </Link>
          </div>
        </header>

        {/* FILTER & SEARCH */}
        <div className="px-8 py-6 bg-white border-b border-slate-200 flex gap-4 items-center">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input 
              type="text" 
              placeholder="Tìm kiếm dự án..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2.5 rounded-xl font-medium transition-all ${filterStatus === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              Tất cả
            </button>
            <button 
              onClick={() => setFilterStatus('in-progress')}
              className={`px-4 py-2.5 rounded-xl font-medium transition-all ${filterStatus === 'in-progress' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              Đang thực hiện
            </button>
            <button 
              onClick={() => setFilterStatus('completed')}
              className={`px-4 py-2.5 rounded-xl font-medium transition-all ${filterStatus === 'completed' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              Hoàn thành
            </button>
          </div>
        </div>

        {/* PROJECTS LIST */}
        <div className="px-8 py-8">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-6xl text-slate-300 opacity-50 block mb-4">folder_open</span>
              <p className="text-slate-500 text-lg">Không tìm thấy dự án nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredProjects.map((project) => (
                <div key={project.id} className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold group-hover:text-blue-600 transition-colors">{project.name}</h3>
                        {getStatusBadge(project.status)}
                      </div>
                      <p className="text-sm text-slate-600 mb-4">{project.description}</p>
                      
                      <div className="flex gap-6 mb-4">
                        <div>
                          <p className="text-xs text-slate-400 uppercase font-semibold">Công suất</p>
                          <p className="text-sm font-bold text-slate-700">{project.power}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase font-semibold">Tốc độ</p>
                          <p className="text-sm font-bold text-slate-700">{project.rpm}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase font-semibold">Ngày tạo</p>
                          <p className="text-sm font-bold text-slate-700">{project.createdDate}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase font-semibold">Cập nhật lần cuối</p>
                          <p className="text-sm font-bold text-slate-700">{project.updatedDate}</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${project.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-slate-500">{project.progress}%</span>
                      </div>
                    </div>
                    
                    <div className="ml-6 flex items-center gap-2">
                      <button onClick={() => handleEditProject(project.id)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-slate-600">edit</span>
                      </button>
                      <button onClick={() => handleProjectMenu(project.id)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-slate-600">more_vert</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyProjects;
