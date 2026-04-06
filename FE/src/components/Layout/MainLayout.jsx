import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

const MainLayout = () => {
  const location = useLocation();

  // Hàm phụ trợ để kiểm tra menu đang active
  const isActive = (path) => location.pathname.includes(path);

  return (
    // Wrapper chính áp dụng màu nền Surface (#f8f9fa) và font chữ Inter
    <div className="flex h-screen bg-[#f8f9fa] font-sans text-[#191c1d] overflow-hidden">
      
      {/* ================= SIDEBAR ================= */}
      {/* Theo rule "No-Line", ta không dùng border-right mà để không gian mở */}
      <aside className="w-64 flex flex-col p-6 space-y-8 bg-[#f8f9fa] z-10">
        
        {/* Logo & Tên phần mềm */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
            G
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-800">Gearbox Eng.</h1>
        </div>

        {/* Menu Điều hướng */}
        <nav className="flex flex-col gap-2 flex-1">
          <Link 
            to="/dashboard" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              isActive('/dashboard') 
                ? 'bg-blue-50 text-blue-700 font-semibold shadow-[0_2px_10px_rgba(37,99,235,0.05)]' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-xl">grid_view</span>
            Tổng quan
          </Link>

          <Link 
            to="/wizard/motor" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              isActive('/wizard') 
                ? 'bg-blue-50 text-blue-700 font-semibold shadow-[0_2px_10px_rgba(37,99,235,0.05)]' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-xl">calculate</span>
            Tính toán Đồ án
          </Link>

          <a 
            href="#" 
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">library_books</span>
            Thư viện Tiêu chuẩn
          </a>
        </nav>

        {/* Nút Đăng xuất ở cuối */}
        <div className="mt-auto">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-red-600 rounded-xl font-medium transition-all shadow-sm">
            <span className="material-symbols-outlined text-xl">logout</span>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ================= KHU VỰC NỘI DUNG CHÍNH ================= */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* HEADER (Sticky) */}
        <header className="flex justify-between items-center px-8 py-6 bg-[#f8f9fa] z-10 sticky top-0">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Chào buổi sáng, Kỹ sư!</h2>
            <p className="text-sm text-slate-500 mt-1">Hôm nay bạn muốn thiết kế hệ thống truyền động nào?</p>
          </div>
          
          <div className="flex items-center gap-5">
            {/* Thanh tìm kiếm */}
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                search
              </span>
              <input 
                type="text" 
                placeholder="Tìm kiếm dự án (vd: Băng tải)..." 
                className="pl-10 pr-4 py-2.5 bg-white rounded-xl border-none shadow-[0_2px_10px_rgba(0,0,0,0.02)] focus:ring-2 focus:ring-blue-500/20 outline-none text-sm w-72 transition-all placeholder:text-slate-400 text-slate-700"
              />
            </div>
            
            {/* Avatar User */}
            <div className="w-11 h-11 rounded-full bg-slate-200 overflow-hidden cursor-pointer shadow-sm ring-2 ring-white hover:ring-blue-100 transition-all">
              <img 
                src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=e2e8f0" 
                alt="User Avatar" 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>
        </header>

        {/* VÙNG RENDER COMPONENT CON (Dashboard, Calculation Wizard, v.v.) */}
        <main className="flex-1 overflow-y-auto px-8 pb-8 scroll-smooth">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default MainLayout;