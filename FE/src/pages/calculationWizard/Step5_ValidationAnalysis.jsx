import React, { useState } from 'react';
import PropTypes from 'prop-types';
import WizardScaffold from './WizardScaffold';

const Step5ValidationAnalysis = ({ onBack, onComplete }) => {
    const [exportFormat, setExportFormat] = useState('pdf');

    return (
        <WizardScaffold activeKey="validation">
            <div className="p-8 min-h-screen">
                <div className="max-w-6xl mx-auto mb-10">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#495e8a]">Phase 05</span>
                            <h1 className="text-2xl font-bold tracking-tight">Validation & Structural Analysis</h1>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold text-[#0058be]">STEP 5 / 5</span>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Final Engineering Review</p>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-[#edeeef] rounded-full overflow-hidden"><div className="h-full w-full bg-[#0058be]" /></div>
                </div>

                <div className="max-w-6xl mx-auto grid grid-cols-12 gap-6">
                    <div className="col-span-12 lg:col-span-4 space-y-6">
                        <section className="bg-white rounded-xl p-6 shadow-sm border border-[#c2c6d6]/20">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-sm">verified</span>Stress Check Results</h3>
                            <div className="space-y-4">
                                <div className="p-4 rounded-lg bg-green-50/50 border border-green-100 flex items-center justify-between"><div className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-green-500" /><div><p className="text-xs font-bold text-green-900 uppercase">Contact Stress</p><p className="text-lg font-bold text-green-700">842 MPa</p></div></div><span className="text-[10px] font-bold text-green-600 px-2 py-0.5 bg-green-100 rounded">SAFE</span></div>
                                <div className="p-4 rounded-lg bg-green-50/50 border border-green-100 flex items-center justify-between"><div className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-green-500" /><div><p className="text-xs font-bold text-green-900 uppercase">Root Bending</p><p className="text-lg font-bold text-green-700">215 MPa</p></div></div><span className="text-[10px] font-bold text-green-600 px-2 py-0.5 bg-green-100 rounded">SAFE</span></div>
                                <div className="p-4 rounded-lg bg-[#ffdad6]/30 border border-[#ba1a1a]/20 flex items-center justify-between"><div className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-[#ba1a1a]" /><div><p className="text-xs font-bold text-[#ba1a1a] uppercase">Safety Factor</p><p className="text-lg font-bold text-[#ba1a1a]">1.12 SF</p></div></div><span className="text-[10px] font-bold text-white px-2 py-0.5 bg-[#ba1a1a] rounded">LOW</span></div>
                            </div>
                        </section>

                        <section className="bg-slate-900 rounded-xl p-6 text-white relative shadow-xl">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-sm">auto_awesome</span>Smart Optimization</h3>
                            <p className="text-sm font-medium leading-relaxed mb-6 text-slate-300">Current Safety Factor (1.12) is below recommended 1.25 for aerospace applications.</p>
                            <div className="space-y-3">
                                <button className="w-full text-left p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"><div className="flex justify-between items-center"><span className="text-xs font-bold text-blue-300 uppercase">Material Upgrade</span><span className="material-symbols-outlined text-xs">arrow_forward</span></div><p className="text-[11px] text-slate-400 mt-1">Switch to 18CrNiMo7-6 for +15% fatigue strength.</p></button>
                                <button className="w-full text-left p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"><div className="flex justify-between items-center"><span className="text-xs font-bold text-blue-300 uppercase">Profile Adjustment</span><span className="material-symbols-outlined text-xs">arrow_forward</span></div><p className="text-[11px] text-slate-400 mt-1">Increase Helix Angle to 22.5° to distribute load.</p></button>
                            </div>
                        </section>
                    </div>

                    <div className="col-span-12 lg:col-span-8 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <section className="bg-white rounded-xl p-6 shadow-sm border border-[#c2c6d6]/20">
                                <div className="flex justify-between items-start mb-6"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Torque Distribution</h3><span className="text-[10px] font-bold text-slate-400 uppercase">Input: 450 Nm</span></div>
                                <div className="h-40 flex items-end justify-between gap-1">
                                    <div className="bg-blue-100 w-full h-[30%] rounded-t-sm" /><div className="bg-blue-200 w-full h-[45%] rounded-t-sm" /><div className="bg-blue-400 w-full h-[70%] rounded-t-sm" /><div className="bg-blue-600 w-full h-[95%] rounded-t-sm" /><div className="bg-blue-500 w-full h-[80%] rounded-t-sm" /><div className="bg-blue-300 w-full h-[55%] rounded-t-sm" /><div className="bg-blue-200 w-full h-[40%] rounded-t-sm" />
                                </div>
                                <div className="flex justify-between mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-tighter"><span>Stage 1</span><span>Critical Peak</span><span>Output</span></div>
                            </section>

                            <section className="bg-white rounded-xl p-6 shadow-sm border border-[#c2c6d6]/20">
                                <div className="flex justify-between items-start mb-6"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Bending Moment</h3><span className="text-[10px] font-bold text-slate-400 uppercase">Max: 12.4 kN</span></div>
                                <div className="h-40 flex items-center">
                                    <svg className="w-full h-full text-blue-600 overflow-visible" viewBox="0 0 200 100">
                                        <path d="M0 80 Q 50 10, 100 50 T 200 20" fill="none" stroke="currentColor" strokeWidth="2.5" />
                                        <circle cx="50" cy="22" r="4" fill="currentColor" />
                                        <text x="55" y="15" fill="currentColor" fontSize="8" fontWeight="bold">MAX DEFLECTION</text>
                                    </svg>
                                </div>
                            </section>
                        </div>

                        <section className="bg-[#edeeef] rounded-xl overflow-hidden relative h-[320px] shadow-inner group">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#0058be]/15 to-transparent" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <div className="w-16 h-16 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center border border-white/50"><span className="material-symbols-outlined text-3xl text-slate-700">view_in_ar</span></div>
                                <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600">3D Simulation Ready</p>
                            </div>
                            <div className="absolute top-4 left-4 flex gap-2"><span className="bg-white/80 px-2 py-1 rounded text-[9px] font-bold border border-slate-200">ISO-VIEW</span><span className="bg-white/80 px-2 py-1 rounded text-[9px] font-bold border border-slate-200">WIREFRAME</span></div>
                        </section>

                        <div className="flex justify-between items-center pt-4">
                            <button onClick={onBack} className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-200"><span className="material-symbols-outlined">arrow_back</span>Back to Design</button>
                            <div className="flex gap-4">
                                <button className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold border border-[#c2c6d6] text-slate-700 hover:bg-white"><span className="material-symbols-outlined">save</span>Save Draft</button>
                                <select aria-label="Export format" value={exportFormat} onChange={(event) => setExportFormat(event.target.value)} className="px-3 py-2.5 rounded-lg text-sm border border-[#c2c6d6] bg-white">
                                    <option value="pdf">PDF</option>
                                    <option value="step">STEP</option>
                                    <option value="dwg">DWG</option>
                                </select>
                                <button onClick={onComplete} className="gradient-button flex items-center gap-2 px-8 py-2.5 rounded-lg text-sm font-bold text-white shadow-lg hover:shadow-blue-500/20"><span className="material-symbols-outlined">description</span>Export Full Report</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </WizardScaffold>
    );
};

Step5ValidationAnalysis.propTypes = {
    onBack: PropTypes.func.isRequired,
    onComplete: PropTypes.func.isRequired,
};

export default Step5ValidationAnalysis;
