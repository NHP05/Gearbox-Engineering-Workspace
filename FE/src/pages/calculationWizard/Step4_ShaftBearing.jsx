import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import WizardScaffold from './WizardScaffold';
import axiosClient from '../../api/axiosClient';
import { saveProjectDraft } from '../../services/projectDraft';
import {
    getWizardState,
    patchWizardState,
    invalidateFromStep,
    setStepSaved,
} from '../../utils/wizardState';
import { useLanguage } from '../../context/LanguageContext';

const BEARINGS = [
    { model: 'SKF 6207-2RS1', dims: '35 x 72 x 17 mm', dynamic: '27.0 kN', static: '15.3 kN', rpm: '11,000 r/min', tag: 'Deep Groove Ball Bearing' },
    { model: 'SKF 6307-2RS1', dims: '35 x 80 x 21 mm', dynamic: '35.1 kN', static: '19.0 kN', rpm: '10,000 r/min', tag: 'Optimized for Radial Load' },
    { model: 'FAG 6207-C3', dims: '35 x 72 x 17 mm', dynamic: '25.5 kN', static: '15.0 kN', rpm: '14,000 r/min', tag: 'High-Speed Optimized' },
];

const parseDims = (dims) => {
    const values = String(dims || '')
        .replace('mm', '')
        .split('x')
        .map((item) => Number(String(item).trim()))
        .filter((item) => Number.isFinite(item));

    return {
        dInner: values[0] || 35,
        dOuter: values[1] || 72,
        width: values[2] || 17,
    };
};

const parseStoredJson = (key, fallback = {}) => {
    try {
        const parsed = JSON.parse(localStorage.getItem(key) || '');
        return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch (error) {
        return fallback;
    }
};

const toPositiveNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const round = (value, digits = 2) => {
    const factor = 10 ** digits;
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
};

const getDynamicCapacityKN = (bearing) => Number(String(bearing?.dynamic || '0').replace(/[^\d.]/g, '')) || 0;

const evaluateLifeRatio = (actualLife, requiredLife) => {
    const ratio = actualLife / Math.max(1, requiredLife);
    if (ratio >= 1.2) return { code: 'excellent', vi: 'Rất tốt', en: 'Excellent' };
    if (ratio >= 1.0) return { code: 'pass', vi: 'Đạt', en: 'Pass' };
    if (ratio >= 0.75) return { code: 'low', vi: 'Thấp', en: 'Low' };
    return { code: 'poor', vi: 'Kém', en: 'Poor' };
};

const Step4ShaftBearing = ({ onNext, onBack }) => {
    const { language, t } = useLanguage();
    const isVi = language === 'vi';
    const numberLocale = isVi ? 'vi-VN' : 'en-US';
    const wizardState = getWizardState();

    const [selectedIndex, setSelectedIndex] = useState(Number(wizardState?.step4Result?.selectedBearingIndex || 1));
    const [loading, setLoading] = useState(false);
    const [savingDraft, setSavingDraft] = useState(false);
    const [draftMessage, setDraftMessage] = useState('');
    const [error, setError] = useState('');
    const [isStepSaved, setIsStepSaved] = useState(Boolean(wizardState?.stepSaved?.['4']));

    const step1Input = wizardState?.step1Input || parseStoredJson('step1_input', {});
    const selectedMotor = wizardState?.selectedMotor || parseStoredJson('step2_selected_motor', null);
    const step3Result = wizardState?.step3Result || parseStoredJson('step3_result', {});
    const step3Design = wizardState?.designState || parseStoredJson('step3_design_state', {});

    const requiredLifeHours = Math.round(toPositiveNumber(step1Input?.life, 20000));
    const powerInput = toPositiveNumber(step3Result?.input?.power || selectedMotor?.power || step1Input?.power, 15.5);
    const speedInput = toPositiveNumber(step3Result?.input?.n_motor || selectedMotor?.speed || step1Input?.speed, 1450);

    const moduleValue = toPositiveNumber(step3Result?.module || step3Design?.moduleValue, 2.5);
    const z1 = Math.round(toPositiveNumber(step3Result?.spur_teeth || step3Design?.spurTeeth, 24));
    const z2 = Math.round(toPositiveNumber(step3Result?.driven_teeth, z1 * 3));
    const beta = (step3Design?.gearMode === 'straight') ? 0 : toPositiveNumber(step3Result?.helix_angle || step3Design?.helixAngle, 20);
    const alpha = 20;

    const dw1 = moduleValue * z1;
    const dw2 = moduleValue * z2;

    const torqueInputNm = toPositiveNumber(step3Result?.torque_input_nm, (9550 * powerInput) / Math.max(1, speedInput));
    const torqueInputNmm = torqueInputNm * 1000;
    const betaRad = (beta * Math.PI) / 180;
    const alphaRad = (alpha * Math.PI) / 180;

    const FtIn = (2 * torqueInputNmm) / Math.max(1, dw1);
    const FrIn = FtIn * Math.tan(alphaRad) / Math.max(0.2, Math.cos(betaRad));
    const FaIn = FtIn * Math.tan(betaRad);

    const gearRatio = toPositiveNumber(step3Result?.spur_ratio, z2 / Math.max(1, z1));
    const efficiency = toPositiveNumber(step3Result?.efficiency_pct, 95) / 100;
    const torqueOutputNmm = torqueInputNmm * gearRatio * efficiency;
    const FtOut = (2 * torqueOutputNmm) / Math.max(1, dw2);
    const FrOut = FtOut * Math.tan(alphaRad) / Math.max(0.2, Math.cos(betaRad));
    const FaOut = FtOut * Math.tan(betaRad);

    const totalRatio = toPositiveNumber(step3Result?.total_ratio, gearRatio);
    const outputSpeed = toPositiveNumber(step3Result?.output_speed_rpm, speedInput / Math.max(1.01, totalRatio));
    const equivalentLoad = FrOut + 0.56 * FaOut;

    const bearingOptions = useMemo(() => {
        return BEARINGS.map((bearing) => {
            const dynamicKN = getDynamicCapacityKN(bearing);
            const dynamicN = dynamicKN * 1000;
            const lifeHours = (1e6 / Math.max(1, 60 * outputSpeed)) * Math.pow(dynamicN / Math.max(1, equivalentLoad), 3);
            const life = Math.round(lifeHours);
            const lifeStatus = evaluateLifeRatio(life, requiredLifeHours);

            return {
                ...bearing,
                dynamicKN,
                life,
                lifeStatus,
            };
        });
    }, [equivalentLoad, outputSpeed, requiredLifeHours]);

    const safeSelectedIndex = Math.min(Math.max(selectedIndex, 0), Math.max(0, bearingOptions.length - 1));
    const selectedBearing = bearingOptions[safeSelectedIndex] || bearingOptions[0] || BEARINGS[0];

    const dims = parseDims(selectedBearing?.dims);
    const inputDiameter = dims.dInner;
    const dMin = Math.cbrt((16 * torqueOutputNmm) / (Math.PI * 40));
    const standardDiameter = Math.ceil(dMin / 5) * 5;
    const outputDiameter = Math.max(standardDiameter, dims.dInner + 2);
    const inputLength = Math.round(120 + torqueInputNm * 0.2);
    const outputLength = Math.round(180 + torqueInputNm * 0.35);

    const inputFr = Math.round(FrIn);
    const inputFa = Math.round(FaIn);
    const outputFr = Math.round(FrOut);
    const outputFa = Math.round(FaOut);
    const selectedDynamicLoadN = Math.max(1, round((selectedBearing?.dynamicKN || 0) * 1000, 3));
    const equivalentLoadN = Math.max(1, round(equivalentLoad, 3));
    const lifeHoursCalculated = (1e6 / Math.max(1, 60 * outputSpeed)) * Math.pow(selectedDynamicLoadN / equivalentLoadN, 3);

    const step4ResultPayload = {
        status: 'Formula-based shaft analysis',
        input_torque_nm: round(torqueInputNm, 3),
        calculated_d_min: round(dMin, 3),
        standard_diameter_d: round(standardDiameter, 2),
        material_suggested: 'AISI 4140',
        selectedBearingIndex: safeSelectedIndex,
        selectedBearing: {
            ...selectedBearing,
            life_hours: selectedBearing?.life,
            life_status: selectedBearing?.lifeStatus?.code,
        },
        required_life_hours: requiredLifeHours,
        forces: {
            input: { Ft: round(FtIn, 3), Fr: round(FrIn, 3), Fa: round(FaIn, 3) },
            output: { Ft: round(FtOut, 3), Fr: round(FrOut, 3), Fa: round(FaOut, 3) },
        },
        pitch_diameter_input: round(dw1, 3),
        pitch_diameter_output: round(dw2, 3),
        input_shaft_length_mm: round(inputLength, 2),
        output_shaft_length_mm: round(outputLength, 2),
        output_shaft_diameter_mm: round(outputDiameter, 2),
        alpha,
        beta: round(beta, 3),
    };

    const persistStep4Result = (resultOverride = step4ResultPayload) => {
        localStorage.setItem('step4_result', JSON.stringify(resultOverride));
        patchWizardState({
            step4Result: resultOverride,
        });
    };

    const buildStep4ResultWithBackend = async () => {
        const nextResult = {
            ...step4ResultPayload,
            source: 'live-formula',
        };

        try {
            const response = await axiosClient.post('/calculate/shaft', {
                torque: torqueInputNm,
                momentX: outputFr,
                momentY: outputFa,
                materialName: 'AISI 4140',
            });

            const shaftResult = response?.data?.data || null;
            if (shaftResult && typeof shaftResult === 'object') {
                nextResult.calculated_d_min = toPositiveNumber(shaftResult.calculated_d_min, nextResult.calculated_d_min);
                nextResult.standard_diameter_d = toPositiveNumber(shaftResult.standard_diameter_d, nextResult.standard_diameter_d);
                nextResult.material_suggested = shaftResult.material_suggested || nextResult.material_suggested;
                nextResult.shaft_backend = shaftResult;
                nextResult.source = 'live-formula+api';
            }
        } catch (error) {
            // Keep local formula result if backend shaft endpoint is unavailable.
        }

        return nextResult;
    };

    const handleNext = async () => {
        if (!isStepSaved) {
            setError(t('wizard_save_required'));
            return;
        }

        setLoading(true);
        setError('');
        setDraftMessage('');
        try {
            const finalResult = await buildStep4ResultWithBackend();
            persistStep4Result(finalResult);
            onNext();
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDraft = async () => {
        setSavingDraft(true);
        setDraftMessage('');
        setError('');

        try {
            const finalResult = await buildStep4ResultWithBackend();
            persistStep4Result(finalResult);
            const result = await saveProjectDraft();
            setDraftMessage(result?.source === 'api' ? t('step4_draft_saved_api') : t('step4_draft_saved_local'));
            setStepSaved(4, true);
            setIsStepSaved(true);
        } catch {
            setError(t('step4_saving_error'));
        } finally {
            setSavingDraft(false);
        }
    };

    const handleSelectBearing = (index) => {
        setSelectedIndex(index);
        setIsStepSaved(false);
        invalidateFromStep(4);
        setDraftMessage('');
    };

    return (
        <WizardScaffold activeKey="shaft">
            <div className="p-8 space-y-8">
                <div>
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <span className="text-[10px] text-[#0058be] font-bold uppercase tracking-[0.2em] block mb-1">{t('step_of')} 04</span>
                            <h1 className="text-3xl font-bold tracking-tight">{t('step4_title')}</h1>
                        </div>
                        <span className="text-sm font-medium text-slate-500">80% {t('complete')}</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#edeeef] rounded-full overflow-hidden">
                        <div className="h-full w-4/5 bg-[#0058be]" />
                    </div>
                </div>

                <div className="flex justify-between items-end">
                    <div className="text-xs text-slate-500">
                        {t('step4_required_life_from_step1')}: <strong>{requiredLifeHours.toLocaleString(numberLocale)} h</strong>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onBack} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#495e8a] bg-[#e7e8e9] hover:bg-[#e1e3e4] flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">arrow_back</span>{t('previous_step')}</button>
                        <button
                            onClick={handleNext}
                            disabled={loading || !isStepSaved}
                            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white gradient-button flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? t('step4_calculating') : t('validate_next')}
                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                    <section className="col-span-12 lg:col-span-8 bg-white rounded-xl p-6 shadow-sm border border-[#c2c6d6]/20">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#0058be]">architecture</span>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">{t('step4_geometry_layout')}</h3>
                            </div>
                            <div className="flex gap-2"><span className="px-2 py-1 bg-[#0058be]/10 text-[#0058be] text-[10px] font-bold rounded">AISI 4140</span><span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded">alpha={alpha} deg</span></div>
                        </div>

                        <div className="relative h-64 bg-[#f3f4f5] rounded-lg flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#495e8a 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }} />
                            <div className="relative w-4/5 flex items-center">
                                <div className="relative flex-1 h-12 bg-slate-300 border-x border-slate-400 flex items-center justify-center">
                                    <span className="absolute -top-8 text-[10px] font-mono text-slate-500">O {inputDiameter.toFixed(1)} mm</span>
                                    <div className="w-full border-t border-dashed border-slate-500 absolute top-1/2" />
                                    <div className="h-16 w-12 bg-slate-400/50 mx-4 border border-slate-500/30 flex items-center justify-center"><span className="text-[9px] font-bold text-slate-600">INPUT</span></div>
                                    <span className="absolute -bottom-8 text-[10px] font-mono text-slate-500">L: {inputLength} mm</span>
                                </div>
                                <div className="w-1 bg-slate-400 h-20" />
                                <div className="relative flex-[1.5] h-16 bg-slate-300 border-x border-slate-400 flex items-center justify-center">
                                    <span className="absolute -top-8 text-[10px] font-mono text-slate-500">O {outputDiameter.toFixed(1)} mm</span>
                                    <div className="w-full border-t border-dashed border-slate-500 absolute top-1/2" />
                                    <div className="h-20 w-16 bg-slate-400/50 mx-6 border border-slate-500/30 flex items-center justify-center"><span className="text-[9px] font-bold text-slate-600">OUTPUT</span></div>
                                    <span className="absolute -bottom-8 text-[10px] font-mono text-slate-500">L: {outputLength} mm</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="col-span-12 lg:col-span-4 space-y-4">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#c2c6d6]/20">
                            <div className="flex items-center gap-3 mb-6"><span className="material-symbols-outlined text-[#924700]">analytics</span><h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">{t('step4_force_analysis')}</h3></div>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-center mb-2"><span className="text-[11px] font-bold text-slate-400 uppercase">{t('step4_input_shaft_loads')}</span><span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">Ft={round(FtIn, 1)} N</span></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-[#edeeef] p-3 rounded-lg"><p className="text-[10px] text-[#495e8a] font-bold mb-1">{t('step4_label_radial')}</p><p className="text-xl font-bold font-mono">{inputFr.toLocaleString(numberLocale)} <span className="text-xs font-normal">N</span></p></div>
                                        <div className="bg-[#edeeef] p-3 rounded-lg"><p className="text-[10px] text-[#495e8a] font-bold mb-1">{t('step4_label_axial')}</p><p className="text-xl font-bold font-mono">{inputFa.toLocaleString(numberLocale)} <span className="text-xs font-normal">N</span></p></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2"><span className="text-[11px] font-bold text-slate-400 uppercase">{t('step4_output_shaft_loads')}</span><span className="text-[10px] font-bold text-[#924700] bg-[#ffdcc6] px-2 py-0.5 rounded">Ft={round(FtOut, 1)} N</span></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-[#edeeef] p-3 rounded-lg border-l-4 border-[#924700]/40"><p className="text-[10px] text-[#495e8a] font-bold mb-1">{t('step4_label_radial')}</p><p className="text-xl font-bold font-mono">{outputFr.toLocaleString(numberLocale)} <span className="text-xs font-normal">N</span></p></div>
                                        <div className="bg-[#edeeef] p-3 rounded-lg"><p className="text-[10px] text-[#495e8a] font-bold mb-1">{t('step4_label_axial')}</p><p className="text-xl font-bold font-mono">{outputFa.toLocaleString(numberLocale)} <span className="text-xs font-normal">N</span></p></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#c2c6d6]/20">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">{t('step4_selected_bearing_preview')}</h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-[#f3f4f5] rounded-lg p-3">
                                    <p className="text-[10px] text-slate-500 uppercase">{t('step4_label_model')}</p>
                                    <p className="font-bold mt-1">{selectedBearing?.model}</p>
                                </div>
                                <div className="bg-[#f3f4f5] rounded-lg p-3">
                                    <p className="text-[10px] text-slate-500 uppercase">{t('step4_label_dims')}</p>
                                    <p className="font-bold mt-1">{selectedBearing?.dims}</p>
                                </div>
                                <div className="bg-[#f3f4f5] rounded-lg p-3">
                                    <p className="text-[10px] text-slate-500 uppercase">{t('step4_estimated_life')}</p>
                                    <p className="font-bold mt-1">{(selectedBearing?.life || 0).toLocaleString(numberLocale)} h</p>
                                </div>
                                <div className="bg-[#f3f4f5] rounded-lg p-3">
                                    <p className="text-[10px] text-slate-500 uppercase">{t('step4_load_match')}</p>
                                    <p className="font-bold mt-1">{isVi ? selectedBearing?.lifeStatus?.vi : selectedBearing?.lifeStatus?.en}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#c2c6d6]/20">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3">{t('step4_life_source_title')}</h3>
                            <p className="text-xs text-slate-500 mb-3">{t('step4_life_source_desc')}</p>
                            <div className="formula-scroll text-slate-700">
                                <math xmlns="http://www.w3.org/1998/Math/MathML" className="formula-math">
                                    <mrow>
                                        <msub><mi>L</mi><mn>10h</mn></msub><mo>=</mo>
                                        <mfrac>
                                            <msup><mn>10</mn><mn>6</mn></msup>
                                            <mrow><mn>60</mn><mo>&#x22C5;</mo><mi>n</mi></mrow>
                                        </mfrac>
                                        <mo>&#x22C5;</mo>
                                        <msup>
                                            <mrow><mo>(</mo><mfrac><mi>C</mi><mi>P</mi></mfrac><mo>)</mo></mrow>
                                            <mn>3</mn>
                                        </msup>
                                    </mrow>
                                </math>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">{t('step4_life_source_formula')}</p>
                            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-slate-50 rounded-lg p-3"><span className="text-[10px] uppercase text-slate-500">n</span><p className="font-bold">{round(outputSpeed, 1).toLocaleString(numberLocale)} rpm</p></div>
                                <div className="bg-slate-50 rounded-lg p-3"><span className="text-[10px] uppercase text-slate-500">C</span><p className="font-bold">{selectedDynamicLoadN.toLocaleString(numberLocale)} N</p></div>
                                <div className="bg-slate-50 rounded-lg p-3"><span className="text-[10px] uppercase text-slate-500">P</span><p className="font-bold">{equivalentLoadN.toLocaleString(numberLocale)} N</p></div>
                                <div className="bg-slate-50 rounded-lg p-3"><span className="text-[10px] uppercase text-slate-500">L10h</span><p className="font-bold">{Math.round(lifeHoursCalculated).toLocaleString(numberLocale)} h</p></div>
                            </div>
                            <p className="text-xs text-slate-500 mt-3">{t('step4_life_source_required')}: <strong>{requiredLifeHours.toLocaleString(numberLocale)} h</strong></p>
                        </div>
                    </section>

                    <section className="col-span-12 bg-white rounded-xl p-6 shadow-sm border border-[#c2c6d6]/20">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3"><span className="material-symbols-outlined text-[#0058be]">settings_backup_restore</span><h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">{t('step4_bearing_catalog')}</h3></div>
                            <span className="text-[11px] text-slate-400">{t('step4_required_life')}: {requiredLifeHours.toLocaleString(numberLocale)} h</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-separate border-spacing-y-2">
                                <thead>
                                    <tr className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                                        <th className="pb-3 pl-4">{t('step4_table_model_designation')}</th>
                                        <th className="pb-3">{t('step4_table_dimensions')}</th>
                                        <th className="pb-3 text-center">{t('step4_table_dynamic_load')}</th>
                                        <th className="pb-3 text-center">{t('step4_table_life_hours')}</th>
                                        <th className="pb-3 text-center">{t('step4_table_suitability')}</th>
                                        <th className="pb-3 text-right pr-4">{t('step4_table_selection')}</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {bearingOptions.map((row, index) => {
                                        const active = index === safeSelectedIndex;
                                        const toneClass = row.lifeStatus.code === 'excellent'
                                            ? 'text-green-700'
                                            : row.lifeStatus.code === 'pass'
                                                ? 'text-emerald-700'
                                                : row.lifeStatus.code === 'low'
                                                    ? 'text-amber-700'
                                                    : 'text-red-700';

                                        return (
                                            <tr key={row.model} className={`${active ? 'bg-[#d8e2ff]/40 ring-1 ring-[#0058be]/20' : 'bg-[#f3f4f5]/50 hover:bg-[#0058be]/5'} transition-colors`}>
                                                <td className="py-4 pl-4 rounded-l-xl"><div><p className={`font-bold ${active ? 'text-[#0058be]' : 'text-slate-900'}`}>{row.model}</p><p className={`text-[10px] mt-1 ${active ? 'text-[#0058be]/70' : 'text-slate-500'}`}>{row.tag}</p></div></td>
                                                <td className="py-4 text-xs font-mono text-slate-600">{row.dims}</td>
                                                <td className="py-4 text-center font-bold text-slate-700">{row.dynamic}</td>
                                                <td className="py-4 text-center font-bold text-slate-700">{row.life.toLocaleString(numberLocale)}</td>
                                                <td className={`py-4 text-center font-bold ${toneClass}`}>{isVi ? row.lifeStatus.vi : row.lifeStatus.en}</td>
                                                <td className="py-4 text-right pr-4 rounded-r-xl"><button onClick={() => handleSelectBearing(index)} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${active ? 'bg-[#0058be] text-white' : 'border border-[#0058be] text-[#0058be] hover:bg-[#0058be] hover:text-white'}`}>{active ? t('step4_selected') : t('step4_select')}</button></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                <div className="flex items-center justify-end gap-3">
                    <button type="button" onClick={handleSaveDraft} disabled={savingDraft} className="px-5 py-2.5 rounded-xl border border-[#c2c6d6] text-sm font-semibold hover:bg-[#f3f4f5] disabled:opacity-60">
                        {savingDraft ? t('saving') : t('save_draft')}
                    </button>
                </div>

                {draftMessage ? <div className="text-green-600 text-sm p-3 bg-green-50 rounded-lg">{draftMessage}</div> : null}
                {error ? <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg">{error}</div> : null}
            </div>
        </WizardScaffold>
    );
};

Step4ShaftBearing.propTypes = {
    onNext: PropTypes.func.isRequired,
    onBack: PropTypes.func.isRequired,
};

export default Step4ShaftBearing;
