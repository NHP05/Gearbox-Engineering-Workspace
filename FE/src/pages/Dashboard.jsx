import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('gearbox_user') || '{}');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axiosClient.get('/project/my-projects');
        setProjects(response.data.data || []);
      } catch (err) {
        setError('Lỗi tải danh sách dự án');
        // Mock data nếu API fail
        setProjects([
          { id: 1, name: 'Dự án Gearbox Motor 15kW', createdAt: '2026-04-01', status: 'In Progress' },
          { id: 2, name: 'Transmission System Heavy Duty', createdAt: '2026-03-28', status: 'Completed' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('gearbox_user');
    navigate('/login', { replace: true });
  };

  const handleStartWizard = (projectId = null) => {
    if (projectId) {
      localStorage.setItem('current_project', projectId);
    }
    navigate('/wizard/motor');
  };

  return (
    // Wrapper chính áp dụng màu nền Surface (#f8f9fa) và font chữ Inter
    <div className="flex h-screen bg-[#f8f9fa] font-sans text-[#191c1d] overflow-hidden">
      
      {/* SIDEBAR - Tonal Layering: Không dùng border phải, chỉ dùng màu nền hòa vào surface */}
      <aside className="w-64 flex flex-col p-6 space-y-8 bg-[#f8f9fa]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold">G</div>
          <h1 className="text-lg font-bold tracking-tight">Gearbox Eng.</h1>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          {/* Active state sử dụng primary_container background theo DESIGN.md */}
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 text-blue-700 font-semibold transition-colors">
            <span className="material-symbols-outlined text-xl">grid_view</span>
            Tổng quan
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
            <span className="material-symbols-outlined text-xl">folder</span>
            Dự án của tôi
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
            <span className="material-symbols-outlined text-xl">library_books</span>
            Thư viện Tiêu chuẩn
          </a>
        </nav>

        <div className="mt-auto">
          <button 
            onClick={() => handleStartWizard()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Tạo Đồ án Mới
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col bg-[#f8f9fa] overflow-y-auto px-8 py-6">
        
        {/* HEADER */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Chào buổi sáng, Kỹ sư!</h2>
            <p className="text-sm text-slate-500 mt-1">Hôm nay bạn muốn thiết kế hộp giảm tốc nào?</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold text-[#191c1d]">{user.username || 'khách'}</p>
              <p className="text-xs text-slate-500">Customer account</p>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input 
                type="text" 
                placeholder="Tìm kiếm dự án..." 
                className="pl-10 pr-4 py-2.5 bg-white rounded-xl border-none shadow-sm focus:ring-2 focus:ring-blue-100 outline-none text-sm w-64"
              />
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden cursor-pointer shadow-sm">
              <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix" alt="User" className="w-full h-full object-cover" />
            </div>
            <button
              onClick={handleLogout}
              className="hidden md:inline-flex px-4 py-2 rounded-xl bg-[#191c1d] text-white text-sm font-semibold hover:opacity-90"
            >
              Đăng xuất
            </button>
          </div>
        </header>

        {/* THỐNG KÊ NHANH - Các khối Card Lifted */}
        <section className="grid grid-cols-3 gap-6 mb-10">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-transform hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <span className="material-symbols-outlined">engineering</span>
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">+2 tuần này</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">12</h3>
            <p className="text-sm text-slate-500">Đồ án đang thực hiện</p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-transform hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-1">28</h3>
            <p className="text-sm text-slate-500">Đồ án đã hoàn thành</p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-transform hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <span className="material-symbols-outlined">folder_open</span>
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-1">142</h3>
            <p className="text-sm text-slate-500">Phương án thiết kế đã lưu</p>
          </div>
        </section>

        {/* DANH SÁCH DỰ ÁN GẦN ĐÂY */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Dự án Gần đây</h3>
            <button className="text-sm text-blue-600 font-medium hover:underline">Xem tất cả</button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Project Card Mẫu */}
            <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col gap-4 group hover:shadow-md transition-all cursor-pointer">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-lg group-hover:text-blue-600 transition-colors">Hộp Giảm Tốc Thùng Trộn #4</h4>
                  <p className="text-xs text-slate-400 mt-1">Cập nhật 2 giờ trước</p>
                </div>
                <span className="material-symbols-outlined text-slate-300 hover:text-slate-600">more_vert</span>
              </div>
              
              <div className="flex gap-4 mt-2">
                <div className="bg-slate-50 px-3 py-2 rounded-lg flex-1">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Công suất</p>
                  <p className="text-sm font-bold text-slate-700">5.5 kW</p>
                </div>
                <div className="bg-slate-50 px-3 py-2 rounded-lg flex-1">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Tốc độ</p>
                  <p className="text-sm font-bold text-slate-700">1450 v/p</p>
                </div>
              </div>

              {/* Progress Thread (Mô phỏng theo rule Step-by-Step Workflows) */}
              <div className="mt-2 flex items-center gap-2">
                <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[60%] rounded-full"></div>
                </div>
                <span className="text-xs font-bold text-slate-500">60%</span>
              </div>
            </div>

            {/* Project Card Mẫu 2 */}
            <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col gap-4 group hover:shadow-md transition-all cursor-pointer">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-lg group-hover:text-blue-600 transition-colors">Hệ Dẫn Động Băng Tải</h4>
                  <p className="text-xs text-slate-400 mt-1">Cập nhật hôm qua</p>
                </div>
                <span className="material-symbols-outlined text-slate-300 hover:text-slate-600">more_vert</span>
              </div>
              
              <div className="flex gap-4 mt-2">
                <div className="bg-slate-50 px-3 py-2 rounded-lg flex-1">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Công suất</p>
                  <p className="text-sm font-bold text-slate-700">11.0 kW</p>
                </div>
                <div className="bg-slate-50 px-3 py-2 rounded-lg flex-1">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Tốc độ</p>
                  <p className="text-sm font-bold text-slate-700">960 v/p</p>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[100%] rounded-full"></div>
                </div>
                <span className="text-xs font-bold text-green-600">Hoàn thành</span>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default Dashboard;