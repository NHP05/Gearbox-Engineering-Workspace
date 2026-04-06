import React, { useState } from 'react';
// import axiosClient from '../../api/axiosClient'; // Tạm comment nếu Backend chưa bật

const Step1_Motor = () => {
    const [inputs, setInputs] = useState({ F: 5000, v: 1.5, etaSystem: 0.85, nCT: 60 });
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        setInputs({ ...inputs, [e.target.name]: Number(e.target.value) });
    };

    const handleCalculate = async () => {
        setLoading(true);
        // Mô phỏng gọi API mất 1 giây để xem hiệu ứng loading
        setTimeout(() => {
            setResults({
                P_ct_kW: 7.5,
                P_dc_kW: 8.82,
                Torque_Nm: 1404.41
            });
            setLoading(false);
        }, 1000);
    };

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h2>Bước 1: Tính toán chọn Động cơ</h2>
                <p style={{ color: 'var(--text-muted)' }}>Nhập thông số lực vòng, vận tốc và hiệu suất hệ thống để chọn động cơ.</p>
            </div>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                {/* Cột Trái: Input */}
                <div className="card" style={{ flex: '1 1 400px' }}>
                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Thông số đầu vào</h3>
                    
                    <div className="form-group">
                        <label>Lực vòng F (N):</label>
                        <input type="number" name="F" value={inputs.F} onChange={handleInputChange} />
                    </div>
                    
                    <div className="form-group">
                        <label>Vận tốc v (m/s):</label>
                        <input type="number" name="v" value={inputs.v} onChange={handleInputChange} />
                    </div>

                    <div className="form-group">
                        <label>Tốc độ n_ct (v/p):</label>
                        <input type="number" name="nCT" value={inputs.nCT} onChange={handleInputChange} />
                    </div>

                    <button className="btn-primary" onClick={handleCalculate} disabled={loading}>
                        {loading ? "⚙️ Đang xử lý..." : "Bắt đầu Tính toán"}
                    </button>
                </div>

                {/* Cột Phải: Output */}
                <div className="card" style={{ flex: '1 1 400px', background: '#fafafa' }}>
                    <h3 style={{ marginBottom: '1.5rem', color: '#10b981' }}>Kết quả đầu ra</h3>
                    
                    {results ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ padding: '1rem', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Công suất máy công tác (P_ct)</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{results.P_ct_kW} kW</p>
                            </div>
                            
                            <div style={{ padding: '1rem', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Công suất động cơ yêu cầu (P_dc)</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{results.P_dc_kW} kW</p>
                            </div>

                            <div style={{ padding: '1rem', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Mô-men xoắn (T)</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{results.Torque_Nm} N.m</p>
                            </div>

                            <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                                <button className="btn-success">Tiếp tục Bước 2 (Đai) ➔</button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af' }}>
                            <span style={{ fontSize: '3rem' }}>📊</span>
                            <p style={{ marginTop: '1rem' }}>Nhập thông số và bấm tính toán để xem kết quả.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Step1_Motor;