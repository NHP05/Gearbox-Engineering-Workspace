import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const StandardsLibrary = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('gearbox_user') || '{}');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleViewStandard = (standard) => {
    alert(`📖 ${standard.title}\n\n${standard.description}\n\nPublished: ${standard.year}\nStatus: ${standard.status.toUpperCase()}\n\nChức năng xem chi tiết sẽ được phát triển thêm!`);
  };

  // Mock standards data
  const standards = [
    {
      id: 1,
      title: 'ISO 53:1998',
      category: 'gears',
      description: 'Spur involute gears - Metric module',
      status: 'published',
      year: 2023
    },
    {
      id: 2,
      title: 'DIN 867',
      category: 'gears',
      description: 'Modules for gears',
      status: 'active',
      year: 2023
    },
    {
      id: 3,
      title: 'ISO 6336-1:2006',
      category: 'gears',
      description: 'Calculation of load capacity of spur and helical gears',
      status: 'published',
      year: 2022
    },
    {
      id: 4,
      title: 'ISO 281:2007',
      category: 'bearings',
      description: 'Rolling bearings - Dynamic load ratings and fatigue life',
      status: 'active',
      year: 2023
    },
    {
      id: 5,
      title: 'DIN 625',
      category: 'bearings',
      description: 'Rolling bearings - Radial bearings - Geometrical product specifications',
      status: 'published',
      year: 2022
    },
    {
      id: 6,
      title: 'ISO 2408:2014',
      category: 'belts',
      description: 'Narrow industrial V-belts and grooved pulleys',
      status: 'active',
      year: 2023
    },
    {
      id: 7,
      title: 'DIN 2217',
      category: 'materials',
      description: 'Steel for gears - Case hardening steels',
      status: 'published',
      year: 2022
    },
    {
      id: 8,
      title: 'ISO 4957:2018',
      category: 'materials',
      description: 'Tool steels - Classification and designation',
      status: 'active',
      year: 2023
    }
  ];

  const categories = [
    { id: 'all', name: 'All Standards', icon: 'library_books' },
    { id: 'gears', name: 'Gears', icon: 'settings_suggest' },
    { id: 'bearings', name: 'Bearings', icon: 'precision_manufacturing' },
    { id: 'belts', name: 'Belts & Pulleys', icon: 'pulley' },
    { id: 'materials', name: 'Materials', icon: 'layers' }
  ];

  const filteredStandards = standards.filter(std => {
    const matchesSearch = std.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         std.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || std.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
          <Link to="/my-projects" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
            <span className="material-symbols-outlined text-xl">folder</span>
            Dự án của tôi
          </Link>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 text-blue-700 font-semibold transition-colors">
            <span className="material-symbols-outlined text-xl">library_books</span>
            Thư viện Tiêu chuẩn
          </a>
        </nav>

        <div className="mt-auto">
          <button 
            onClick={() => navigate('/wizard')}
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
            <h2 className="text-2xl font-bold tracking-tight">Thư viện Tiêu chuẩn</h2>
            <p className="text-sm text-slate-500 mt-1">Tra cứu các tiêu chuẩn kỹ thuật quốc tế cho thiết kế</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold text-[#191c1d]">{user.username || 'khách'}</p>
              <p className="text-xs text-slate-500">Kỹ sư</p>
            </div>
            <Link to="/user-profile" className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow">
              <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix" alt="User" className="w-full h-full object-cover" />
            </Link>
          </div>
        </header>

        {/* SEARCH & FILTER */}
        <div className="px-8 py-6 bg-white border-b border-slate-200 space-y-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input 
                type="text" 
                placeholder="Tìm kiếm tiêu chuẩn (ISO, DIN, ...)..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
              />
            </div>
            <button className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700">
              <span className="material-symbols-outlined">tune</span>
            </button>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-base">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* STANDARDS LIST */}
        <div className="px-8 py-8 flex-1">
          {filteredStandards.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-6xl text-slate-300 opacity-50 block mb-4">library_books</span>
              <p className="text-slate-500 text-lg">Không tìm thấy tiêu chuẩn nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStandards.map(std => (
                <div
                  key={std.id}
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer border border-slate-100 hover:border-blue-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-slate-900">{std.title}</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      std.status === 'published' 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {std.status === 'published' ? 'Published' : 'Active'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-slate-600 mb-4">{std.description}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="text-xs text-slate-400">
                      Published: {std.year}
                    </div>
                    <button onClick={() => handleViewStandard(std)} className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1">
                      View <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
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

export default StandardsLibrary;
