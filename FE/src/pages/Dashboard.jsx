import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-12">
      
      {/* ================= HEADER TỔNG QUAAN ================= */}
      <header className="flex justify-between items-center bg-[#f8f9fa] z-10 sticky top-0 pb-4 pt-2 -mt-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Chào buổi sáng, Felix!</h2>
          <p className="text-sm text-slate-500 mt-1">Hôm nay bạn muốn thiết kế hộp giảm tốc nào?</p>
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

      {/* ================= THỐNG KÊ NHANH (CARDS GRID) ================= */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] group transition-transform hover:-translate-y-1 duration-300 cursor-pointer">
            <div className="flex justify-between items-start mb-5">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                <span className="material-symbols-outlined">engineering</span>
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1.5 rounded-lg">+2 tuần này</span>
            </div>
            <h3 className="text-3xl font-bold mb-1 group-hover:text-blue-600 transition-colors">12</h3>
            <p className="text-sm text-slate-500">Đồ án đang thực hiện</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] group transition-transform hover:-translate-y-1 duration-300 cursor-pointer">
            <div className="flex justify-between items-start mb-5">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-100 transition-colors">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-1 group-hover:text-purple-600 transition-colors">28</h3>
            <p className="text-sm text-slate-500">Đồ án đã hoàn thành</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] flex flex-col justify-center items-center cursor-pointer hover:bg-blue-50 transition-all group"
               onClick={() => navigate('/wizard/motor')}>
            <div className="p-4 bg-blue-600 text-white rounded-full mb-3 shadow-md hover:shadow-lg transition-all group-hover:scale-110">
              <span className="material-symbols-outlined text-2xl">add</span>
            </div>
            <h3 className="text-lg font-bold text-slate-700 group-hover:text-blue-700 transition-colors">Tạo Đồ án Mới</h3>
          </div>
        </div>
      </section>

      {/* ================= DANH SÁCH DỰ ÁN GẦN ĐÂY ================= */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">Dự án Gần đây</h3>
          <button className="text-sm text-blue-600 font-semibold hover:underline">Xem tất cả</button>
        </div>

        {/* Grid 2 cột cho Dự án */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Card Dự án 1 */}
          <div className="bg-white p-7 rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] flex flex-col gap-5 group hover:shadow-lg transition-all cursor-pointer">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-xl text-slate-900 group-hover:text-blue-600 transition-colors">Hộp Giảm Tốc Thùng Trộn #4</h4>
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs">schedule</span>
                  Cập nhật 2 giờ trước
                </p>
              </div>
              <span className="material-symbols-outlined text-slate-300 hover:text-slate-600">more_vert</span>
            </div>
            
            <div className="flex gap-4 mt-1">
              <div className="bg-slate-50 border border-slate-100/80 px-4 py-3 rounded-lg flex-1 group-hover:bg-slate-100/50">
                <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Công suất</p>
                <p className="text-sm font-bold text-slate-700">5.5 kW</p>
              </div>
              <div className="bg-slate-50 border border-slate-100/80 px-4 py-3 rounded-lg flex-1 group-hover:bg-slate-100/50">
                <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Tốc độ</p>
                <p className="text-sm font-bold text-slate-700">1450 v/p</p>
              </div>
            </div>

            <div className="mt-1 flex items-center gap-3">
              <div className="h-2.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[60%] rounded-full group-hover:bg-blue-600 transition-colors"></div>
              </div>
              <span className="text-xs font-bold text-slate-500 w-8 text-right">60%</span>
            </div>
          </div>

          {/* Card Dự án 2 */}
          <div className="bg-white p-7 rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] flex flex-col gap-5 group hover:shadow-lg transition-all cursor-pointer overflow-hidden relative">
            {/* Hiệu ứng bo góc xanh khi hoàn thành */}
            <div className="absolute top-0 right-0 p-2 text-green-500">
               <span className="material-symbols-outlined text-base">check_circle</span>
            </div>

            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-xl text-slate-900 group-hover:text-blue-600 transition-colors">Hệ Dẫn Động Băng Tải</h4>
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs">schedule</span>
                  Cập nhật hôm qua
                </p>
              </div>
              <span className="material-symbols-outlined text-slate-300 hover:text-slate-600">more_vert</span>
            </div>
            
            <div className="flex gap-4 mt-1">
              <div className="bg-slate-50 border border-slate-100/80 px-4 py-3 rounded-lg flex-1 group-hover:bg-slate-100/50">
                <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Công suất</p>
                <p className="text-sm font-bold text-slate-700">11.0 kW</p>
              </div>
              <div className="bg-slate-50 border border-slate-100/80 px-4 py-3 rounded-lg flex-1 group-hover:bg-slate-100/50">
                <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Tốc độ</p>
                <p className="text-sm font-bold text-slate-700">960 v/p</p>
              </div>
            </div>

            <div className="mt-1 flex items-center gap-3">
              <div className="h-2.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[100%] rounded-full group-hover:bg-green-600 transition-colors"></div>
              </div>
              <span className="text-xs font-bold text-green-600 w-8 text-right">100%</span>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};

export default Dashboard;