import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import WizardScaffold from './WizardScaffold';
import axiosClient from '../../api/axiosClient';
import {
    getWizardState,
    patchWizardState,
    invalidateFromStep,
    setStepSaved,
} from '../../utils/wizardState';
import { useLanguage } from '../../context/LanguageContext';

const Step2MotorSelection = ({ onNext, onBack }) => {
    const { language, t } = useLanguage();
    const isVi = language === 'vi';
    const wizardState = getWizardState();
    const step1Result = wizardState?.step1Result || {};
    const step1Input = wizardState?.step1Input || {};

    const requiredPower = Number(step1Result?.required_power || step1Input?.power || 15.5);
    const requiredSpeed = Number(step1Result?.suggested_motor?.speed_rpm || step1Input?.speed || 1450);

    const [motors, setMotors] = useState([]);
    const [selectedMotor, setSelectedMotor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [confirmMessage, setConfirmMessage] = useState('');
    const [isStepSaved, setIsStepSaved] = useState(Boolean(wizardState?.stepSaved?.['2']));
    const selected = useMemo(() => motors.find((item) => item.id === selectedMotor), [motors, selectedMotor]);

    const pickBestMotor = (catalog) => {
        if (!catalog?.length) return null;

        const sorted = [...catalog].sort((a, b) => {
            const scoreA = Math.abs(a.power - requiredPower) * 3 + Math.abs(a.speed - requiredSpeed) / 100;
            const scoreB = Math.abs(b.power - requiredPower) * 3 + Math.abs(b.speed - requiredSpeed) / 100;
            return scoreA - scoreB;
        });

        return sorted[0]?.id || null;
    };

    // Fetch motor catalog từ API
    useEffect(() => {
        const fetchMotors = async () => {
            try {
                const response = await axiosClient.get('/motor/catalog');
                const catalog = Array.isArray(response?.data?.data) ? response.data.data : [];

                const normalized = catalog.map((item, index) => ({
                    id: Number(item.id || index + 1),
                    model: item.model || item.name || `MOTOR-${index + 1}`,
                    power: Number(item.power || item.power_kw || 0),
                    speed: Number(item.speed || item.speed_rpm || 1450),
                    efficiency: Number(item.efficiency || 90),
                    series: item.series || 'Catalog Series',
                    frame: item.frame || 'N/A',
                    weight: Number(item.weight || 100),
                }));

                const fallbackMotors = [
                    { id: 1, model: 'AC-15-1450-IE3', power: 15, speed: 1450, efficiency: 92.5, series: 'Standard Series', frame: '160M', weight: 115 },
                    { id: 2, model: 'AC-18-1460-IE3', power: 18.5, speed: 1460, efficiency: 92.1, series: 'High Power Series', frame: '180M', weight: 126 },
                    { id: 3, model: 'AC-11-2900-IE2', power: 11, speed: 2900, efficiency: 89.4, series: 'Compact Series', frame: '142M', weight: 95 },
                    { id: 4, model: 'AC-15-970-IE3', power: 15, speed: 970, efficiency: 91.8, series: 'Low Speed Series', frame: '160L', weight: 118 },
                ];

                const source = normalized.length ? normalized : fallbackMotors;
                setMotors(source);
                const bestId = wizardState?.selectedMotor?.id || pickBestMotor(source);
                setSelectedMotor(bestId || source[0]?.id || null);
            } catch (err) {
                setError('Lỗi tải danh sách motor');
            } finally {
                setLoading(false);
            }
        };
        fetchMotors();
    }, [requiredPower, requiredSpeed, wizardState?.selectedMotor?.id]);

    const handleConfirmSelection = () => {
        if (!selected) {
            setError('Vui long chon mot dong co truoc khi xac nhan.');
            return;
        }

        patchWizardState({ selectedMotor: selected });
        setStepSaved(2, true);
        setIsStepSaved(true);
        localStorage.setItem('step2_selected_motor', JSON.stringify(selected));
        setConfirmMessage(`${t('wizard_selection_saved')} ${selected.model}.`);
        setError('');
    };

    const handleNextStep = () => {
        if (!isStepSaved) {
            setError(t('wizard_save_required'));
            return;
        }

        if (!selected) {
            setError('Vui long chon mot dong co de tiep tuc.');
            return;
        }

        patchWizardState({ selectedMotor: selected });
        localStorage.setItem('step2_selected_motor', JSON.stringify(selected));
        onNext();
    };

    const handleSelectMotor = (motorId) => {
        setSelectedMotor(motorId);
        setIsStepSaved(false);
        invalidateFromStep(2);
        setConfirmMessage('');
    };

    return (
        <WizardScaffold activeKey="motor">
            <div className="p-8">
                <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8">
                    <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
                        <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
                            <span>{t('step_of')} 02</span>
                            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                            <span className="text-[#0058be]">{t('step2_title')}</span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <h1 className="text-2xl font-extrabold tracking-tight">{t('step2_title')}</h1>
                                <span className="text-sm font-medium text-slate-500">40% {t('complete')}</span>
                            </div>
                            <div className="h-1.5 w-full bg-[#edeeef] rounded-full overflow-hidden">
                                <div className="h-full w-2/5 bg-[#0058be]" />
                            </div>
                        </div>

                        <section className="bg-white rounded-xl shadow-sm p-8 border border-[#c2c6d6]/20">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <span className="bg-[#0058be]/10 text-[#0058be] text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full mb-2 inline-block">{isVi ? 'Đề xuất tốt nhất' : 'Best Match'}</span>
                                    <h1 className="text-3xl font-extrabold tracking-tight">{selected?.series || 'IE3 Super-Efficiency Series'}</h1>
                                    <p className="text-slate-500 mt-1">{selected?.model || 'Industrial Grade High-Torque AC Induction Motor'}</p>
                                </div>
                                <div className="w-24 h-24 bg-[#edeeef] rounded-xl flex items-center justify-center">
                                    <span className="material-symbols-outlined text-5xl text-[#0058be]">electric_bolt</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-[#f3f4f5] rounded-lg p-4"><p className="text-[10px] font-bold text-slate-400 uppercase">{isVi ? 'Công suất' : 'Power Rating'}</p><p className="text-xl font-bold">{selected?.power || '-'} <span className="text-sm font-medium">kW</span></p></div>
                                <div className="bg-[#f3f4f5] rounded-lg p-4"><p className="text-[10px] font-bold text-slate-400 uppercase">{isVi ? 'Tốc độ định mức' : 'Rated Speed'}</p><p className="text-xl font-bold">{selected?.speed || '-'} <span className="text-sm font-medium">RPM</span></p></div>
                                <div className="bg-[#f3f4f5] rounded-lg p-4"><p className="text-[10px] font-bold text-slate-400 uppercase">Nom. Torque</p><p className="text-xl font-bold">{selected?.power && selected?.speed ? ((9550 * selected.power) / selected.speed).toFixed(1) : '-'} <span className="text-sm font-medium">Nm</span></p></div>
                                <div className="bg-[#f3f4f5] rounded-lg p-4"><p className="text-[10px] font-bold text-slate-400 uppercase">{isVi ? 'Hiệu suất' : 'Efficiency'}</p><p className="text-xl font-bold text-[#0058be]">{selected?.efficiency || '-'} <span className="text-sm font-medium">%</span></p></div>
                            </div>

                            <div className="mt-8 flex items-center justify-between border-t border-[#c2c6d6]/20 pt-6">
                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-lg">scale</span><span>{selected?.weight || '-'} kg</span></div>
                                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-lg">database</span><span>Frame: {selected?.frame || '-'}</span></div>
                                </div>
                                <button type="button" onClick={handleConfirmSelection} className="gradient-button text-white px-6 py-2.5 rounded-lg text-sm font-bold">{isVi ? 'Xác nhận lựa chọn' : 'Confirm Selection'}</button>
                            </div>
                            {confirmMessage ? <p className="mt-3 text-sm text-green-600 font-semibold">{confirmMessage}</p> : null}
                            {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
                        </section>

                        <section className="bg-white rounded-xl border border-[#c2c6d6]/20 overflow-hidden">
                            <div className="px-8 py-6 border-b border-[#c2c6d6]/20 flex justify-between items-center">
                                <h2 className="text-lg font-bold tracking-tight">{isVi ? 'Danh mục động cơ' : 'Motor Catalog'}</h2>
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
                                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isVi ? 'Công suất (kW)' : 'Power (kW)'}</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isVi ? 'Tốc độ định mức' : 'Rated Speed'}</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isVi ? 'Hiệu suất' : 'Efficiency'}</th>
                                            <th className="px-8 py-3 text-right" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#c2c6d6]/20">
                                        {motors.map((motor) => (
                                            <tr key={motor.id} className={`group hover:bg-slate-50 ${selectedMotor === motor.id ? 'bg-blue-50/40' : ''}`}>
                                                <td className="px-8 py-4"><div className="flex flex-col"><span className="font-bold">{motor.model}</span><span className="text-[10px] text-slate-400">{motor.series}</span></div></td>
                                                <td className="px-4 py-4 font-medium">{motor.power}</td>
                                                <td className="px-4 py-4 font-medium">{motor.speed} RPM</td>
                                                <td className="px-4 py-4"><span className="px-2 py-0.5 rounded-full bg-[#e1e3e4] text-[#0058be] text-[10px] font-bold">{motor.efficiency}%</span></td>
                                                <td className="px-8 py-4 text-right"><button onClick={() => handleSelectMotor(motor.id)} className="text-xs font-bold text-[#0058be] opacity-0 group-hover:opacity-100">{isVi ? 'Chọn' : 'Select'}</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <footer className="flex items-center justify-between mt-2">
                            <button onClick={onBack} className="flex items-center gap-2 px-6 py-3 rounded-lg border border-[#c2c6d6] text-sm font-semibold hover:bg-[#f3f4f5]"><span className="material-symbols-outlined text-sm">arrow_back</span>{isVi ? 'Quay lại bước 1' : 'Back to Parameters'}</button>
                            <button onClick={handleNextStep} disabled={!isStepSaved} className="flex items-center gap-2 px-8 py-3 rounded-lg gradient-button text-white font-bold shadow-lg shadow-[#0058be]/30 disabled:opacity-60 disabled:cursor-not-allowed">{isVi ? 'Sang bước thiết kế truyền động' : 'Next: Transmission Design'} <span className="material-symbols-outlined text-sm">arrow_forward</span></button>
                        </footer>
                    </div>

                    <div className="col-span-12 lg:col-span-4 space-y-6">
                        <section className="bg-white rounded-xl p-6 border border-[#c2c6d6]/20">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">{isVi ? 'Cấu hình hiện tại' : 'Current Config'}</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between"><span className="text-slate-500">Model</span><strong>{selected?.model}</strong></div>
                                <div className="flex justify-between"><span className="text-slate-500">Frame</span><strong>{selected?.frame}</strong></div>
                                <div className="flex justify-between"><span className="text-slate-500">{isVi ? 'Khối lượng' : 'Weight'}</span><strong>{selected?.weight} kg</strong></div>
                            </div>
                        </section>
                        <section className="bg-white rounded-xl p-6 border border-[#c2c6d6]/20">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">{isVi ? 'Gợi ý kỹ thuật' : 'Engineering Insights'}</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">{isVi ? 'Động cơ IE3 có thể tiết kiệm 20-25% điện năng so với dòng tiêu chuẩn và ổn định nhiệt tốt hơn khi tải liên tục.' : 'IE3 motors save 20-25% energy versus standard alternatives and improve thermal stability in continuous duty cycles.'}</p>
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
