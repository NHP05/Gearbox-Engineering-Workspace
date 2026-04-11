import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import WizardScaffold from './WizardScaffold';

const Step1Motor = ({ onNext }) => {
    const [inputs, setInputs] = useState({
        power: 15.5,
        speed: 1450,
        loadType: 'constant',
        life: 20000,
    });

    // Load from localStorage on mount
    useEffect(() => {
        const draftData = JSON.parse(localStorage.getItem('gearbox_draft') || '{}');
        if (draftData.power || draftData.speed) {
            setInputs({
                power: draftData.power ?? 15.5,
                speed: draftData.speed ?? 1450,
                loadType: draftData.loadType ?? 'constant',
                life: draftData.life ?? 20000,
            });
        }
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;
        const newInputs = {
            ...inputs,
            [name]: name === 'loadType' ? value : Number(value),
        };
        setInputs(newInputs);
        
        // Save to localStorage
        const draftData = JSON.parse(localStorage.getItem('gearbox_draft') || '{}');
        draftData.power = newInputs.power;
        draftData.speed = newInputs.speed;
        draftData.loadType = newInputs.loadType;
        draftData.life = newInputs.life;
        localStorage.setItem('gearbox_draft', JSON.stringify(draftData));
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
                                            <label className={`relative p-4 bg-[#f8f9fa] rounded-xl border-2 cursor-pointer ${inputs.loadType === 'constant' ? 'border-[#0058be]' : 'border-transparent'}`}>
                                                <input type="radio" name="loadType" value="constant" checked={inputs.loadType === 'constant'} onChange={handleChange} className="hidden" />
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="material-symbols-outlined text-[#0058be]">bolt</span>
                                                    <span className="text-sm font-bold">Constant</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500">Uniform torque with minimal variations. Ideal for fans or pumps.</p>
                                            </label>

                                            <label className={`relative p-4 bg-[#f8f9fa] rounded-xl border-2 cursor-pointer ${inputs.loadType === 'fluctuating' ? 'border-[#0058be]' : 'border-transparent'}`}>
                                                <input type="radio" name="loadType" value="fluctuating" checked={inputs.loadType === 'fluctuating'} onChange={handleChange} className="hidden" />
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="material-symbols-outlined text-slate-400">waves</span>
                                                    <span className="text-sm font-bold">Fluctuating</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500">Variable torque with shocks. Suitable for crushers or excavators.</p>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="life" className="text-sm font-semibold text-[#191c1d]">Design Lifetime (L)</label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="range"
                                                min="1000"
                                                max="50000"
                                                step="1000"
                                                name="life"
                                                value={inputs.life}
                                                onChange={handleChange}
                                                className="flex-1 accent-[#0058be]"
                                            />
                                            <div className="w-32 relative">
                                                <input
                                                    id="life"
                                                    name="life"
                                                    type="number"
                                                    value={inputs.life}
                                                    onChange={handleChange}
                                                    className="w-full bg-[#f8f9fa] border-none rounded-lg py-2 px-3 text-sm font-bold"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">HRS</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 flex items-center justify-between border-t border-[#c2c6d6]/20">
                                        <button type="button" className="text-sm font-bold text-slate-400 hover:text-[#191c1d]">Save Draft</button>
                                        <button type="button" onClick={onNext} className="gradient-button text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#0058be]/20 flex items-center gap-3">
                                            Next Configuration
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div className="md:col-span-4 space-y-6">
                            <div className="bg-white rounded-xl p-6 border border-[#c2c6d6]/20">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Design Tips</h3>
                                <div className="space-y-3">
                                    <div className="p-3 bg-[#f3f4f5] rounded-lg">
                                        <p className="text-xs font-bold">Efficiency Ratio</p>
                                        <p className="text-[11px] text-slate-500 mt-1">Use synthetic lubrication for speed above 3000 RPM.</p>
                                    </div>
                                    <div className="p-3 bg-[#f3f4f5] rounded-lg">
                                        <p className="text-xs font-bold">Standard Compliance</p>
                                        <p className="text-[11px] text-slate-500 mt-1">Calculated using AGMA 2001-D04 assumptions.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-6 border border-[#c2c6d6]/20">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">calculate Preview</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between"><span>Torque Est.</span><strong>102.1 Nm</strong></div>
                                    <div className="flex justify-between"><span>Service Factor</span><strong>1.25</strong></div>
                                    <div className="flex justify-between"><span>Estimated Module</span><strong>2.5 m</strong></div>
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
