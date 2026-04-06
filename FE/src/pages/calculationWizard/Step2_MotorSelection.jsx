import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import WizardScaffold from './WizardScaffold';

const MOTORS = [
    { id: 1, model: 'AC-15-1450-IE3', power: 15, speed: 1450, efficiency: 92.5, series: 'Standard Series', frame: '160M', weight: 115 },
    { id: 2, model: 'AC-18-1460-IE3', power: 18.5, speed: 1460, efficiency: 92.1, series: 'High Power Series', frame: '180M', weight: 126 },
    { id: 3, model: 'AC-11-2900-IE2', power: 11, speed: 2900, efficiency: 89.4, series: 'Compact Series', frame: '142M', weight: 95 },
    { id: 4, model: 'AC-15-970-IE3', power: 15, speed: 970, efficiency: 91.8, series: 'Low Speed Series', frame: '160L', weight: 118 },
];

const Step2MotorSelection = ({ onNext, onBack }) => {
    const [selectedMotor, setSelectedMotor] = useState(1);
    const selected = useMemo(() => MOTORS.find((item) => item.id === selectedMotor), [selectedMotor]);

    return (
        <WizardScaffold activeKey="motor">
            <div className="p-8">
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
                                    <span className="bg-[#0058be]/10 text-[#0058be] text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full mb-2 inline-block">Best Match</span>
                                    <h1 className="text-3xl font-extrabold tracking-tight">IE3 Super-Efficiency Series</h1>
                                    <p className="text-slate-500 mt-1">Industrial Grade High-Torque AC Induction Motor</p>
                                </div>
                                <div className="w-24 h-24 bg-[#edeeef] rounded-xl flex items-center justify-center">
                                    <span className="material-symbols-outlined text-5xl text-[#0058be]">electric_bolt</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-[#f3f4f5] rounded-lg p-4"><p className="text-[10px] font-bold text-slate-400 uppercase">Power Rating</p><p className="text-xl font-bold">15.0 <span className="text-sm font-medium">kW</span></p></div>
                                <div className="bg-[#f3f4f5] rounded-lg p-4"><p className="text-[10px] font-bold text-slate-400 uppercase">Rated Speed</p><p className="text-xl font-bold">1450 <span className="text-sm font-medium">RPM</span></p></div>
                                <div className="bg-[#f3f4f5] rounded-lg p-4"><p className="text-[10px] font-bold text-slate-400 uppercase">Nom. Torque</p><p className="text-xl font-bold">98.8 <span className="text-sm font-medium">Nm</span></p></div>
                                <div className="bg-[#f3f4f5] rounded-lg p-4"><p className="text-[10px] font-bold text-slate-400 uppercase">Efficiency</p><p className="text-xl font-bold text-[#0058be]">92.5 <span className="text-sm font-medium">%</span></p></div>
                            </div>

                            <div className="mt-8 flex items-center justify-between border-t border-[#c2c6d6]/20 pt-6">
                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-lg">scale</span><span>115 kg</span></div>
                                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-lg">database</span><span>Frame: 160M</span></div>
                                </div>
                                <button className="gradient-button text-white px-6 py-2.5 rounded-lg text-sm font-bold">Confirm Selection</button>
                            </div>
                        </section>

                        <section className="bg-white rounded-xl border border-[#c2c6d6]/20 overflow-hidden">
                            <div className="px-8 py-6 border-b border-[#c2c6d6]/20 flex justify-between items-center">
                                <h2 className="text-lg font-bold tracking-tight">Motor Catalog</h2>
                                <div className="flex gap-2">
                                    <button className="p-2 hover:bg-[#edeeef] rounded-lg"><span className="material-symbols-outlined text-slate-500">filter_list</span></button>
                                    <button className="p-2 hover:bg-[#edeeef] rounded-lg"><span className="material-symbols-outlined text-slate-500">sort</span></button>
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
                                        {MOTORS.map((motor) => (
                                            <tr key={motor.id} className={`group hover:bg-slate-50 ${selectedMotor === motor.id ? 'bg-blue-50/40' : ''}`}>
                                                <td className="px-8 py-4"><div className="flex flex-col"><span className="font-bold">{motor.model}</span><span className="text-[10px] text-slate-400">{motor.series}</span></div></td>
                                                <td className="px-4 py-4 font-medium">{motor.power}</td>
                                                <td className="px-4 py-4 font-medium">{motor.speed} RPM</td>
                                                <td className="px-4 py-4"><span className="px-2 py-0.5 rounded-full bg-[#e1e3e4] text-[#0058be] text-[10px] font-bold">{motor.efficiency}%</span></td>
                                                <td className="px-8 py-4 text-right"><button onClick={() => setSelectedMotor(motor.id)} className="text-xs font-bold text-[#0058be] opacity-0 group-hover:opacity-100">Select</button></td>
                                            </tr>
                                        ))}
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
