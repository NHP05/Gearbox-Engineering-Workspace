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
import NumericStepperInput from '../../components/NumericStepperInput';

const MODULE_OPTIONS = [1.5, 2, 2.5, 3, 4, 5, 6];
const BELT_SLIP_FACTOR = 0.015;

const toPositiveNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const round = (value, digits = 2) => {
    const factor = 10 ** digits;
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
};

const parseStoredJson = (key, fallback = {}) => {
    try {
        const parsed = JSON.parse(localStorage.getItem(key) || '');
        return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch (error) {
        return fallback;
    }
};

const Step3TransmissionDesign = ({ onNext, onBack }) => {
    const { language, t } = useLanguage();
    const isVi = language === 'vi';
    const wizardState = getWizardState();
    const step1Input = wizardState?.step1Input || parseStoredJson('step1_input', {});
    const step1Result = wizardState?.step1Result || parseStoredJson('step1_result', {});
    const step1Data = step1Result?.data || step1Result || {};
    const selectedMotor = wizardState?.selectedMotor || parseStoredJson('step2_selected_motor', null);
    const designState = wizardState?.designState || {};

    const defaultPower = toPositiveNumber(
        selectedMotor?.power
        || step1Data?.required_power
        || step1Input?.power,
        15.5
    );
    const defaultSpeed = toPositiveNumber(
        selectedMotor?.speed
        || step1Data?.suggested_motor?.speed_rpm
        || step1Input?.speed,
        1440
    );

    const hasPersistedStep3 = Boolean(wizardState?.step3Result || localStorage.getItem('step3_result'));
    const seededInputs = hasPersistedStep3
        ? {
            power: toPositiveNumber(wizardState?.step3Input?.power, defaultPower),
            speed: toPositiveNumber(wizardState?.step3Input?.speed, defaultSpeed),
            uBelt: toPositiveNumber(wizardState?.step3Input?.uBelt, 3),
            d1: toPositiveNumber(wizardState?.step3Input?.d1, 120),
        }
        : {
            power: defaultPower,
            speed: defaultSpeed,
            uBelt: toPositiveNumber(wizardState?.step3Input?.uBelt, 3),
            d1: toPositiveNumber(wizardState?.step3Input?.d1, 120),
        };

    const [inputs, setInputs] = useState({
        power: seededInputs.power,
        speed: seededInputs.speed,
        uBelt: seededInputs.uBelt,
        d1: seededInputs.d1,
    });
    const [spurTeeth, setSpurTeeth] = useState(designState?.spurTeeth || 24);
    const [faceWidth, setFaceWidth] = useState(designState?.faceWidth || 25);
    const [gearMode, setGearMode] = useState(designState?.gearMode || 'spiral');
    const [bevelAngle, setBevelAngle] = useState(designState?.bevelAngle || 90);
    const [moduleValue, setModuleValue] = useState(toPositiveNumber(designState?.moduleValue, 2.5));
    const [helixAngle, setHelixAngle] = useState(toPositiveNumber(designState?.helixAngle, 20));
    const [lastResult, setLastResult] = useState(() => JSON.parse(localStorage.getItem('step3_result') || 'null'));
    const [loading, setLoading] = useState(false);
    const [savingDraft, setSavingDraft] = useState(false);
    const [draftMessage, setDraftMessage] = useState('');
    const [error, setError] = useState('');
    const [isStepSaved, setIsStepSaved] = useState(Boolean(wizardState?.stepSaved?.['3']));

    const markStepUnsaved = () => {
        setIsStepSaved(false);
        invalidateFromStep(3);
        setDraftMessage('');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const numericFields = ['power', 'speed', 'uBelt', 'd1'];
        const nextValue = numericFields.includes(name) ? Number(value) : value;
        const nextInputs = {
            ...inputs,
            [name]: nextValue,
        };

        setInputs(prev => ({
            ...prev,
            [name]: nextValue,
        }));

        patchWizardState({
            step3Input: nextInputs,
        });
        markStepUnsaved();
    };

    const handleNumericEnter = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
        }
    };

    const effectiveHelixAngle = gearMode === 'straight' ? 0 : clamp(Number(helixAngle) || 20, 8, 35);
    const d1Value = toPositiveNumber(inputs.d1, 120);
    const ratioDesign = toPositiveNumber(inputs.uBelt, 3);
    const speedValue = toPositiveNumber(inputs.speed, 1450);
    const powerValue = toPositiveNumber(inputs.power, 15.5);
    const loadType = step1Input?.loadType || 'constant';
    const serviceFactor = loadType === 'fluctuating' ? 1.35 : 1.15;
    const effectivePower = powerValue * serviceFactor;

    const d2Theoretical = ratioDesign * d1Value * (1 - BELT_SLIP_FACTOR);
    const d2Standard = Math.max(80, Math.round(d2Theoretical / 5) * 5);
    const ratioActual = d2Standard / Math.max(1, d1Value * (1 - BELT_SLIP_FACTOR));
    const ratioErrorPct = (Math.abs(ratioDesign - ratioActual) / Math.max(0.001, ratioDesign)) * 100;

    const drivenTeeth = Math.max(spurTeeth + 8, Math.round(spurTeeth * ratioActual));
    const spurRatio = drivenTeeth / Math.max(1, spurTeeth);
    const totalRatio = ratioActual * spurRatio;
    const outputSpeed = speedValue / Math.max(1.01, totalRatio);
    const inputTorque = (9550 * effectivePower) / Math.max(1, speedValue);
    const efficiencyDisplay = clamp(97.2 - ratioErrorPct * 0.4 - (effectiveHelixAngle - 20) * 0.03 - (gearMode === 'spiral' ? 0.1 : 0.35), 88, 98.5);
    const safetyDisplay = clamp(1.05 + (faceWidth / (moduleValue * 20)) + (gearMode === 'spiral' ? 0.12 : 0) - ratioErrorPct / 22, 0.95, 2.8);
    const mountDistance = (d1Value + d2Standard) * 0.55 + faceWidth * 0.6;

    const computedStep3Result = {
        belt_type: powerValue > 20 ? 'C' : powerValue > 5 ? 'B' : 'A',
        d1: round(d1Value, 2),
        d2: round(d2Standard, 2),
        distance_a: round(mountDistance, 2),
        velocity: round((Math.PI * d1Value * speedValue) / 60000, 3),
        belt_ratio_design: round(ratioDesign, 4),
        belt_ratio_actual: round(ratioActual, 4),
        belt_ratio_error_pct: round(ratioErrorPct, 3),
        belt_ratio_valid: ratioErrorPct <= 4,
        spur_teeth: Math.round(spurTeeth),
        driven_teeth: Math.round(drivenTeeth),
        spur_ratio: round(spurRatio, 4),
        total_ratio: round(totalRatio, 4),
        module: round(moduleValue, 2),
        helix_angle: round(effectiveHelixAngle, 2),
        face_width: round(faceWidth, 2),
        efficiency_pct: round(efficiencyDisplay, 3),
        torque_input_nm: round(inputTorque, 3),
        torque_output_nm: round(inputTorque * totalRatio * (efficiencyDisplay / 100), 3),
        output_speed_rpm: round(outputSpeed, 3),
        pitch_diameter_pinion: round(moduleValue * spurTeeth, 3),
        pitch_diameter_gear: round(moduleValue * drivenTeeth, 3),
        safety_factor_est: round(safetyDisplay, 3),
        load_type: loadType,
        service_factor: round(serviceFactor, 3),
        effective_input_power_kw: round(effectivePower, 3),
        selected_motor: selectedMotor || null,
        input: {
            power: round(powerValue, 3),
            effective_power: round(effectivePower, 3),
            n_motor: round(speedValue, 3),
            u_belt: round(ratioDesign, 4),
        },
        source: 'live-formula',
    };

    const persistStep3Data = (resultOverride = computedStep3Result) => {
        const savedDesignState = {
            spurTeeth,
            faceWidth,
            gearMode,
            bevelAngle,
            moduleValue,
            helixAngle: effectiveHelixAngle,
        };

        setLastResult(resultOverride);
        localStorage.setItem('step3_result', JSON.stringify(resultOverride));
        localStorage.setItem('step3_design_state', JSON.stringify(savedDesignState));
        patchWizardState({
            step3Result: resultOverride,
            step3Input: {
                power: powerValue,
                speed: speedValue,
                uBelt: ratioDesign,
                d1: d1Value,
            },
            designState: savedDesignState,
        });
    };

    const buildStep3ResultWithBackend = async () => {
        const nextResult = {
            ...computedStep3Result,
            source: 'live-formula',
        };

        try {
            const response = await axiosClient.post('/calculate/belt', {
                power: powerValue,
                n1: speedValue,
                uBelt: ratioDesign,
                d1: d1Value,
            });

            const beltResult = response?.data?.data || null;
            if (beltResult && typeof beltResult === 'object') {
                nextResult.belt_type = beltResult.belt_type || nextResult.belt_type;
                nextResult.d1 = toPositiveNumber(beltResult.d1, nextResult.d1);
                nextResult.d2 = toPositiveNumber(beltResult.d2, nextResult.d2);
                nextResult.distance_a = toPositiveNumber(beltResult.distance_a, nextResult.distance_a);
                nextResult.velocity = toPositiveNumber(beltResult.velocity, nextResult.velocity);
                nextResult.belt_backend = beltResult;
                nextResult.source = 'live-formula+api';
            }
        } catch (error) {
            // Keep local formula result if backend belt endpoint is unavailable.
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
            const finalResult = await buildStep3ResultWithBackend();
            persistStep3Data(finalResult);
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
            const finalResult = await buildStep3ResultWithBackend();
            persistStep3Data(finalResult);
            const result = await saveProjectDraft();
            setDraftMessage(result?.source === 'api' ? 'Da luu draft len he thong.' : 'Da luu draft local (offline mode).');
            setStepSaved(3, true);
            setIsStepSaved(true);
        } catch (err) {
            setError(t('step3_saving_error'));
        } finally {
            setSavingDraft(false);
        }
    };

    const ratioDisplay = round(totalRatio, 2).toFixed(2);
    const pcdDisplay = round(d2Standard, 2).toFixed(2);
    const speedDisplay = round(speedValue, 0).toFixed(0);

    return (
        <WizardScaffold activeKey="transmission">
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <span className="text-[10px] font-black tracking-widest text-[#495e8a] uppercase block mb-1">{isVi ? 'Cấu hình wizard' : 'Wizard Configuration'}</span>
                                <h1 className="text-2xl font-extrabold tracking-tight">{t('step3_title')}</h1>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-bold text-[#0058be] block">{t('step_of')} 03/05</span>
                                <span className="text-xs text-slate-500 font-medium">{t('step3_core_geometry')}</span>
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
                                        <h3 className="font-bold tracking-tight">{t('step3_belt_title')}</h3>
                                        <p className="text-xs text-slate-500">{t('step3_belt_desc')}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="pwr" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('step3_input_power')}</label>
                                        <NumericStepperInput
                                            id="pwr"
                                            name="power"
                                            value={inputs.power}
                                            onChange={handleChange}
                                            onKeyDown={handleNumericEnter}
                                            min={0.1}
                                            step={0.1}
                                            inputClassName="w-full bg-[#edeeef] border-none rounded-lg p-3 text-sm font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="spd" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('step3_input_speed')}</label>
                                        <NumericStepperInput
                                            id="spd"
                                            name="speed"
                                            value={inputs.speed}
                                            onChange={handleChange}
                                            onKeyDown={handleNumericEnter}
                                            min={1}
                                            step={1}
                                            inputClassName="w-full bg-[#edeeef] border-none rounded-lg p-3 text-sm font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="ratio" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('step3_design_ratio')}</label>
                                        <NumericStepperInput
                                            id="ratio"
                                            name="uBelt"
                                            value={inputs.uBelt}
                                            onChange={handleChange}
                                            onKeyDown={handleNumericEnter}
                                            min={1}
                                            step={0.01}
                                            inputClassName="w-full bg-[#edeeef] border-none rounded-lg p-3 text-sm font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="d1" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('step3_small_pulley')}</label>
                                        <NumericStepperInput
                                            id="d1"
                                            name="d1"
                                            value={inputs.d1}
                                            onChange={handleChange}
                                            onKeyDown={handleNumericEnter}
                                            min={60}
                                            step={1}
                                            inputClassName="w-full bg-[#edeeef] border-none rounded-lg p-3 text-sm font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
                                    <div className="rounded-lg bg-[#f3f4f5] px-3 py-2">
                                        <p className="font-bold text-slate-500">{t('step3_formula_d2')}</p>
                                        <div className="mt-1">
                                            <math xmlns="http://www.w3.org/1998/Math/MathML" className="formula-math">
                                                <mrow>
                                                    <msub><mi>d</mi><mn>2</mn></msub><mo>=</mo><mi>u</mi><mo>&#x22C5;</mo><msub><mi>d</mi><mn>1</mn></msub><mo>&#x22C5;</mo><mo>(</mo><mn>1</mn><mo>-</mo><mi>e</mi><mo>)</mo>
                                                </mrow>
                                            </math>
                                        </div>
                                        <p className="text-slate-700 mt-1">d2 = {pcdDisplay} mm</p>
                                    </div>
                                    <div className="rounded-lg bg-[#f3f4f5] px-3 py-2">
                                        <p className="font-bold text-slate-500">{t('step3_formula_ut')}</p>
                                        <div className="mt-1">
                                            <math xmlns="http://www.w3.org/1998/Math/MathML" className="formula-math">
                                                <mrow>
                                                    <msub><mi>u</mi><mi>t</mi></msub><mo>=</mo>
                                                    <mfrac>
                                                        <msub><mi>d</mi><mn>2</mn></msub>
                                                        <mrow><msub><mi>d</mi><mn>1</mn></msub><mo>&#x22C5;</mo><mo>(</mo><mn>1</mn><mo>-</mo><mi>e</mi><mo>)</mo></mrow>
                                                    </mfrac>
                                                </mrow>
                                            </math>
                                        </div>
                                        <p className="text-slate-700 mt-1">u_t = {round(ratioActual, 4)}</p>
                                    </div>
                                    <div className="rounded-lg bg-[#f3f4f5] px-3 py-2">
                                        <p className="font-bold text-slate-500">{t('step3_ratio_error')}</p>
                                        <div className="mt-1">
                                            <math xmlns="http://www.w3.org/1998/Math/MathML" className="formula-math">
                                                <mrow>
                                                    <mi>&#x0394;</mi><mi>u</mi><mo>=</mo>
                                                    <mfrac>
                                                        <mrow><mo>|</mo><mi>u</mi><mo>-</mo><msub><mi>u</mi><mi>t</mi></msub><mo>|</mo></mrow>
                                                        <mi>u</mi>
                                                    </mfrac>
                                                    <mo>&#x22C5;</mo><mn>100</mn><mo>%</mo>
                                                </mrow>
                                            </math>
                                        </div>
                                        <p className="text-slate-700 mt-1">{round(ratioErrorPct, 3)}% {ratioErrorPct <= 4 ? t('step3_pass') : t('step3_check')}</p>
                                    </div>
                                </div>
                            </section>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-[#c2c6d6]/20">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-sm flex items-center gap-2"><span className="material-symbols-outlined text-[#495e8a]">settings_suggest</span>{t('step3_spur_set')}</h3>
                                        <select value={moduleValue} onChange={(event) => { setModuleValue(toPositiveNumber(event.target.value, 2.5)); markStepUnsaved(); }} className="bg-[#0058be]/10 text-[#0058be] px-2 py-1 rounded text-[10px] font-bold border border-[#0058be]/20">
                                            {MODULE_OPTIONS.map((item) => (
                                                <option key={item} value={item}>MODULE {item}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1"><span>{t('step3_teeth_count')}</span><span>{spurTeeth} / {drivenTeeth}</span></div>
                                            <input className="w-full h-1 accent-[#0058be]" type="range" min="18" max="42" step="1" value={spurTeeth} onChange={(event) => { setSpurTeeth(Number(event.target.value)); markStepUnsaved(); }} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 bg-[#f8f9fa] rounded-lg">
                                                <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">{t('step3_face_width')}</p>
                                                <input type="range" min="18" max="45" step="1" value={faceWidth} onChange={(event) => { setFaceWidth(Number(event.target.value)); markStepUnsaved(); }} className="w-full h-1 accent-[#0058be] mb-2" />
                                                <p className="text-sm font-bold">{faceWidth.toFixed(1)} mm</p>
                                            </div>
                                            <div className="p-3 bg-[#f8f9fa] rounded-lg">
                                                <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">{t('step3_helix_angle')}</p>
                                                <NumericStepperInput
                                                    name="helixAngle"
                                                    min={0}
                                                    max={35}
                                                    step={0.5}
                                                    value={gearMode === 'straight' ? 0 : helixAngle}
                                                    disabled={gearMode === 'straight'}
                                                    onChange={(event) => { setHelixAngle(toPositiveNumber(event.target.value, 20)); markStepUnsaved(); }}
                                                    inputClassName="w-full bg-white border border-slate-300 rounded p-2 text-sm font-bold disabled:bg-slate-200"
                                                />
                                                <p className="text-[10px] text-slate-500 mt-1">{gearMode === 'straight' ? '0.0 deg (Straight)' : `${round(helixAngle, 1)} deg`}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-xl shadow-sm border border-[#c2c6d6]/20">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-sm flex items-center gap-2"><span className="material-symbols-outlined text-[#495e8a]">change_history</span>{t('step3_bevel_set')}</h3>
                                        <span className="bg-[#924700]/5 px-2 py-0.5 rounded text-[10px] font-bold text-[#924700]">{bevelAngle}° ANGLE</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="p-3 bg-[#f8f9fa] rounded-lg border-l-2 border-[#0058be]">
                                            <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">{t('step3_mounting_distance')}</p>
                                            <div className="flex items-center justify-between"><p className="text-sm font-bold">{mountDistance} mm</p><span className="material-symbols-outlined text-xs text-slate-400">info</span></div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1"><span>{t('step3_bevel_angle')}</span><span>{bevelAngle}°</span></div>
                                            <input className="w-full h-1 accent-[#0058be]" type="range" min="45" max="120" step="1" value={bevelAngle} onChange={(event) => { setBevelAngle(Number(event.target.value)); markStepUnsaved(); }} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => { setGearMode('straight'); setHelixAngle(0); markStepUnsaved(); }} className={`flex-1 py-2 rounded-lg text-xs font-bold border border-[#c2c6d6]/40 ${gearMode === 'straight' ? 'bg-[#0058be] text-white' : 'bg-[#f8f9fa]'}`}>{t('step3_straight')}</button>
                                            <button type="button" onClick={() => { setGearMode('spiral'); setHelixAngle((prev) => clamp(prev || 20, 8, 35)); markStepUnsaved(); }} className={`flex-1 py-2 rounded-lg text-xs font-bold border border-[#c2c6d6]/40 ${gearMode === 'spiral' ? 'bg-[#0058be] text-white' : 'bg-[#f8f9fa]'}`}>{t('step3_spiral')}</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-12 lg:col-span-5 space-y-8">
                            <div className="p-8 rounded-2xl shadow-xl border border-white/50 bg-white/80 backdrop-blur-lg sticky top-24">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-[12px] font-extrabold uppercase">{t('step3_calculated_output')}</h2>
                                    <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /><span className="text-[10px] font-bold text-green-600">{t('step3_live_sync')}</span></div>
                                </div>
                                <div className="space-y-6">
                                    <div className="pb-6 border-b border-[#c2c6d6]/30">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{t('step3_total_ratio')}</p>
                                        <div className="flex items-baseline gap-2"><span className="text-5xl font-black text-[#0058be]">{ratioDisplay}</span><span className="text-lg font-bold text-[#495e8a]">: 1</span></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-[#f3f4f5] rounded-xl"><p className="text-[9px] font-black text-slate-500 uppercase mb-1">PCD (mm)</p><p className="text-xl font-bold">{pcdDisplay}</p></div>
                                        <div className="p-4 bg-[#f3f4f5] rounded-xl"><p className="text-[9px] font-black text-slate-500 uppercase mb-1">{t('step3_efficiency')}</p><p className="text-xl font-bold">{round(efficiencyDisplay, 2)}</p></div>
                                        <div className="p-4 bg-[#f3f4f5] rounded-xl"><p className="text-[9px] font-black text-slate-500 uppercase mb-1">{t('step3_safety_factor')}</p><p className="text-xl font-bold">{round(safetyDisplay, 2)}</p></div>
                                        <div className="p-4 bg-[#f3f4f5] rounded-xl"><p className="text-[9px] font-black text-slate-500 uppercase mb-1">{t('step3_input_speed_short')}</p><p className="text-xl font-bold">{speedDisplay}</p></div>
                                        <div className="p-4 bg-[#f3f4f5] rounded-xl"><p className="text-[9px] font-black text-slate-500 uppercase mb-1">{t('step3_output_speed_short')}</p><p className="text-xl font-bold">{round(outputSpeed, 1)}</p></div>
                                        <div className="p-4 bg-[#f3f4f5] rounded-xl"><p className="text-[9px] font-black text-slate-500 uppercase mb-1">Δu (%)</p><p className="text-xl font-bold">{round(ratioErrorPct, 3)}</p></div>
                                    </div>
                                    <div className="rounded-xl border border-[#c2c6d6]/40 bg-white p-4 text-xs leading-6">
                                        <p className="font-bold text-slate-700 uppercase tracking-wider mb-1">{t('step3_formula_basis')}</p>
                                        <div className="space-y-2 text-slate-700">
                                            <div>
                                                <p className="formula-caption mb-1">{t('step3_formula_d2')}</p>
                                                <math xmlns="http://www.w3.org/1998/Math/MathML" className="formula-math"><mrow><msub><mi>d</mi><mn>2</mn></msub><mo>=</mo><mi>u</mi><mo>&#x22C5;</mo><msub><mi>d</mi><mn>1</mn></msub><mo>&#x22C5;</mo><mo>(</mo><mn>1</mn><mo>-</mo><mi>e</mi><mo>)</mo></mrow></math>
                                            </div>
                                            <div>
                                                <p className="formula-caption mb-1">{t('step3_formula_ut')}</p>
                                                <math xmlns="http://www.w3.org/1998/Math/MathML" className="formula-math"><mrow><msub><mi>u</mi><mi>t</mi></msub><mo>=</mo><mfrac><msub><mi>d</mi><mn>2</mn></msub><mrow><msub><mi>d</mi><mn>1</mn></msub><mo>&#x22C5;</mo><mo>(</mo><mn>1</mn><mo>-</mo><mi>e</mi><mo>)</mo></mrow></mfrac></mrow></math>
                                            </div>
                                            <div>
                                                <p className="formula-caption mb-1">{t('step3_formula_delta')}</p>
                                                <math xmlns="http://www.w3.org/1998/Math/MathML" className="formula-math"><mrow><mi>&#x0394;</mi><mi>u</mi><mo>=</mo><mfrac><mrow><mo>|</mo><mi>u</mi><mo>-</mo><msub><mi>u</mi><mi>t</mi></msub><mo>|</mo></mrow><mi>u</mi></mfrac><mo>&#x22C5;</mo><mn>100</mn><mo>%</mo></mrow></math>
                                            </div>
                                            <div className="formula-scroll">
                                                <p className="formula-caption mb-1">{t('step3_formula_t1')}</p>
                                                <math xmlns="http://www.w3.org/1998/Math/MathML" className="formula-math"><mrow><msub><mi>T</mi><mn>1</mn></msub><mo>=</mo><mfrac><mrow><mn>9550</mn><mo>&#x22C5;</mo><mi>P</mi><mo>&#x22C5;</mo><msub><mi>K</mi><mtext>service</mtext></msub></mrow><mi>n</mi></mfrac></mrow></math>
                                                <p className="text-slate-600">Kservice = {serviceFactor}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 pt-8 border-t border-[#c2c6d6]/30 flex justify-between items-center">
                        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-[#191c1d] text-sm font-bold"><span className="material-symbols-outlined text-lg">arrow_back</span>{t('previous_step')}</button>
                        <div className="flex gap-4">
                            <button type="button" onClick={handleSaveDraft} disabled={savingDraft} className="px-6 py-2.5 rounded-xl border border-[#c2c6d6] text-sm font-bold hover:bg-[#edeeef] disabled:opacity-60">{savingDraft ? (isVi ? 'Đang lưu...' : 'Saving...') : t('save_draft')}</button>
                            <button 
                                onClick={handleNext}
                                disabled={loading || !isStepSaved}
                                className="px-8 py-2.5 rounded-xl gradient-button text-white text-sm font-bold shadow-lg shadow-[#0058be]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? t('step3_calculating') : t('validate_next')}
                            </button>
                        </div>
                    </div>
                    {draftMessage && <div className="mt-4 text-green-600 text-sm p-3 bg-green-50 rounded-lg">{draftMessage}</div>}
                    {error && <div className="mt-4 text-red-500 text-sm p-3 bg-red-50 rounded-lg">{error}</div>}
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
