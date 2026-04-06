import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
const Step1_Motor = () => {
  const navigate = useNavigate();
  
  // State lưu trữ dữ liệu đầu vào và kết quả
  const [inputs, setInputs] = useState({ F: 5000, v: 1.5, etaSystem: 0.85, nCT: 60 });
  const [results, setResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleInputChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: Number(e.target.value) });
  };

  const handleCalculate = () => {
    setIsCalculating(true);
    // Mô phỏng gọi API Backend mất 0.8 giây
    setTimeout(() => {
      // Công thức: P_ct = (F * v) / 1000, P_dc = P_ct / etaSystem, T = 9550 * P_dc / nCT
      const P_ct = (inputs.F * inputs.v) / 1000;
      const P_dc = P_ct / inputs.etaSystem;
      const Torque = (9550 * P_dc) / inputs.nCT;

      setResults({
        P_ct_kW: P_ct.toFixed(2),
        P_dc_kW: P_dc.toFixed(2),
        Torque_Nm: Torque.toFixed(2)
      });
      setIsCalculating(false);
    }, 800);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* ================= THREAD TIẾN ĐỘ (PROGRESS STEPPER) ================= */}
      <div className="flex items-center gap-3 mb-10 overflow-x-auto pb-2">
        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">1</div>
          <span className="text-sm font-bold text-blue-700">Chọn Động cơ</span>
        </div>
        <div className="h-px bg-slate-200 w-8"></div>
        
        <div className="flex items-center gap-2 px-2 opacity-50">
          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold">2</div>
          <span className="text-sm font-medium text-slate-600">Bộ truyền Đai</span>
        </div>
        <div className="h-px bg-slate-200 w-8"></div>
        
        <div className="flex items-center gap-2 px-2 opacity-50">
          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold">3</div>
          <span className="text-sm font-medium text-slate-600">Bánh Răng</span>
        </div>
      </div>

      {/* ================= KHU VỰC CHÍNH (INPUT & OUTPUT) ================= */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* CỘT TRÁI: FORM NHẬP LIỆU */}
        <div className="flex-1 bg-white p-8 rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-slate-100/50">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-slate-50 text-slate-600 rounded-lg">
              <span className="material-symbols-outlined">tune</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Thông số Máy công tác</h3>
              <p className="text-xs text-slate-400 mt-0.5">Nhập số liệu từ đề bài đồ án của bạn</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Input Group 1 */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Lực vòng F (N)</label>
              <input 
                type="number" name="F" value={inputs.F} onChange={handleInputChange}
                className="w-full px-4 py-3.5 bg-slate-50/50 rounded-xl border-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:bg-blue-50/30 focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-800 font-semibold transition-all"
              />
            </div>

            {/* Input Group 2 */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Vận tốc v (m/s)</label>
              <input 
                type="number" name="v" value={inputs.v} onChange={handleInputChange} step="0.1"
                className="w-full px-4 py-3.5 bg-slate-50/50 rounded-xl border-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:bg-blue-50/30 focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-800 font-semibold transition-all"
              />
            </div>

            {/* Input Group 3 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Hiệu suất (η)</label>
                <input 
                  type="number" name="etaSystem" value={inputs.etaSystem} onChange={handleInputChange} step="0.01"
                  className="w-full px-4 py-3.5 bg-slate-50/50 rounded-xl border-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:bg-blue-50/30 focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-800 font-semibold transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tốc độ n_ct (v/p)</label>
                <input 
                  type="number" name="nCT" value={inputs.nCT} onChange={handleInputChange}
                  className="w-full px-4 py-3.5 bg-slate-50/50 rounded-xl border-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:bg-blue-50/30 focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-800 font-semibold transition-all"
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handleCalculate} 
            disabled={isCalculating}
            className="mt-8 w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-[0_4px_15px_rgba(37,99,235,0.2)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.3)] flex justify-center items-center gap-2 disabled:bg-slate-300 disabled:shadow-none"
          >
            {isCalculating ? (
              <span className="material-symbols-outlined animate-spin">refresh</span>
            ) : (
              <span className="material-symbols-outlined">memory</span>
            )}
            {isCalculating ? "Đang xử lý thuật toán..." : "Phân tích Thông số"}
          </button>
        </div>

        {/* CỘT PHẢI: KẾT QUẢ ĐẦU RA */}
        <div className="flex-1 flex flex-col bg-[#f1f5f9] p-8 rounded-2xl border border-slate-200/60 relative overflow-hidden">
          {/* Background pattern nhẹ (Tùy chọn) */}
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <span className="material-symbols-outlined text-[150px]">settings</span>
          </div>

          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="p-2.5 bg-white text-green-600 rounded-lg shadow-sm">
              <span className="material-symbols-outlined">analytics</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Kết quả Động cơ</h3>
              <p className="text-xs text-slate-500 mt-0.5">Dữ liệu tính toán lõi</p>
            </div>
          </div>

          {results ? (
            // Trạng thái đã có kết quả (Hiệu ứng Lifted Cards)
            <div className="space-y-4 relative z-10 flex-1 flex flex-col">
              
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center group hover:border-blue-200 transition-colors">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Công suất Máy công tác</p>
                  <p className="text-xs text-slate-400 font-mono">P_ct = (F × v) / 1000</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-800">{results.P_ct_kW}</span>
                  <span className="text-sm font-bold text-slate-400 ml-1">kW</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border-2 border-blue-100 flex justify-between items-center relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                <div>
                  <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1">Công suất Động cơ (Yêu cầu)</p>
                  <p className="text-xs text-slate-400 font-mono">P_dc = P_ct / η</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-blue-700">{results.P_dc_kW}</span>
                  <span className="text-sm font-bold text-blue-400 ml-1">kW</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center group hover:border-blue-200 transition-colors">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mô-men xoắn</p>
                  <p className="text-xs text-slate-400 font-mono">T = 9550 × P_dc / n_ct</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-800">{results.Torque_Nm}</span>
                  <span className="text-sm font-bold text-slate-400 ml-1">N.m</span>
                </div>
              </div>

              <div className="mt-auto pt-8">
                <button 
                  onClick={() => navigate('/wizard/belt')} // Chuyển sang route bộ truyền đai
                  className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all shadow-md flex justify-center items-center gap-2"
                >
                  Tiếp tục: Bước 2 (Bộ truyền Đai)
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>

            </div>
          ) : (
            // Trạng thái Trống (Empty State)
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 relative z-10">
              <div className="w-20 h-20 bg-slate-200/50 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl text-slate-400">bolt</span>
              </div>
              <h4 className="text-slate-600 font-bold mb-2">Chưa có dữ liệu</h4>
              <p className="text-sm text-slate-400 max-w-[250px]">Vui lòng nhập thông số máy công tác bên trái và bấm phân tích để xem kết quả chọn động cơ.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Step1_Motor;