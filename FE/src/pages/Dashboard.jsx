import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-10">
      
      {/* KHỐI THỐNG KÊ (CARDS) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <span className="material-symbols-outlined">engineering</span>
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">+2 tuần này</span>
          </div>
          <h3 className="text-3xl font-bold mb-1">12</h3>
          <p className="text-sm text-slate-500">Đồ án đang thực hiện</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
          </div>
          <h3 className="text-3xl font-bold mb-1">28</h3>
          <p className="text-sm text-slate-500">Đồ án đã hoàn thành</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col justify-center items-center cursor-pointer hover:bg-slate-50 transition-colors"
             onClick={() => navigate('/wizard/motor')}>
          <div className="p-4 bg-blue-600 text-white rounded-full mb-3 shadow-md hover:shadow-lg transition-shadow">
            <span className="material-symbols-outlined text-2xl">add</span>
          </div>
          <h3 className="text-lg font-bold text-slate-700">Tạo mới Đồ án</h3>
        </div>
      </section>

      {/* DANH SÁCH DỰ ÁN GẦN ĐÂY */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">Dự án Gần đây</h3>
          <button className="text-sm text-blue-600 font-semibold hover:underline">Xem tất cả</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Card Dự án 1 */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col gap-4 group hover:shadow-md transition-all cursor-pointer">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors">Hộp Giảm Tốc Thùng Trộn #4</h4>
                <p className="text-xs text-slate-400 mt-1">Cập nhật 2 giờ trước</p>
              </div>
              <span className="material-symbols-outlined text-slate-300 hover:text-slate-600">more_vert</span>
            </div>
            
            <div className="flex gap-4 mt-2">
              <div className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg flex-1">
                <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Công suất</p>
                <p className="text-sm font-bold text-slate-700">5.5 kW</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg flex-1">
                <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Tốc độ</p>
                <p className="text-sm font-bold text-slate-700">1450 v/p</p>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <div className="h-2.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[60%] rounded-full"></div>
              </div>
              <span className="text-xs font-bold text-slate-500 w-8 text-right">60%</span>
            </div>
          </div>

          {/* Card Dự án 2 */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col gap-4 group hover:shadow-md transition-all cursor-pointer">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors">Hệ Dẫn Động Băng Tải</h4>
                <p className="text-xs text-slate-400 mt-1">Cập nhật hôm qua</p>
              </div>
              <span className="material-symbols-outlined text-slate-300 hover:text-slate-600">more_vert</span>
            </div>
            
            <div className="flex gap-4 mt-2">
              <div className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg flex-1">
                <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Công suất</p>
                <p className="text-sm font-bold text-slate-700">11.0 kW</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg flex-1">
                <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Tốc độ</p>
                <p className="text-sm font-bold text-slate-700">960 v/p</p>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <div className="h-2.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[100%] rounded-full"></div>
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