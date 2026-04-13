import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import axiosClient from '../../api/axiosClient';
import WizardScaffold from './WizardScaffold';
import { saveProjectDraft } from '../../services/projectDraft';
import {
    getWizardState,
    patchWizardState,
    invalidateFromStep,
    setStepSaved,
} from '../../utils/wizardState';
import { useLanguage } from '../../context/LanguageContext';
import NumericStepperInput from '../../components/NumericStepperInput';

const Step1Motor = ({ onNext }) => {
    const { language, t } = useLanguage();
    const isVi = language === 'vi';
    const wizardState = getWizardState();
    const [inputs, setInputs] = useState({
        power: wizardState?.step1Input?.power ?? 15.5,
        speed: wizardState?.step1Input?.speed ?? 1450,
        loadType: wizardState?.step1Input?.loadType ?? 'constant',
        life: wizardState?.step1Input?.life ?? 20000,
    });
    const [loading, setLoading] = useState(false);
    const [savingDraft, setSavingDraft] = useState(false);
    const [error, setError] = useState('');
    const [draftMessage, setDraftMessage] = useState('');
    const [isStepSaved, setIsStepSaved] = useState(Boolean(wizardState?.stepSaved?.['1']));

    const preview = useMemo(() => {
        const power = Number(inputs.power) || 0;
        const speed = Number(inputs.speed) || 1;
        const torque = (9550 * power) / Math.max(speed, 1);
        const serviceFactor = inputs.loadType === 'fluctuating' ? 1.35 : 1.15;
        const estimatedModule = Math.max(2, Math.min(8, Math.sqrt(Math.abs(torque)) / 4));

        return {
            torque: torque.toFixed(1),
            serviceFactor: serviceFactor.toFixed(2),
            module: estimatedModule.toFixed(2),
        };
    }, [inputs]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        const nextInputs = {
            ...inputs,
            [name]: name === 'loadType' ? value : Number(value),
        };

        setInputs((prev) => ({
            ...prev,
            [name]: name === 'loadType' ? value : Number(value),
        }));

        patchWizardState({ step1Input: nextInputs });
        invalidateFromStep(1);
        setIsStepSaved(false);
    };

    const handleSaveDraft = async () => {
        setSavingDraft(true);
        setDraftMessage('');
        setError('');

        const latestState = getWizardState();
        const currentProjectId = String(localStorage.getItem('current_project') || '').trim();
        let projectName = String(latestState?.meta?.projectName || '').trim();

        if (!currentProjectId && !projectName) {
            const projectNameInput = window.prompt(t('dashboard_prompt_project_name_required'), '');
            if (projectNameInput === null) {
                setSavingDraft(false);
                return;
            }

            projectName = String(projectNameInput || '').trim();
            if (!projectName) {
                setSavingDraft(false);
                setError(t('dashboard_project_name_required'));
                return;
            }

            patchWizardState({
                meta: {
                    projectName,
                },
            });
        }

        patchWizardState({ step1Input: inputs });

        try {
            const result = await saveProjectDraft();
            setDraftMessage(result?.source === 'api' ? 'Da luu draft len he thong.' : 'Da luu draft local (offline mode).');
            setStepSaved(1, true);
            setIsStepSaved(true);
        } catch (err) {
            if (err?.code === 'PROJECT_NAME_REQUIRED') {
                setError(t('dashboard_project_name_required'));
            } else {
                setError('Khong the luu draft. Vui long thu lai.');
            }
        } finally {
            setSavingDraft(false);
        }
    };

    const handleNext = async () => {
        if (!isStepSaved) {
            setError(t('wizard_save_required'));
            return;
        }

        setLoading(true);
        setError('');
        setDraftMessage('');
        patchWizardState({ step1Input: inputs });

        try {
            const response = await axiosClient.post('/motor/calculate', {
                ...inputs,
                efficiencies: {
                    belt: 0.95,
                    gear: 0.97,
                    bearing: 0.99,
                },
            });

            const step1Result = response?.data?.data || response?.data || {};
            // Lưu kết quả vào localStorage để step tiếp theo dùng
            localStorage.setItem('step1_result', JSON.stringify(step1Result));
            patchWizardState({ step1Result });
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
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0058be] block mb-1">{t('step_of')} 1/5</span>
                                <h1 className="text-3xl font-extrabold tracking-tight text-[#191c1d]">{t('step1_title')}</h1>
                            </div>
                            <span className="text-sm font-medium text-slate-500">20% {t('complete')}</span>
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
                                            <label htmlFor="power" className="text-sm font-semibold text-[#191c1d]">{isVi ? 'Công suất đầu vào (P)' : 'Input Power (P)'}</label>
                                            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{isVi ? 'Bắt buộc' : 'Required'}</span>
                                        </div>
                                        <NumericStepperInput
                                            id="power"
                                            name="power"
                                            value={inputs.power}
                                            onChange={handleChange}
                                            min={0.1}
                                            step={0.1}
                                            suffix="kW"
                                            inputClassName="w-full bg-[#f8f9fa] border-none rounded-lg py-3 px-4 focus:ring-2 focus:ring-[#0058be]/30"
                                        />
                                        <p className="text-[11px] text-slate-500 italic">{isVi ? 'Khoảng khuyến nghị: 0.5 - 500 kW' : 'Recommended range: 0.5 - 500 kW'}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="speed" className="text-sm font-semibold text-[#191c1d]">{isVi ? 'Tốc độ đầu vào (n)' : 'Input Speed (n)'}</label>
                                        <NumericStepperInput
                                            id="speed"
                                            name="speed"
                                            value={inputs.speed}
                                            onChange={handleChange}
                                            min={1}
                                            step={1}
                                            suffix="RPM"
                                            inputClassName="w-full bg-[#f8f9fa] border-none rounded-lg py-3 px-4 focus:ring-2 focus:ring-[#0058be]/30"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-sm font-semibold text-[#191c1d]">{isVi ? 'Đặc tính tải' : 'Load Characteristic'}</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <label className={`relative p-4 bg-[#f8f9fa] rounded-xl border-2 cursor-pointer ${inputs.loadType === 'constant' ? 'border-[#0058be]' : 'border-transparent'}`}>
                                                <input type="radio" name="loadType" value="constant" checked={inputs.loadType === 'constant'} onChange={handleChange} className="hidden" />
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="material-symbols-outlined text-[#0058be]">bolt</span>
                                                    <span className="text-sm font-bold">{isVi ? 'Tải đều' : 'Constant'}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500">{isVi ? 'Mô-men ổn định, dao động thấp. Phù hợp quạt hoặc bơm.' : 'Uniform torque with minimal variations. Ideal for fans or pumps.'}</p>
                                            </label>

                                            <label className={`relative p-4 bg-[#f8f9fa] rounded-xl border-2 cursor-pointer ${inputs.loadType === 'fluctuating' ? 'border-[#0058be]' : 'border-transparent'}`}>
                                                <input type="radio" name="loadType" value="fluctuating" checked={inputs.loadType === 'fluctuating'} onChange={handleChange} className="hidden" />
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="material-symbols-outlined text-slate-400">waves</span>
                                                    <span className="text-sm font-bold">{isVi ? 'Tải dao động' : 'Fluctuating'}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500">{isVi ? 'Mô-men thay đổi kèm va đập. Phù hợp máy nghiền, máy đào.' : 'Variable torque with shocks. Suitable for crushers or excavators.'}</p>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="life" className="text-sm font-semibold text-[#191c1d]">{isVi ? 'Tuổi thọ thiết kế (L)' : 'Design Lifetime (L)'}</label>
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
                                            <NumericStepperInput
                                                id="life"
                                                name="life"
                                                value={inputs.life}
                                                onChange={handleChange}
                                                min={1000}
                                                max={50000}
                                                step={1000}
                                                suffix="HRS"
                                                className="w-40"
                                                inputClassName="w-full bg-[#f8f9fa] border-none rounded-lg py-2 px-3 text-sm font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-6 flex items-center justify-between border-t border-[#c2c6d6]/20">
                                        <button type="button" onClick={handleSaveDraft} disabled={savingDraft} className="text-sm font-bold text-slate-400 hover:text-[#191c1d] disabled:opacity-60">
                                            {savingDraft ? (isVi ? 'Đang lưu...' : 'Saving...') : t('save_draft')}
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={handleNext}
                                            disabled={loading || !isStepSaved}
                                            className="gradient-button text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#0058be]/20 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? 'Đang tính toán...' : (isVi ? 'Sang cấu hình tiếp' : 'Next Configuration')}
                                        </button>
                                    </div>
                                    {draftMessage && <div className="text-green-600 text-sm p-3 bg-green-50 rounded-lg">{draftMessage}</div>}
                                    {error && <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg">{error}</div>}
                                </form>
                            </div>
                        </div>

                        <div className="md:col-span-4 space-y-6">
                            <div className="bg-white rounded-xl p-6 border border-[#c2c6d6]/20">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">{isVi ? 'Gợi ý thiết kế' : 'Design Tips'}</h3>
                                <div className="space-y-3">
                                    <div className="p-3 bg-[#f3f4f5] rounded-lg">
                                        <p className="text-xs font-bold">{isVi ? 'Tỷ số hiệu suất' : 'Efficiency Ratio'}</p>
                                        <p className="text-[11px] text-slate-500 mt-1">{isVi ? 'Nên dùng bôi trơn tổng hợp khi tốc độ trên 3000 RPM.' : 'Use synthetic lubrication for speed above 3000 RPM.'}</p>
                                    </div>
                                    <div className="p-3 bg-[#f3f4f5] rounded-lg">
                                        <p className="text-xs font-bold">{isVi ? 'Tiêu chuẩn áp dụng' : 'Standard Compliance'}</p>
                                        <p className="text-[11px] text-slate-500 mt-1">{isVi ? 'Tính theo giả định AGMA 2001-D04.' : 'Calculated using AGMA 2001-D04 assumptions.'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-6 border border-[#c2c6d6]/20">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">{isVi ? 'Xem nhanh tính toán' : 'Calculation Preview'}</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between"><span>{isVi ? 'Mô-men ước tính' : 'Torque Est.'}</span><strong>{preview.torque} Nm</strong></div>
                                    <div className="flex justify-between"><span>{isVi ? 'Hệ số tải' : 'Service Factor'}</span><strong>{preview.serviceFactor}</strong></div>
                                    <div className="flex justify-between"><span>{isVi ? 'Mô-đun ước tính' : 'Estimated Module'}</span><strong>{preview.module} m</strong></div>
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
