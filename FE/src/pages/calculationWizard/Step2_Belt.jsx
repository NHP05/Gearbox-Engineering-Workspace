import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Step2_Belt = () => {
  const navigate = useNavigate();
  
  // State lưu thông số đầu vào (mặc định lấy ví dụ chuẩn)
  const [inputs, setInputs] = useState({ 
    uBelt: 2.5, 
    d1: 140, 
    power: 5.5, 
    n1: 1450,
    slipXi: 0.015 // Hệ số trượt đai
  });
  const [results, setResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleInputChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: Number(e.target.value) });
  };

  const handleCalculate = () => {
    setIsCalculating(true);
    // Mô phỏng gọi API Backend mất 0.8 giây
    setTimeout(() => {
      // Công thức:
      // d2 = u * d1 * (1 - xi)
      // v = (pi * d1 * n1) / 60000
      // Ft = 1000 * P / v
      const d2 = inputs.uBelt * inputs.d1 * (1 - inputs.slipXi);
      const velocity = (Math.PI * inputs.d1 * inputs.n1) / 60000;
      const Ft = (1000 * inputs.power) / velocity;

      setResults({
        d2_mm: d2.toFixed(2),
        velocity_ms: velocity.toFixed(2),
        Ft_N: Ft.toFixed(2)
      });
      setIsCalculating(false);
    }, 800);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* ================= THREAD TIẾN ĐỘ (PROGRESS STEPPER) ================= */}
      <div className="flex items-center gap-3 mb-10 overflow-x-auto pb-2">
        {/* Bước 1: Đã hoàn thành */}
        <div 
          onClick={() => navigate('/wizard/motor')}
          className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100 cursor-pointer hover:bg-green-100 transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white shadow-sm">
            <span className="material-symbols-outlined text-[14px] font-bold">check</span>
          </div>
          <span className="text-sm font-bold text-green-700">Động cơ</span>
        </div>
        <div className="h-px bg-slate-200 w-8"></div>
        
        {/* Bước 2: Đang Active */}
        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100 shadow-[0_2px_10px_rgba(37,99,235,0.05)]">
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">2</div>
          <span className="text-sm font-bold text-blue-700">Bộ truyền Đai</span>
        </div>
        <div className="h-px bg-slate-200 w-8"></div>
        
        {/* Bước 3: Chưa tới */}
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
              <span className="material-symbols-outlined">change_circle</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Thông số Bộ truyền Đai</h3>
              <p className="text-xs text-slate-400 mt-0.5">Nhập số liệu đai thang/đai dẹt theo thiết kế</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Input Group 1 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tỉ số truyền (u_d)</label>
                <input 
                  type="number" name="uBelt" value={inputs.uBelt} onChange={handleInputChange} step="0.1"
                  className="w-full px-4 py-3.5 bg-slate-50/50 rounded-xl border-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:bg-blue-50/30 focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-800 font-semibold transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Hệ số trượt (ξ)</label>
                <input 
                  type="number" name="slipXi" value={inputs.slipXi} onChange={handleInputChange} step="0.001"
                  className="w-full px-4 py-3.5 bg-slate-50/50 rounded-xl border-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:bg-blue-50/30 focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-800 font-semibold transition-all"
                />
              </div>
            </div>

            {/* Input Group 2 */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex justify-between">
                <span>Đường kính bánh dẫn d₁ (mm)</span>
                <span className="text-blue-500 cursor-pointer hover:underline normal-case font-medium">Tra bảng tiêu chuẩn</span>
              </label>
              <input 
                type="number" name="d1" value={inputs.d1} onChange={handleInputChange}
                className="w-full px-4 py-3.5 bg-slate-50/50 rounded-xl border-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:bg-blue-50/30 focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-800 font-semibold transition-all"
              />
            </div>

            {/* Input Group 3 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Công suất P₁ (kW)</label>
                <input 
                  type="number" name="power" value={inputs.power} onChange={handleInputChange} step="0.1"
                  className="w-full px-4 py-3.5 bg-slate-50/50 rounded-xl border-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:bg-blue-50/30 focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-800 font-semibold transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tốc độ n₁ (v/p)</label>
                <input 
                  type="number" name="n1" value={inputs.n1} onChange={handleInputChange}
                  className="w-full px-4 py-3.5 bg-slate-50/50 rounded-xl border-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:bg-blue-50/30 focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-800 font-semibold transition-all"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button 
              onClick={() => navigate('/wizard/motor')} 
              className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
            >
              Quay lại
            </button>
            <button 
              onClick={handleCalculate} 
              disabled={isCalculating}
              className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-[0_4px_15px_rgba(37,99,235,0.2)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.3)] flex justify-center items-center gap-2 disabled:bg-slate-300 disabled:shadow-none"
            >
              {isCalculating ? (
                <span className="material-symbols-outlined animate-spin">refresh</span>
              ) : (
                <span className="material-symbols-outlined">memory</span>
              )}
              Tính toán Đai
            </button>
          </div>
        </div>

        {/* CỘT PHẢI: KẾT QUẢ ĐẦU RA */}
        <div className="flex-1 flex flex-col bg-[#f1f5f9] p-8 rounded-2xl border border-slate-200/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <span className="material-symbols-outlined text-[150px]">data_usage</span>
          </div>

          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="p-2.5 bg-white text-green-600 rounded-lg shadow-sm">
              <span className="material-symbols-outlined">analytics</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Kết quả Truyền động Đai</h3>
              <p className="text-xs text-slate-500 mt-0.5">Xác định kích thước bánh đai và lực vòng</p>
            </div>
          </div>

          {results ? (
            <div className="space-y-4 relative z-10 flex-1 flex flex-col">
              
              {/* Highlight Result Card */}
              <div className="bg-white p-5 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border-2 border-blue-100 flex justify-between items-center relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                <div>
                  <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1">Đường kính bánh bị dẫn</p>
                  <p className="text-xs text-slate-400 font-mono">d₂ = u_d × d₁ × (1 - ξ)</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-blue-700">{results.d2_mm}</span>
                  <span className="text-sm font-bold text-blue-400 ml-1">mm</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center group hover:border-blue-200 transition-colors">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vận tốc đai</p>
                  <p className="text-xs text-slate-400 font-mono">v = (π × d₁ × n₁) / 60000</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-800">{results.velocity_ms}</span>
                  <span className="text-sm font-bold text-slate-400 ml-1">m/s</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center group hover:border-blue-200 transition-colors">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Lực vòng trên đai</p>
                  <p className="text-xs text-slate-400 font-mono">F_t = (1000 × P) / v</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-800">{results.Ft_N}</span>
                  <span className="text-sm font-bold text-slate-400 ml-1">N</span>
                </div>
              </div>

              <div className="mt-auto pt-8">
                <button 
                  onClick={() => navigate('/wizard/gear')} 
                  className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all shadow-md flex justify-center items-center gap-2 group"
                >
                  Tiếp tục: Bước 3 (Bánh Răng)
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 relative z-10">
              <div className="w-20 h-20 bg-slate-200/50 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl text-slate-400">square_foot</span>
              </div>
              <h4 className="text-slate-600 font-bold mb-2">Chưa phân tích kích thước</h4>
              <p className="text-sm text-slate-400 max-w-[250px]">Nhập tỉ số truyền đai và đường kính sơ bộ để tính toán vận tốc và lực vòng.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Step2_Belt;