import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('gearbox_user') || '{}');
  const [editMode, setEditMode] = useState(false);
  const [userData, setUserData] = useState({
    username: user.username || 'Kỹ sư',
    email: user.email || 'engineer@gearbox.com',
    phone: user.phone || '+84 9XXXXXXXX',
    company: user.company || 'Công ty Cổ phần Thiết kế Gearbox',
    role: user.role || 'Kỹ sư Thiết kế'
  });

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('gearbox_user');
    navigate('/login', { replace: true });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = () => {
    localStorage.setItem('gearbox_user', JSON.stringify(userData));
    setEditMode(false);
    alert('Cập nhật thông tin thành công!');
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
          <Link to="/my-projects" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
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
            onClick={() => navigate('/wizard')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md mb-3">
            <span className="material-symbols-outlined text-xl">add</span>
            Tạo Đồ án Mới
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-medium transition-all">
            <span className="material-symbols-outlined text-xl">logout</span>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col bg-[#f8f9fa] overflow-y-auto">
        {/* HEADER */}
        <header className="sticky top-0 bg-white border-b border-slate-200 shadow-sm px-8 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Thông tin hồ sơ</h2>
            <p className="text-sm text-slate-500 mt-1">Quản lý thông tin cá nhân của bạn</p>
          </div>
          <Link to="/dashboard" className="text-slate-500 hover:text-slate-700">
            <span className="material-symbols-outlined">close</span>
          </Link>
        </header>

        {/* PROFILE CONTENT */}
        <div className="px-8 py-8 max-w-2xl">
          {/* Avatar Section */}
          <div className="bg-white rounded-2xl p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] mb-6">
            <div className="flex flex-col items-center text-center">
              <img 
                src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix" 
                alt="User Avatar" 
                className="w-24 h-24 rounded-full mb-4 border-4 border-blue-100"
              />
              <h3 className="text-xl font-bold mb-1">{userData.username}</h3>
              <p className="text-sm text-slate-500 mb-4">{userData.role}</p>
              <button 
                onClick={() => alert('Tính năng thay đổi ảnh đại diện sẽ được cập nhật sớm')}
                className="text-sm text-blue-600 font-semibold hover:underline">
                Thay đổi ảnh đại diện
              </button>
            </div>
          </div>

          {/* Profile Information */}
          <div className="bg-white rounded-2xl p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-bold">Thông tin cá nhân</h4>
              <button 
                onClick={() => setEditMode(!editMode)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium text-sm">
                <span className="material-symbols-outlined text-lg">edit</span>
                {editMode ? 'Hủy' : 'Chỉnh sửa'}
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Tên đăng nhập</label>
                <input
                  type="text"
                  name="username"
                  value={userData.username}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  className={`w-full px-4 py-3 rounded-xl border ${editMode ? 'border-slate-300 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500' : 'border-slate-200 bg-slate-50'} outline-none transition-all`}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={userData.email}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  className={`w-full px-4 py-3 rounded-xl border ${editMode ? 'border-slate-300 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500' : 'border-slate-200 bg-slate-50'} outline-none transition-all`}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Số điện thoại</label>
                <input
                  type="tel"
                  name="phone"
                  value={userData.phone}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  className={`w-full px-4 py-3 rounded-xl border ${editMode ? 'border-slate-300 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500' : 'border-slate-200 bg-slate-50'} outline-none transition-all`}
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Công ty</label>
                <input
                  type="text"
                  name="company"
                  value={userData.company}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  className={`w-full px-4 py-3 rounded-xl border ${editMode ? 'border-slate-300 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500' : 'border-slate-200 bg-slate-50'} outline-none transition-all`}
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Vị trí công việc</label>
                <input
                  type="text"
                  name="role"
                  value={userData.role}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  className={`w-full px-4 py-3 rounded-xl border ${editMode ? 'border-slate-300 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500' : 'border-slate-200 bg-slate-50'} outline-none transition-all`}
                />
              </div>

              {/* Save Button */}
              {editMode && (
                <div className="pt-4 flex gap-3 justify-end">
                  <button 
                    onClick={() => {
                      setEditMode(false);
                      setUserData(JSON.parse(localStorage.getItem('gearbox_user') || '{}'));
                    }}
                    className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium transition-all">
                    Hủy
                  </button>
                  <button 
                    onClick={handleSaveProfile}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-medium transition-all shadow-sm">
                    Lưu thay đổi
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white rounded-2xl p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] mt-6">
            <h4 className="text-lg font-bold mb-6">Bảo mật</h4>
            <button className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition-all text-left flex justify-between items-center">
              <span>Đổi mật khẩu</span>
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;
