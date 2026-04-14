import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import WizardScaffold from './WizardScaffold';

const MOTORS = [
    { id: 1, model: 'AC-15-1450-IE3', power: 15, speed: 1450, efficiency: 92.5, series: 'Standard Series', frame: '160M', weight: 115 },
    { id: 2, model: 'AC-18-1460-IE3', power: 18.5, speed: 1460, efficiency: 92.1, series: 'High Power Series', frame: '180M', weight: 126 },
    { id: 3, model: 'AC-11-2900-IE2', power: 11, speed: 2900, efficiency: 89.4, series: 'Compact Series', frame: '142M', weight: 95 },
    { id: 4, model: 'AC-15-970-IE3', power: 15, speed: 970, efficiency: 91.8, series: 'Low Speed Series', frame: '160L', weight: 118 },
];

const Step2MotorSelection = ({ onNext, onBack }) => {
    const navigate = useNavigate();
    const [selectedMotor, setSelectedMotor] = useState(null);
    const [sortBy, setSortBy] = useState('power');
    const [draftData, setDraftData] = useState({});
    const [calculatedEfficiency, setCalculatedEfficiency] = useState(92.5);
    const [bestMatchId, setBestMatchId] = useState(1);
    const [userSelected, setUserSelected] = useState(false);

    // Load from localStorage on mount and calculate efficiency
    useEffect(() => {
        syncFromStep1();
    }, []);

    const syncFromStep1 = () => {
        const data = JSON.parse(localStorage.getItem('gearbox_draft') || '{}');
        setDraftData(data);
    };

    // Recompute efficiency and best match whenever draftData changes
    useEffect(() => {
        const power = Number(draftData.power) || 15.5;
        const speed = Number(draftData.speed) || 1450;
        const loadType = draftData.loadType || 'constant';

        let baseEfficiency = 92.5;
        if (loadType === 'fluctuating') baseEfficiency -= 1.5;
        const speedFactor = Math.min(speed / 1500, 1.0);
        const speedAdjustment = speedFactor > 0.8 ? 0 : (0.8 - speedFactor) * 2;
        const finalEfficiency = Math.max(0, baseEfficiency - speedAdjustment);
        setCalculatedEfficiency(finalEfficiency);

        // Score motors by closeness to desired power and efficiency
        const matchingMotors = MOTORS.filter(m => Math.abs(m.power - power) <= 10); // broader tolerance
        let bestMatch = matchingMotors.length > 0 ? matchingMotors[0] : MOTORS[0];
        let bestScore = Infinity;
        matchingMotors.forEach(m => {
            const effDiff = Math.abs((m.efficiency || 0) - finalEfficiency);
            const powerDiff = Math.abs((m.power || 0) - power);
            const score = effDiff * 3 + powerDiff; // weight efficiency higher
            if (score < bestScore) {
                bestScore = score;
                bestMatch = m;
            }
        });

        setBestMatchId(bestMatch.id);
        if (!userSelected) {
            // only override selection if user hasn't manually chosen
            setSelectedMotor(draftData.selectedMotorId ?? bestMatch.id);
        }
    }, [draftData, userSelected]);

    // Allow user to re-sync if they edit Step 1 and come back
    const handleResync = () => {
        syncFromStep1();
        alert('✅ Synced latest inputs from Step 1');
    };

    const selected = useMemo(() => MOTORS.find((item) => item.id === selectedMotor), [selectedMotor]);

    const handleConfirmSelection = () => {
        const draftData = JSON.parse(localStorage.getItem('gearbox_draft') || '{}');
        draftData.selectedMotor = selected;
        draftData.selectedMotorId = selected.id;
        localStorage.setItem('gearbox_draft', JSON.stringify(draftData));
        alert(`✅ Motor ${selected.model} selected successfully!\n\nPower: ${selected.power} kW\nSpeed: ${selected.speed} RPM\nEfficiency: ${selected.efficiency}%`);
    };

    const handleManualSelect = (motorId) => {
        setSelectedMotor(motorId);
        setUserSelected(true);
    };

    const handleSort = (sortType) => {
        setSortBy(sortType);
        alert(`✅ Sắp xếp theo: ${sortType === 'power' ? 'Công suất' : 'Hiệu suất'}!`);
    };

    const handleFilter = () => {
        alert('✅ Áp dụng bộ lọc. Chức năng lọc nâng cao sẽ được phát triển thêm!');
    };

    return (
        <WizardScaffold activeKey="motor">
            <div className="p-8">
                <div className="max-w-7xl mx-auto mb-6">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-slate-500 hover:text-[#191c1d] font-semibold"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        Back to Dashboard
                    </button>
                </div>
                <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8">
                    <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
                        <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
                            <span>Step 02</span>
                            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                            <span className="text-[#0058be]">Motor Selection</span>
                        </div>

                        <section className="bg-white rounded-xl shadow-sm p-8 border border-[#c2c6d6]/20">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <span className={`${selectedMotor === bestMatchId ? 'bg-[#0058be]/10 text-[#0058be]' : 'bg-slate-100 text-slate-500'} text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full mb-2 inline-block`}>
                                        {selectedMotor === bestMatchId ? '✨ Best Match' : 'Alternative Option'}
                                    </span>
                                    <h1 className="text-3xl font-extrabold tracking-tight">{selected?.series}</h1>
                                    <p className="text-slate-500 mt-1">{selected?.model}</p>
                                </div>
                                <div className="w-24 h-24 bg-[#edeeef] rounded-xl flex items-center justify-center">
                                    <span className="material-symbols-outlined text-5xl text-[#0058be]">electric_bolt</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-[#f3f4f5] rounded-lg p-4"><p className="text-[10px] font-bold text-slate-400 uppercase">Power Rating</p><p className="text-xl font-bold">{selected?.power} <span className="text-sm font-medium">kW</span></p></div>
                                <div className="bg-[#f3f4f5] rounded-lg p-4"><p className="text-[10px] font-bold text-slate-400 uppercase">Rated Speed</p><p className="text-xl font-bold">{selected?.speed} <span className="text-sm font-medium">RPM</span></p></div>
                                <div className="bg-[#f3f4f5] rounded-lg p-4"><p className="text-[10px] font-bold text-slate-400 uppercase">Nom. Torque</p><p className="text-xl font-bold">{((selected?.power || 15) * 9550 / (selected?.speed || 1450)).toFixed(1)} <span className="text-sm font-medium">Nm</span></p></div>
                                <div className="bg-[#f3f4f5] rounded-lg p-4"><p className="text-[10px] font-bold text-slate-400 uppercase">Efficiency</p><p className="text-xl font-bold text-[#0058be]">{selected?.efficiency} <span className="text-sm font-medium">%</span></p></div>
                            </div>

                            <div className="mt-6 p-4 bg-[#e3f2fd] border-l-4 border-[#0058be] rounded">
                                <p className="text-xs font-semibold text-[#0058be]">Efficiency Calculated from Step 1</p>
                                <p className="text-sm text-slate-600 mt-1">
                                    Based on your input parameters (Power: {draftData.power || 15.5} kW, Speed: {draftData.speed || 1450} RPM, Load: {draftData.loadType === 'constant' ? 'Constant' : 'Fluctuating'}), the optimal motor efficiency is approximately <strong>{calculatedEfficiency.toFixed(1)}%</strong>.
                                </p>
                                <div className="mt-2 text-[12px] text-slate-500">Estimated Input Torque: <strong>{(((draftData.power || 15.5) * 9550) / (draftData.speed || 1450)).toFixed(1)} Nm</strong></div>
                                <button onClick={handleResync} className="mt-3 text-xs text-[#0058be] font-semibold">Sync latest Step 1 values</button>
                            </div>

                            <div className="mt-8 flex items-center justify-between border-t border-[#c2c6d6]/20 pt-6">
                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-lg">scale</span><span>{selected?.weight} kg</span></div>
                                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-lg">database</span><span>Frame: {selected?.frame}</span></div>
                                </div>
                                <button onClick={handleConfirmSelection} className="gradient-button text-white px-6 py-2.5 rounded-lg text-sm font-bold">Confirm Selection</button>
                            </div>
                        </section>

                        <section className="bg-white rounded-xl border border-[#c2c6d6]/20 overflow-hidden">
                            <div className="px-8 py-6 border-b border-[#c2c6d6]/20 flex justify-between items-center">
                                <h2 className="text-lg font-bold tracking-tight">Motor Catalog</h2>
                                <div className="flex gap-2">
                                    <button onClick={handleFilter} className="p-2 hover:bg-[#edeeef] rounded-lg" title="Bộ lọc"><span className="material-symbols-outlined text-slate-500">filter_list</span></button>
                                    <button onClick={() => handleSort('power')} className="p-2 hover:bg-[#edeeef] rounded-lg" title="Sắp xếp"><span className="material-symbols-outlined text-slate-500">sort</span></button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-[#f3f4f5]">
                                        <tr>
                                            <th className="px-8 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Model ID</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Power (kW)</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rated Speed</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Efficiency</th>
                                            <th className="px-8 py-3 text-right" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#c2c6d6]/20">
                                        {MOTORS.map((motor) => {
                                            // compute closeness score for display
                                            const effDiff = Math.abs((motor.efficiency || 0) - calculatedEfficiency);
                                            const powerDiff = Math.abs((motor.power || 0) - (draftData.power || 15.5));
                                            const score = effDiff * 3 + powerDiff;
                                            const recommended = motor.id === bestMatchId;
                                            return (
                                                <tr key={motor.id} className={`group hover:bg-slate-50 ${selectedMotor === motor.id ? 'bg-blue-50/40' : ''}`}>
                                                    <td className="px-8 py-4"><div className="flex flex-col"><span className="font-bold">{motor.model}</span><span className="text-[10px] text-slate-400">{motor.series}</span></div></td>
                                                    <td className="px-4 py-4 font-medium">{motor.power}</td>
                                                    <td className="px-4 py-4 font-medium">{motor.speed} RPM</td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-0.5 rounded-full bg-[#e1e3e4] text-[#0058be] text-[10px] font-bold">{motor.efficiency}%</span>
                                                            {recommended && <span className="px-2 py-0.5 text-[10px] font-bold bg-[#0058be]/10 text-[#0058be] rounded">Recommended</span>}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 mt-1">Δeff {effDiff.toFixed(1)} | score {score.toFixed(1)}</div>
                                                    </td>
                                                    <td className="px-8 py-4 text-right"><button onClick={() => handleManualSelect(motor.id)} className="text-xs font-bold text-[#0058be] opacity-0 group-hover:opacity-100">Select</button></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <footer className="flex items-center justify-between mt-2">
                            <button onClick={onBack} className="flex items-center gap-2 px-6 py-3 rounded-lg border border-[#c2c6d6] text-sm font-semibold hover:bg-[#f3f4f5]"><span className="material-symbols-outlined text-sm">arrow_back</span>Back to Parameters</button>
                            <button onClick={onNext} className="flex items-center gap-2 px-8 py-3 rounded-lg gradient-button text-white font-bold shadow-lg shadow-[#0058be]/30">Next: Transmission Design <span className="material-symbols-outlined text-sm">arrow_forward</span></button>
                        </footer>
                    </div>

                    <div className="col-span-12 lg:col-span-4 space-y-6">
                        <section className="bg-white rounded-xl p-6 border border-[#c2c6d6]/20">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Current Config</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between"><span className="text-slate-500">Model</span><strong>{selected?.model}</strong></div>
                                <div className="flex justify-between"><span className="text-slate-500">Frame</span><strong>{selected?.frame}</strong></div>
                                <div className="flex justify-between"><span className="text-slate-500">Weight</span><strong>{selected?.weight} kg</strong></div>
                            </div>
                        </section>
                        <section className="bg-white rounded-xl p-6 border border-[#c2c6d6]/20">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Engineering Insights</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">IE3 motors save 20-25% energy versus standard alternatives and improve thermal stability in continuous duty cycles.</p>
                        </section>
                    </div>
                </div>
            </div>
        </WizardScaffold>
    );
};

Step2MotorSelection.propTypes = {
    onNext: PropTypes.func.isRequired,
    onBack: PropTypes.func.isRequired,
};

export default Step2MotorSelection;
