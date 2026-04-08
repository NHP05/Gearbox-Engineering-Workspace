import React, { useState } from 'react';
import PropTypes from 'prop-types';
import axiosClient from '../../api/axiosClient';
import WizardScaffold from './WizardScaffold';

const BEARINGS = [
    { model: 'SKF 6207-2RS1', dims: '35 x 72 x 17 mm', dynamic: '27.0 kN', static: '15.3 kN', rpm: '11,000 r/min', tag: 'Deep Groove Ball Bearing' },
    { model: 'SKF 6307-2RS1', dims: '35 x 80 x 21 mm', dynamic: '35.1 kN', static: '19.0 kN', rpm: '10,000 r/min', tag: 'Optimized for Radial Load' },
    { model: 'FAG 6207-C3', dims: '35 x 72 x 17 mm', dynamic: '25.5 kN', static: '15.0 kN', rpm: '14,000 r/min', tag: 'High-Speed Optimized' },
];

const Step4ShaftBearing = ({ onNext, onBack }) => {
    const [selectedIndex, setSelectedIndex] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleNext = async () => {
        setLoading(true);
        setError('');
        try {
            const shaftData = {
                diameter: 35,
                length: 145,
                material: 'AISI 4140',
                safetyFactor: 2.5,
            };
            const response = await axiosClient.post('/calculate/shaft', shaftData);
            localStorage.setItem('step4_result', JSON.stringify(response.data));
            onNext();
        } catch (err) {
            setError(err?.response?.data?.message || 'Lỗi tính toán shaft');
        } finally {
            setLoading(false);
        }
    };

    return (
        <WizardScaffold activeKey="shaft">
            <div className="p-8 space-y-8">
                <div className="flex justify-between items-end">
                    <div>
                        <span className="text-[10px] text-[#0058be] font-bold uppercase tracking-[0.2em] block mb-1">Configuration Step 04</span>
                        <h1 className="text-3xl font-bold tracking-tight">Shaft & Bearing Design</h1>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onBack} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#495e8a] bg-[#e7e8e9] hover:bg-[#e1e3e4] flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">arrow_back</span>Previous Step</button>
                        <button 
                            onClick={handleNext}
                            disabled={loading}
                            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white gradient-button flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Đang tính toán...' : 'Validate & Next Step'}
                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                    <section className="col-span-12 lg:col-span-8 bg-white rounded-xl p-6 shadow-sm border border-[#c2c6d6]/20">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#0058be]">architecture</span>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Shaft Geometry Layout</h3>
                            </div>
                            <div className="flex gap-2"><span className="px-2 py-1 bg-[#0058be]/10 text-[#0058be] text-[10px] font-bold rounded">AISI 4140 Steel</span><span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded">SF: 2.5</span></div>
                        </div>

                        <div className="relative h-64 bg-[#f3f4f5] rounded-lg flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#495e8a 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }} />
                            <div className="relative w-4/5 flex items-center">
                                <div className="relative flex-1 h-12 bg-slate-300 border-x border-slate-400 flex items-center justify-center">
                                    <span className="absolute -top-8 text-[10px] font-mono text-slate-500">Ø 35.0mm</span>
                                    <div className="w-full border-t border-dashed border-slate-500 absolute top-1/2" />
                                    <div className="h-16 w-12 bg-slate-400/50 mx-4 border border-slate-500/30 flex items-center justify-center"><span className="text-[9px] font-bold text-slate-600">INPUT</span></div>
                                    <span className="absolute -bottom-8 text-[10px] font-mono text-slate-500">L: 145mm</span>
                                </div>
                                <div className="w-1 bg-slate-400 h-20" />
                                <div className="relative flex-[1.5] h-16 bg-slate-300 border-x border-slate-400 flex items-center justify-center">
                                    <span className="absolute -top-8 text-[10px] font-mono text-slate-500">Ø 52.0mm</span>
                                    <div className="w-full border-t border-dashed border-slate-500 absolute top-1/2" />
                                    <div className="h-20 w-16 bg-slate-400/50 mx-6 border border-slate-500/30 flex items-center justify-center"><span className="text-[9px] font-bold text-slate-600">OUTPUT</span></div>
                                    <span className="absolute -bottom-8 text-[10px] font-mono text-slate-500">L: 210mm</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="col-span-12 lg:col-span-4 space-y-4">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#c2c6d6]/20">
                            <div className="flex items-center gap-3 mb-6"><span className="material-symbols-outlined text-[#924700]">analytics</span><h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Force Analysis</h3></div>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-center mb-2"><span className="text-[11px] font-bold text-slate-400 uppercase">Input Shaft Loads</span><span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">Stable</span></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-[#edeeef] p-3 rounded-lg"><p className="text-[10px] text-[#495e8a] font-bold mb-1">Radial (Fr)</p><p className="text-xl font-bold font-mono">1,240 <span className="text-xs font-normal">N</span></p></div>
                                        <div className="bg-[#edeeef] p-3 rounded-lg"><p className="text-[10px] text-[#495e8a] font-bold mb-1">Axial (Fa)</p><p className="text-xl font-bold font-mono">450 <span className="text-xs font-normal">N</span></p></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2"><span className="text-[11px] font-bold text-slate-400 uppercase">Output Shaft Loads</span><span className="text-[10px] font-bold text-[#924700] bg-[#ffdcc6] px-2 py-0.5 rounded">High Load</span></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-[#edeeef] p-3 rounded-lg border-l-4 border-[#924700]/40"><p className="text-[10px] text-[#495e8a] font-bold mb-1">Radial (Fr)</p><p className="text-xl font-bold font-mono">4,820 <span className="text-xs font-normal">N</span></p></div>
                                        <div className="bg-[#edeeef] p-3 rounded-lg"><p className="text-[10px] text-[#495e8a] font-bold mb-1">Axial (Fa)</p><p className="text-xl font-bold font-mono">1,120 <span className="text-xs font-normal">N</span></p></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="col-span-12 bg-white rounded-xl p-6 shadow-sm border border-[#c2c6d6]/20">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3"><span className="material-symbols-outlined text-[#0058be]">settings_backup_restore</span><h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Bearing Selection Catalog</h3></div>
                            <span className="text-[11px] text-slate-400">Filter: 22 SKF Matches</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-separate border-spacing-y-2">
                                <thead>
                                    <tr className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                                        <th className="pb-3 pl-4">Model Designation</th>
                                        <th className="pb-3">Dimensions (d/D/B)</th>
                                        <th className="pb-3 text-center">Dynamic Load (C)</th>
                                        <th className="pb-3 text-center">Static Load (C0)</th>
                                        <th className="pb-3 text-center">RPM Limit</th>
                                        <th className="pb-3 text-right pr-4">Selection</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {BEARINGS.map((row, index) => {
                                        const active = index === selectedIndex;
                                        return (
                                            <tr key={row.model} className={`${active ? 'bg-[#d8e2ff]/40 ring-1 ring-[#0058be]/20' : 'bg-[#f3f4f5]/50 hover:bg-[#0058be]/5'} transition-colors`}>
                                                <td className="py-4 pl-4 rounded-l-xl"><div><p className={`font-bold ${active ? 'text-[#0058be]' : 'text-slate-900'}`}>{row.model}</p><p className={`text-[10px] mt-1 ${active ? 'text-[#0058be]/70' : 'text-slate-500'}`}>{row.tag}</p></div></td>
                                                <td className="py-4 text-xs font-mono text-slate-600">{row.dims}</td>
                                                <td className="py-4 text-center font-bold text-slate-700">{row.dynamic}</td>
                                                <td className="py-4 text-center font-bold text-slate-700">{row.static}</td>
                                                <td className="py-4 text-center font-bold text-slate-500">{row.rpm}</td>
                                                <td className="py-4 text-right pr-4 rounded-r-xl"><button onClick={() => setSelectedIndex(index)} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${active ? 'bg-[#0058be] text-white' : 'border border-[#0058be] text-[#0058be] hover:bg-[#0058be] hover:text-white'}`}>{active ? 'Selected' : 'Select'}</button></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </WizardScaffold>
    );
};

Step4ShaftBearing.propTypes = {
    onNext: PropTypes.func.isRequired,
    onBack: PropTypes.func.isRequired,
};

export default Step4ShaftBearing;
