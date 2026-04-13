import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axiosClient from '../../api/axiosClient';
import WizardScaffold from './WizardScaffold';

const Step1Motor = ({ onNext }) => {
    const [inputs, setInputs] = useState({
        power: 6.5,
        speed: 1440,
        loadType: 'light_shock_2shift',
        life: 9,
        lifeUnit: 'years',
    });
    const [calculation, setCalculation] = useState({
        torque: null,
        efficiency: null,
        loadFactor: null,
        lifeFactor: null,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Auto-calculate motor when inputs change
    useEffect(() => {
        const autoCalculate = async () => {
            try {
                const response = await axiosClient.post('/motor/calculate', inputs);
                if (response.data) {
                    setCalculation({
                        torque: response.data.motor_torque_Nm?.toFixed(1),
                        efficiency: (response.data.efficiency * 100)?.toFixed(1),
                        loadFactor: response.data.load_factor_applied,
                        lifeFactor: response.data.life_factor_applied,
                    });
                }
            } catch (err) {
                console.error('Auto-calculation error:', err);
            }
        };
        autoCalculate();
    }, [inputs]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setInputs((prev) => ({
            ...prev,
            [name]: name === 'loadType' ? value : Number(value),
        }));
    };

    const handleNext = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axiosClient.post('/motor/calculate', inputs);
            // Lưu kết quả vào localStorage để step tiếp theo dùng
            localStorage.setItem('step1_result', JSON.stringify(response.data));
            localStorage.setItem('motorInputs', JSON.stringify(inputs));
            onNext();
        } catch (err) {
            const message = err?.response?.data?.message || 'Lỗi tính toán motor. Vui lòng kiểm tra lại.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <WizardScaffold activeKey="parameters">
            <div className="p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-12">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0058be] block mb-1">Step 1 of 5</span>
                                <h1 className="text-3xl font-extrabold tracking-tight text-[#191c1d]">Input Parameters</h1>
                            </div>
                            <span className="text-sm font-medium text-slate-500">20% Complete</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#edeeef] rounded-full overflow-hidden">
                            <div className="h-full w-1/5 bg-[#0058be]" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-8 space-y-6">
                            <div className="bg-white p-8 rounded-xl shadow-sm border border-[#c2c6d6]/20">
                                <form className="space-y-8">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="power" className="text-sm font-semibold text-[#191c1d]">Input Power (P)</label>
                                            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Required</span>
                                        </div>
                                        <div className="relative">
                                            <input
                                                id="power"
                                                name="power"
                                                type="number"
                                                step="0.1"
                                                value={inputs.power}
                                                onChange={handleChange}
                                                className="w-full bg-[#f8f9fa] border-none rounded-lg py-3 px-4 focus:ring-2 focus:ring-[#0058be]/30"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">kW</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 italic">Recommended range: 0.5 - 500 kW</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="speed" className="text-sm font-semibold text-[#191c1d]">Input Speed (n)</label>
                                        <div className="relative">
                                            <input
                                                id="speed"
                                                name="speed"
                                                type="number"
                                                value={inputs.speed}
                                                onChange={handleChange}
                                                className="w-full bg-[#f8f9fa] border-none rounded-lg py-3 px-4 focus:ring-2 focus:ring-[#0058be]/30"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">RPM</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-sm font-semibold text-[#191c1d]">Load Characteristic</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <label className={`relative p-4 bg-[#f8f9fa] rounded-xl border-2 cursor-pointer transition ${inputs.loadType === 'constant' ? 'border-[#0058be] bg-[#0058be]/5' : 'border-transparent'}`}>
                                                <input type="radio" name="loadType" value="constant" checked={inputs.loadType === 'constant'} onChange={handleChange} className="hidden" />
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="material-symbols-outlined text-[#0058be] text-lg">bolt</span>
                                                    <span className="text-sm font-bold">Constant</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500">K_load = 1.0</p>
                                            </label>

                                            <label className={`relative p-4 bg-[#f8f9fa] rounded-xl border-2 cursor-pointer transition ${inputs.loadType === 'light_shock_1shift' ? 'border-[#0058be] bg-[#0058be]/5' : 'border-transparent'}`}>
                                                <input type="radio" name="loadType" value="light_shock_1shift" checked={inputs.loadType === 'light_shock_1shift'} onChange={handleChange} className="hidden" />
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="material-symbols-outlined text-[#ffa500] text-lg">flash_on</span>
                                                    <span className="text-sm font-bold">Light Shock 1-Shift</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500">K_load = 1.25</p>
                                            </label>

                                            <label className={`relative p-4 bg-[#f8f9fa] rounded-xl border-2 cursor-pointer transition ${inputs.loadType === 'light_shock_2shift' ? 'border-[#0058be] bg-[#0058be]/5' : 'border-transparent'}`}>
                                                <input type="radio" name="loadType" value="light_shock_2shift" checked={inputs.loadType === 'light_shock_2shift'} onChange={handleChange} className="hidden" />
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="material-symbols-outlined text-[#ff6b6b] text-lg">warning</span>
                                                    <span className="text-sm font-bold">Light Shock 2-Shift ⭐</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500">K_load = 1.5 (Thesis)</p>
                                            </label>

                                            <label className={`relative p-4 bg-[#f8f9fa] rounded-xl border-2 cursor-pointer transition ${inputs.loadType === 'heavy_shock' ? 'border-[#0058be] bg-[#0058be]/5' : 'border-transparent'}`}>
                                                <input type="radio" name="loadType" value="heavy_shock" checked={inputs.loadType === 'heavy_shock'} onChange={handleChange} className="hidden" />
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="material-symbols-outlined text-red-600 text-lg">dangerous</span>
                                                    <span className="text-sm font-bold">Heavy Shock</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500">K_load = 2.0</p>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="life" className="text-sm font-semibold text-[#191c1d]">Design Lifetime (L)</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="range"
                                                min={inputs.lifeUnit === 'years' ? 1 : 1000}
                                                max={inputs.lifeUnit === 'years' ? 30 : 50000}
                                                step={inputs.lifeUnit === 'years' ? 1 : 1000}
                                                name="life"
                                                value={inputs.life}
                                                onChange={handleChange}
                                                className="flex-1 accent-[#0058be]"
                                            />
                                            <div className="flex gap-2">
                                                <div className="w-24 relative">
                                                    <input
                                                        id="life"
                                                        name="life"
                                                        type="number"
                                                        value={inputs.life}
                                                        onChange={handleChange}
                                                        className="w-full bg-[#f8f9fa] border-none rounded-lg py-2 px-3 text-sm font-bold"
                                                    />
                                                </div>
                                                <select
                                                    name="lifeUnit"
                                                    value={inputs.lifeUnit}
                                                    onChange={handleChange}
                                                    className="bg-[#f8f9fa] border-none rounded-lg py-2 px-3 text-sm font-bold text-slate-600"
                                                >
                                                    <option value="years">YEARS</option>
                                                    <option value="hours">HOURS</option>
                                                </select>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-slate-500 italic">
                                            {inputs.lifeUnit === 'years' 
                                                ? 'Design life for the system (1-30 years)' 
                                                : 'Design life in operating hours (1000-50000 hrs)'}
                                        </p>
                                    </div>

                                    <div className="pt-6 flex items-center justify-between border-t border-[#c2c6d6]/20">
                                        <button type="button" className="text-sm font-bold text-slate-400 hover:text-[#191c1d]">Save Draft</button>
                                        <button 
                                            type="button" 
                                            onClick={handleNext}
                                            disabled={loading}
                                            className="gradient-button text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#0058be]/20 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? 'Đang tính toán...' : 'Next Configuration'}
                                        </button>
                                    </div>
                                    {error && <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg">{error}</div>}
                                </form>
                            </div>
                        </div>

                        <div className="md:col-span-4 space-y-6">
                            <div className="bg-white rounded-xl p-6 border border-[#c2c6d6]/20">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Design Tips</h3>
                                <div className="space-y-3">
                                    <div className="p-3 bg-[#f3f4f5] rounded-lg">
                                        <p className="text-xs font-bold">Load Factor</p>
                                        <p className="text-[11px] text-slate-500 mt-1">K_load applied to all stress calculations for safety.</p>
                                    </div>
                                    <div className="p-3 bg-[#f3f4f5] rounded-lg">
                                        <p className="text-xs font-bold">Life Factor</p>
                                        <p className="text-[11px] text-slate-500 mt-1">φ_d based on service life for gear rating.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-[#0058be]/10 to-[#0058be]/5 rounded-xl p-6 border border-[#0058be]/20">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#0058be]">Calculation Preview</h3>
                                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-[#0058be]/10">
                                        <span className="text-xs font-medium text-slate-600">Motor Torque</span>
                                        <strong className="text-lg text-[#0058be]">{calculation.torque ? `${calculation.torque} Nm` : '—'}</strong>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-[#0058be]/10">
                                        <span className="text-xs font-medium text-slate-600">Efficiency</span>
                                        <strong className="text-lg text-[#0058be]">{calculation.efficiency ? `${calculation.efficiency}%` : '—'}</strong>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-orange-200">
                                        <span className="text-xs font-medium text-slate-600">Load Factor K_load</span>
                                        <strong className="text-lg text-orange-600">{calculation.loadFactor ? `${calculation.loadFactor}` : '—'}</strong>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-orange-200">
                                        <span className="text-xs font-medium text-slate-600">Life Factor φ_d</span>
                                        <strong className="text-lg text-orange-600">{calculation.lifeFactor ? `${calculation.lifeFactor}` : '—'}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </WizardScaffold>
    );
};

Step1Motor.propTypes = {
    onNext: PropTypes.func.isRequired,
};

export default Step1Motor;
