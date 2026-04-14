import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import WizardScaffold from './WizardScaffold';

const Step3TransmissionDesign = ({ onNext, onBack }) => {
    const navigate = useNavigate();
    const [draftData, setDraftData] = useState({});
    const [bevelGearType, setBevelGearType] = useState('spiral');
    const [teethValue, setTeethValue] = useState(24);
    const [beltDrive, setBeltDrive] = useState({
        power: 15.5,
        speed: 1450,
        serviceFactor: 1.25,
        centerDistance: 450,
    });
    const pinionTeeth = Math.round(teethValue * 3); // Gear ratio 1:3

    // Load from localStorage on mount
    useEffect(() => {
        const data = JSON.parse(localStorage.getItem('gearbox_draft') || '{}');
        setDraftData(data);
        
        // Initialize belt drive with actual Step 1 values
        setBeltDrive({
            power: data.power || 15.5,
            speed: data.speed || 1450,
            serviceFactor: data.loadType === 'constant' ? 1.25 : 1.75,
            centerDistance: 450,
        });
        
        if (data.bevelGearType) {
            setBevelGearType(data.bevelGearType);
        }
        if (data.teethValue) {
            setTeethValue(data.teethValue);
        }
    }, []);

    const handleBevelTypeChange = (type) => {
        setBevelGearType(type);
        // Save to localStorage
        const draftData = JSON.parse(localStorage.getItem('gearbox_draft') || '{}');
        draftData.bevelGearType = type;
        localStorage.setItem('gearbox_draft', JSON.stringify(draftData));
    };

    const handleTeethChange = (value) => {
        setTeethValue(value);
        // Save to localStorage
        const draftData = JSON.parse(localStorage.getItem('gearbox_draft') || '{}');
        draftData.teethValue = value;
        localStorage.setItem('gearbox_draft', JSON.stringify(draftData));
    };

    const handleBeltDriveChange = (field, value) => {
        const newBeltDrive = {
            ...beltDrive,
            [field]: field === 'serviceFactor' ? parseFloat(value) : (field === 'centerDistance' ? parseInt(value) : parseFloat(value)),
        };
        setBeltDrive(newBeltDrive);
        
        // Save to localStorage
        const draftData = JSON.parse(localStorage.getItem('gearbox_draft') || '{}');
        draftData.beltDrive = newBeltDrive;
        localStorage.setItem('gearbox_draft', JSON.stringify(draftData));
    };

    const handleSaveDraft = () => {
        const draftData = JSON.parse(localStorage.getItem('gearbox_draft') || '{}');
        draftData.bevelGearType = bevelGearType;
        draftData.teethValue = teethValue;
        draftData.savedAt = new Date().toISOString();
        localStorage.setItem('gearbox_draft', JSON.stringify(draftData));
        alert('✅ Đồ án đã được lưu thành công!');
    };

    // Calculate transmission metrics from Belt Drive Parameters
    const calculateTransmissionMetrics = () => {
        const power = beltDrive.power;
        const speed = beltDrive.speed;
        const serviceFactor = beltDrive.serviceFactor;
        const torque = (power * 9550) / speed; // Torque in Nm
        const gearRatio = 3.0; // 1:3 ratio
        const outputSpeed = speed / gearRatio;
        const outputTorque = torque * gearRatio * 0.978; // 97.8% efficiency
        const pcd = (teethValue * 2.5) / Math.PI; // PCD = Z * Module / π
        const contactRatio = 1.64;
        const safetyFactor = serviceFactor * 1.456; // Base SF adjusted by service factor
        
        return {
            gearRatio: gearRatio.toFixed(2),
            outputSpeed: outputSpeed.toFixed(0),
            outputTorque: outputTorque.toFixed(1),
            pcd: pcd.toFixed(2),
            efficiency: 97.8,
            safetyFactor: safetyFactor.toFixed(2),
            contactRatio: contactRatio.toFixed(2),
            inputTorque: torque.toFixed(1),
        };
    };

    const metrics = calculateTransmissionMetrics();
    return (
        <WizardScaffold activeKey="transmission">
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 text-slate-500 hover:text-[#191c1d] font-semibold"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                            Back to Dashboard
                        </button>
                    </div>

                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <span className="text-[10px] font-black tracking-widest text-[#495e8a] uppercase block mb-1">Wizard Configuration</span>
                                <h1 className="text-2xl font-extrabold tracking-tight">Transmission System Design</h1>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-bold text-[#0058be] block">Step 03 / 05</span>
                                <span className="text-xs text-slate-500 font-medium">Core Component Geometry</span>
                            </div>
                        </div>
                        <div className="h-1.5 w-full bg-[#edeeef] rounded-full overflow-hidden">
                            <div className="h-full bg-[#0058be] w-[60%]" />
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-8">
                        <div className="col-span-12 lg:col-span-7 space-y-8">
                            <section className="bg-white p-6 rounded-xl shadow-sm border border-[#c2c6d6]/20">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-10 w-10 bg-[#0058be]/10 rounded-lg flex items-center justify-center text-[#0058be]">
                                        <span className="material-symbols-outlined">settings_input_component</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold tracking-tight">Belt Drive Parameters</h3>
                                        <p className="text-xs text-slate-500">V-Belt and Timing configurations</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2"><label htmlFor="pwr" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Input Power (kW)</label><input id="pwr" className="w-full bg-[#edeeef] border-none rounded-lg p-3 text-sm font-medium" type="number" value={beltDrive.power} onChange={(e) => handleBeltDriveChange('power', e.target.value)} /></div>
                                    <div className="space-y-2"><label htmlFor="spd" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Input Speed (RPM)</label><input id="spd" className="w-full bg-[#edeeef] border-none rounded-lg p-3 text-sm font-medium" type="number" value={beltDrive.speed} onChange={(e) => handleBeltDriveChange('speed', e.target.value)} /></div>
                                    <div className="space-y-2"><label htmlFor="svc" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Service Factor</label><select id="svc" className="w-full bg-[#edeeef] border-none rounded-lg p-3 text-sm font-medium" value={beltDrive.serviceFactor} onChange={(e) => handleBeltDriveChange('serviceFactor', e.target.value)}><option value="1.0">1.0 - Light Duty</option><option value="1.25">1.25 - Moderate Shock</option><option value="1.5">1.5 - Heavy Duty</option><option value="1.75">1.75 - Intermittent Peak</option><option value="2.0">2.0 - Severe Conditions</option></select></div>
                                    <div className="space-y-2"><label htmlFor="ctr" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Center Distance (mm)</label><input id="ctr" className="w-full bg-[#edeeef] border-none rounded-lg p-3 text-sm font-medium" type="number" value={beltDrive.centerDistance} onChange={(e) => handleBeltDriveChange('centerDistance', e.target.value)} /></div>
                                </div>
                            </section>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-[#c2c6d6]/20">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-sm flex items-center gap-2"><span className="material-symbols-outlined text-[#495e8a]">settings_suggest</span>Spur Gear Set</h3>
                                        <div className="bg-[#0058be]/5 px-2 py-0.5 rounded text-[10px] font-bold text-[#0058be]">MODULE 2.5</div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1"><span>NUMBER OF TEETH (Z)</span><span>{teethValue} / {pinionTeeth}</span></div>
                                            <input 
                                                className="w-full h-1 accent-[#0058be] cursor-pointer" 
                                                type="range" 
                                                min="16" 
                                                max="48" 
                                                value={teethValue}
                                                onChange={(e) => handleTeethChange(parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 bg-[#f8f9fa] rounded-lg"><p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Face Width</p><p className="text-sm font-bold">25.0 mm</p></div>
                                            <div className="p-3 bg-[#f8f9fa] rounded-lg"><p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Helix Angle</p><p className="text-sm font-bold">0° (Direct)</p></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-xl shadow-sm border border-[#c2c6d6]/20">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-sm flex items-center gap-2"><span className="material-symbols-outlined text-[#495e8a]">change_history</span>Bevel Gear Set</h3>
                                        <span className="bg-[#924700]/5 px-2 py-0.5 rounded text-[10px] font-bold text-[#924700]">90° ANGLE</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="p-3 bg-[#f8f9fa] rounded-lg border-l-2 border-[#0058be]">
                                            <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Mounting Dist.</p>
                                            <div className="flex items-center justify-between"><p className="text-sm font-bold">115.42 mm</p><span className="material-symbols-outlined text-xs text-slate-400">info</span></div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleBevelTypeChange('straight')}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                                    bevelGearType === 'straight' 
                                                        ? 'bg-[#0058be] text-white' 
                                                        : 'bg-[#f8f9fa] text-slate-700 border border-[#c2c6d6]/40'
                                                }`}>
                                                Straight
                                            </button>
                                            <button 
                                                onClick={() => handleBevelTypeChange('spiral')}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                                    bevelGearType === 'spiral' 
                                                        ? 'bg-[#0058be] text-white' 
                                                        : 'bg-[#f8f9fa] text-slate-700 border border-[#c2c6d6]/40'
                                                }`}>
                                                Spiral
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-12 lg:col-span-5 space-y-8">
                            <div className="p-8 rounded-2xl shadow-xl border border-white/50 bg-white/80 backdrop-blur-lg sticky top-24">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-[12px] font-extrabold uppercase">Calculated Output</h2>
                                    <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /><span className="text-[10px] font-bold text-green-600">LIVE SYNC</span></div>
                                </div>
                                <div className="space-y-6">
                                    <div className="pb-6 border-b border-[#c2c6d6]/30">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Total Gear Ratio</p>
                                        <div className="flex items-baseline gap-2"><span className="text-5xl font-black text-[#0058be]">{metrics.gearRatio}</span><span className="text-lg font-bold text-[#495e8a]">: 1</span></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-[#f3f4f5] rounded-xl"><p className="text-[9px] font-black text-slate-500 uppercase mb-1">Input Torque</p><p className="text-lg font-bold">{metrics.inputTorque} Nm</p></div>
                                        <div className="p-4 bg-[#f3f4f5] rounded-xl"><p className="text-[9px] font-black text-slate-500 uppercase mb-1">Output Torque</p><p className="text-lg font-bold">{metrics.outputTorque} Nm</p></div>
                                        <div className="p-4 bg-[#f3f4f5] rounded-xl"><p className="text-[9px] font-black text-slate-500 uppercase mb-1">Eff. (%)</p><p className="text-lg font-bold">{metrics.efficiency}</p></div>
                                        <div className="p-4 bg-[#f3f4f5] rounded-xl"><p className="text-[9px] font-black text-slate-500 uppercase mb-1">Safety Factor</p><p className="text-lg font-bold">{metrics.safetyFactor}</p></div>
                                    </div>
                                    <div className="aspect-square w-full rounded-2xl bg-[#191c1d] relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#0058be]/40 to-transparent" />
                                        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-6">
                                            <svg className="w-20 h-20 text-[#0058be] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <circle cx="12" cy="12" r="8" strokeWidth="2" />
                                                <circle cx="12" cy="12" r="4" strokeWidth="2" />
                                                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeWidth="2" />
                                            </svg>
                                            <p className="text-white text-xs font-medium tracking-wide">3D Geometry Visualization</p>
                                            <p className="text-white/60 text-[10px] mt-1">Real-time mesh generation active</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 pt-8 border-t border-[#c2c6d6]/30 flex justify-between items-center">
                        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-[#191c1d] text-sm font-bold"><span className="material-symbols-outlined text-lg">arrow_back</span>Previous Step</button>
                        <div className="flex gap-4">
                            <button onClick={handleSaveDraft} className="px-6 py-2.5 rounded-xl border border-[#c2c6d6] text-sm font-bold hover:bg-[#edeeef]">Save Draft</button>
                            <button onClick={onNext} className="px-8 py-2.5 rounded-xl gradient-button text-white text-sm font-bold shadow-lg shadow-[#0058be]/20">Validate & Next Step</button>
                        </div>
                    </div>
                </div>
            </div>
        </WizardScaffold>
    );
};

Step3TransmissionDesign.propTypes = {
    onNext: PropTypes.func.isRequired,
    onBack: PropTypes.func.isRequired,
};

export default Step3TransmissionDesign;
