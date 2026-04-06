import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

const Step3_Final = () => {
  const navigate = useNavigate();
  
  // Gộp chung thông số đầu vào cho cả Bánh răng và Trục
  const [inputs, setInputs] = useState({ 
    torque_Nm: 140.5, // Lấy kết quả giả định từ bước 1
    uGear: 4, 
    psiBa: 0.4, 
    sigmaH: 450,
    tauAllowable: 15
  });
  
  const [results, setResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false); // Trạng thái hoàn thành toàn bộ

  const handleInputChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: Number(e.target.value) });
  };

  const handleCalculateAll = async () => {
    setIsCalculating(true);
    try {
      // Trong thực tế, bạn gọi 2 API (gear và shaft) song song bằng Promise.all
      const [gearRes, shaftRes] = await Promise.all([
        axiosClient.post('/calculate/gear', inputs),
        axiosClient.post('/calculate/shaft', inputs)
      ]);

      if (gearRes.data.success && shaftRes.data.success) {
        setResults({
          gear: gearRes.data.data,
          shaft: shaftRes.data.data
        });
        setIsCompleted(true);
      }
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Lỗi máy chủ. Vui lòng kiểm tra lại kết nối.");
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* ================= THREAD TIẾN ĐỘ (BƯỚC CUỐI) ================= */}
      <div className="flex items-center gap-3 mb-10 overflow-x-auto pb-2">
        <div onClick={() => navigate('/wizard/motor')} className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100 cursor-pointer hover:bg-green-100">
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white"><span className="material-symbols-outlined text-[14px] font-bold">check</span></div>
          <span className="text-sm font-bold text-green-700">Động cơ</span>
        </div>
        <div className="h-px bg-green-200 w-8"></div>
        
        <div onClick={() => navigate('/wizard/belt')} className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100 cursor-pointer hover:bg-green-100">
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white"><span className="material-symbols-outlined text-[14px] font-bold">check</span></div>
          <span className="text-sm font-bold text-green-700">Bộ truyền Đai</span>
        </div>
        <div className="h-px bg-green-200 w-8"></div>

        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100 shadow-[0_2px_10px_rgba(37,99,235,0.05)]">
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">3</div>
          <span className="text-sm font-bold text-blue-700">Bánh Răng & Trục</span>
        </div>
      </div>

      {/* ================= KHU VỰC CHÍNH ================= */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* CỘT TRÁI: FORM NHẬP LIỆU */}
        <div className="flex-1 bg-white p-8 rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-slate-100/50">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-slate-50 text-slate-600 rounded-lg">
              <span className="material-symbols-outlined">manufacturing</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Thông số Bánh răng & Trục</h3>
              <p className="text-xs text-slate-400 mt-0.5">Xác định khoảng cách trục và đường kính ngõng trục</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Mô-men Xoắn T (N.m)</label>
              <input type="number" name="torque_Nm" value={inputs.torque_Nm} onChange={handleInputChange} className="w-full px-4 py-3.5 bg-slate-50/50 rounded-xl border-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:bg-blue-50/30 focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-800 font-semibold transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tỉ số truyền U_br</label>
                <input type="number" name="uGear" value={inputs.uGear} onChange={handleInputChange} step="0.1" className="w-full px-4 py-3.5 bg-slate-50/50 rounded-xl border-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:bg-blue-50/30 focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-800 font-semibold transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Hệ số Rộng vành (ψba)</label>
                <input type="number" name="psiBa" value={inputs.psiBa} onChange={handleInputChange} step="0.1" className="w-full px-4 py-3.5 bg-slate-50/50 rounded-xl border-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:bg-blue-50/30 focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-800 font-semibold transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Ứng suất H [σ_H] (MPa)</label>
                <input type="number" name="sigmaH" value={inputs.sigmaH} onChange={handleInputChange} className="w-full px-4 py-3.5 bg-slate-50/50 rounded-xl border-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:bg-blue-50/30 focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-800 font-semibold transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Ứng suất Xoắn [τ] (MPa)</label>
                <input type="number" name="tauAllowable" value={inputs.tauAllowable} onChange={handleInputChange} className="w-full px-4 py-3.5 bg-slate-50/50 rounded-xl border-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:bg-blue-50/30 focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-800 font-semibold transition-all" />
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button onClick={() => navigate('/wizard/belt')} className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all">
              Quay lại
            </button>
            <button 
              onClick={handleCalculateAll} 
              disabled={isCalculating}
              className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-[0_4px_15px_rgba(37,99,235,0.2)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.3)] flex justify-center items-center gap-2 disabled:bg-slate-300 disabled:shadow-none"
            >
              {isCalculating ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">check_circle</span>}
              Chốt Phương án
            </button>
          </div>
        </div>

        {/* CỘT PHẢI: KẾT QUẢ ĐẦU RA */}
        <div className={`flex-1 flex flex-col p-8 rounded-2xl border relative overflow-hidden transition-colors duration-500 ${isCompleted ? 'bg-green-50/30 border-green-200' : 'bg-[#f1f5f9] border-slate-200/60'}`}>
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <span className="material-symbols-outlined text-[150px]">hub</span>
          </div>

          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className={`p-2.5 rounded-lg shadow-sm ${isCompleted ? 'bg-green-500 text-white' : 'bg-white text-green-600'}`}>
              <span className="material-symbols-outlined">{isCompleted ? 'task_alt' : 'analytics'}</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Thông số Cốt lõi</h3>
              <p className="text-xs text-slate-500 mt-0.5">Khoảng cách trục & Đường kính</p>
            </div>
          </div>

          {results ? (
            <div className="space-y-4 relative z-10 flex-1 flex flex-col">
              
              {/* Highlight Result - Khoảng cách trục */}
              <div className="bg-white p-5 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border-2 border-blue-100 flex justify-between items-center relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                <div>
                  <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1">Khoảng cách Trục (a_w)</p>
                  <p className="text-xs text-slate-400 font-mono">Đã làm tròn theo tiêu chuẩn</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-blue-700">{results.gear.aw_standard}</span>
                  <span className="text-sm font-bold text-blue-400 ml-1">mm</span>
                </div>
              </div>

              {/* Module */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Khuyến nghị Mô-đun (m)</p>
                  <p className="text-xs text-slate-400 font-mono">Khoảng giá trị hợp lý</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-slate-800">{results.gear.module_recommended.min} - {results.gear.module_recommended.max}</span>
                </div>
              </div>

              {/* Đường kính trục */}
              <div className="bg-white p-5 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border-2 border-green-100 flex justify-between items-center relative overflow-hidden mt-2">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                <div>
                  <p className="text-[11px] font-bold text-green-600 uppercase tracking-wider mb-1">Đ.kính Ngõng trục (sơ bộ)</p>
                  <p className="text-xs text-slate-400 font-mono">d ≥ ∛(T / 0.2[τ])</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-green-700">{results.shaft.d_standard}</span>
                  <span className="text-sm font-bold text-green-400 ml-1">mm</span>
                </div>
              </div>

              {/* CTA Hoàn thành */}
              <div className="mt-auto pt-8">
                <button 
                  onClick={() => alert('Chức năng Lưu vào Database và Xuất file Word Thuyết Minh!')} 
                  className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-[0_4px_15px_rgba(22,163,74,0.3)] flex justify-center items-center gap-2 group"
                >
                  <span className="material-symbols-outlined">save</span>
                  Lưu Đồ Án & Xuất Thuyết Minh
                </button>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 relative z-10">
              <div className="w-20 h-20 bg-slate-200/50 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl text-slate-400">precision_manufacturing</span>
              </div>
              <h4 className="text-slate-600 font-bold mb-2">Bước Tính toán Cuối cùng</h4>
              <p className="text-sm text-slate-400 max-w-[250px]">Hoàn thiện thông số bánh răng và trục để kết thúc quy trình thiết kế động học.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Step3_Final;