import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import axiosClient from '../../api/axiosClient';
import WizardScaffold from './WizardScaffold';
import { saveProjectDraft } from '../../services/projectDraft';
import { useLanguage } from '../../context/LanguageContext';
import { getWizardState, patchWizardState, setStepSaved } from '../../utils/wizardState';

const parseStoredJson = (key) => {
    try {
        return JSON.parse(localStorage.getItem(key) || '{}');
    } catch (error) {
        return {};
    }
};

const toNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const toPositiveNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toLanguage = (value) => (String(value || '').trim().toLowerCase() === 'en' ? 'en' : 'vi');

const byLanguage = (language, vi, en) => (toLanguage(language) === 'en' ? en : vi);

const round = (value, digits = 2) => {
    const factor = 10 ** digits;
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
};

const downloadBlob = (blob, fileName) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
};

const generateTextReport = (payload) => {
    const language = toLanguage(payload?.meta?.language);
    const labels = {
        title: byLanguage(language, 'BAO CAO THIET KE HOP GIAM TOC', 'GEARBOX ENGINEERING REPORT'),
        generated: byLanguage(language, 'Thoi diem tao', 'Generated'),
        user: byLanguage(language, 'Nguoi dung', 'User'),
        step1: byLanguage(language, 'BUOC 1 - DONG CO', 'STEP 1 - MOTOR'),
        step3: byLanguage(language, 'BUOC 3 - BO TRUYEN', 'STEP 3 - TRANSMISSION'),
        step4: byLanguage(language, 'BUOC 4 - TRUC', 'STEP 4 - SHAFT'),
        notes: byLanguage(language, 'GHI CHU TRO LY AI', 'AI ASSISTANT NOTES'),
        end: byLanguage(language, 'KET THUC BAO CAO', 'END OF REPORT'),
    };

    return [
        labels.title,
        `${labels.generated}: ${payload.meta.generatedAt}`,
        `${labels.user}: ${payload.meta.userName}`,
        '',
        labels.step1,
        JSON.stringify(payload.steps.step1, null, 2),
        '',
        labels.step3,
        JSON.stringify(payload.steps.step3, null, 2),
        '',
        labels.step4,
        JSON.stringify(payload.steps.step4, null, 2),
        '',
        labels.notes,
        ...payload.aiNotes.map((note, index) => `${index + 1}. ${note}`),
        '',
        labels.end,
    ].join('\n');
};

const getDownloadNameFromHeaders = (headers, fallbackName) => {
    const disposition = headers?.['content-disposition'] || headers?.['Content-Disposition'] || '';

    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
        try {
            return decodeURIComponent(utf8Match[1]);
        } catch (error) {
            return utf8Match[1];
        }
    }

    const plainMatch = disposition.match(/filename\s*=\s*"?([^";]+)"?/i);
    if (plainMatch?.[1]) {
        return plainMatch[1];
    }

    return fallbackName;
};

const getStatusTone = (value, labels) => {
    if (value >= 1.35) {
        return { tag: labels.safe, className: 'text-green-700 bg-green-100' };
    }
    if (value >= 1.1) {
        return { tag: labels.check, className: 'text-amber-700 bg-amber-100' };
    }
    return { tag: labels.low, className: 'text-red-700 bg-red-100' };
};

const Step5ValidationAnalysis = ({ onBack, onComplete }) => {
    const { language, t } = useLanguage();
    const isVi = language === 'vi';
    const numberLocale = isVi ? 'vi-VN' : 'en-US';
    const [exportFormat, setExportFormat] = useState('pdf');
    const [loading, setLoading] = useState(false);
    const [savingDraft, setSavingDraft] = useState(false);
    const [error, setError] = useState('');
    const [draftMessage, setDraftMessage] = useState('');

    const statusLabels = {
        safe: t('step5_status_safe'),
        check: t('step5_status_check'),
        low: t('step5_status_low'),
    };

    const wizardState = getWizardState();
    const step1Input = wizardState?.step1Input || parseStoredJson('step1_input');
    const step1 = wizardState?.step1Result || parseStoredJson('step1_result');
    const selectedMotor = wizardState?.selectedMotor || parseStoredJson('step2_selected_motor');
    const step3 = wizardState?.step3Result || parseStoredJson('step3_result');
    const step4 = wizardState?.step4Result || parseStoredJson('step4_result');
    const step3Design = wizardState?.designState || parseStoredJson('step3_design_state');
    const user = parseStoredJson('gearbox_user');

    const powerInput = toPositiveNumber(step3?.input?.power || selectedMotor?.power || step1Input?.power, 15.5);
    const speedInput = toPositiveNumber(step3?.input?.n_motor || selectedMotor?.speed || step1Input?.speed, 1450);
    const moduleValue = toPositiveNumber(step3?.module || step3Design?.moduleValue, 2.5);
    const z1 = Math.round(toPositiveNumber(step3?.spur_teeth || step3Design?.spurTeeth, 24));
    const z2 = Math.round(toPositiveNumber(step3?.driven_teeth, z1 * 3));
    const gearRatio = toPositiveNumber(step3?.spur_ratio || step3?.gear_ratio, z2 / Math.max(1, z1));
    const efficiency = toPositiveNumber(step3?.efficiency_pct, 95) / 100;
    const faceWidth = toPositiveNumber(step3?.face_width || step3Design?.faceWidth, 25);
    const helixAngle = step3Design?.gearMode === 'straight'
        ? 0
        : toNumber(step3?.helix_angle || step3Design?.helixAngle, 20);
    const betaRad = (helixAngle * Math.PI) / 180;

    const d1 = Math.max(1, moduleValue * z1);
    const d2 = Math.max(1, moduleValue * z2);

    const torqueInputNm = toPositiveNumber(step3?.torque_input_nm, (9550 * powerInput) / Math.max(1, speedInput));
    const torqueOutputNm = toPositiveNumber(step3?.torque_output_nm, torqueInputNm * gearRatio * efficiency);
    const FtCritical = (2 * torqueOutputNm * 1000) / d2;

    const torqueInputNmm = torqueInputNm * 1000;
    const kh = 1.2;
    const kv = 1.1;
    const ka = 1.0;
    const kf = kh * kv * ka;
    const zm = 189;
    const zh = 1.0;
    const zEps = 1.0;
    const u = Math.max(1.01, gearRatio);
    const sigmaH = zm * zh * zEps * Math.sqrt(
        (2 * torqueInputNmm * kh * (u + 1))
        / Math.max(1, faceWidth * Math.pow(d1, 2) * u)
    );

    const yf = 2.9 / Math.sqrt(Math.max(8, z1));
    const ybeta = Math.max(0.7, Math.cos(betaRad));
    const sigmaF = (2 * torqueInputNmm * kf * yf * ybeta) / Math.max(1, faceWidth * d1 * moduleValue);

    const material = String(step4?.material_suggested || 'AISI 4140').toUpperCase();
    const sigmaHAllow = material.includes('4140') ? 1250 : 1100;
    const sigmaFAllow = material.includes('4140') ? 380 : 320;

    const sfContact = sigmaHAllow / Math.max(1, sigmaH);
    const sfBending = sigmaFAllow / Math.max(1, sigmaF);
    const dMin = toNumber(step4?.calculated_d_min, 34);
    const dStd = toNumber(step4?.standard_diameter_d, 40);
    const sfShaft = dStd / Math.max(1, dMin);
    const overallSafety = Math.min(sfContact, sfBending, sfShaft);
    const safetyTone = getStatusTone(overallSafety, statusLabels);

    const requiredLifeHours = Math.round(toPositiveNumber(step4?.required_life_hours || step1Input?.life, 20000));
    const bearingLifeHours = Math.round(toPositiveNumber(step4?.selectedBearing?.life_hours, requiredLifeHours * 0.9));

    const outputFr = toPositiveNumber(step4?.forces?.output?.Fr, 1500);
    const shaftLength = toPositiveNumber(step4?.output_shaft_length_mm, 220);
    const shaftDiameter = Math.max(10, dStd);
    const elasticModulus = 210000;
    const inertia = (Math.PI * Math.pow(shaftDiameter, 4)) / 64;
    const deflection = (outputFr * Math.pow(shaftLength, 3)) / Math.max(1, 3 * elasticModulus * inertia);

    const torqueBars = useMemo(() => {
        const normalized = clamp((torqueOutputNm / Math.max(1, torqueInputNm)) * 70, 30, 95);
        return [
            clamp(normalized * 0.48, 20, 95),
            clamp(normalized * 0.62, 20, 95),
            clamp(normalized * 0.8, 20, 95),
            clamp(normalized, 20, 95),
            clamp(normalized * 0.86, 20, 95),
            clamp(normalized * 0.7, 20, 95),
            clamp(normalized * 0.55, 20, 95),
        ];
    }, [torqueInputNm, torqueOutputNm]);

    const optimizationNotes = [
        sfContact < 1.15 ? t('step5_note_contact_high') : t('step5_note_contact_ok'),
        sfBending < 1.15 ? t('step5_note_bending_high') : t('step5_note_bending_ok'),
        bearingLifeHours < requiredLifeHours ? t('step5_note_life_low') : t('step5_note_life_ok'),
    ];

    const summary = {
        torqueInputNm: round(torqueInputNm, 3),
        torqueOutputNm: round(torqueOutputNm, 3),
        tangentialForceN: round(FtCritical, 3),
        sigmaH: round(sigmaH, 3),
        sigmaF: round(sigmaF, 3),
        sigmaHAllow,
        sigmaFAllow,
        sfContact: round(sfContact, 3),
        sfBending: round(sfBending, 3),
        sfShaft: round(sfShaft, 3),
        overallSafety: round(overallSafety, 3),
        deflectionMm: round(deflection, 4),
        bearingLifeHours,
        requiredLifeHours,
    };

    const reportPayload = {
        meta: {
            generatedAt: new Date().toLocaleString(numberLocale),
            userName: user?.username || 'unknown-user',
            exportFormat,
            language,
        },
        steps: {
            step1: {
                ...(step1 || {}),
                input: {
                    ...(step1?.input || {}),
                    power: toPositiveNumber(step1Input?.power, powerInput),
                    n_motor: toPositiveNumber(step1Input?.speed, speedInput),
                    load_type: step1Input?.loadType || step1Input?.load_type || 'constant',
                },
            },
            step3,
            step4,
            step5: {
                method: 'AGMA-style simplified checks',
                summary,
            },
        },
        summary: {
            ...summary,
            torqueEstimate: summary.torqueOutputNm,
            contactStress: summary.sigmaH,
            rootBending: summary.sigmaF,
            safetyFactor: round(overallSafety, 2),
        },
        aiNotes: optimizationNotes,
    };

    const persistStep5 = () => {
        localStorage.setItem('step5_result', JSON.stringify({ summary, notes: optimizationNotes }));
        patchWizardState({
            step5Result: { summary, notes: optimizationNotes },
        });
    };

    const exportClientFile = () => {
        const timestamp = Date.now();

        if (exportFormat === 'step') {
            const content = JSON.stringify(reportPayload, null, 2);
            const blob = new Blob([content], { type: 'application/json' });
            downloadBlob(blob, `gearbox-design-${timestamp}.step.json`);
            return;
        }

        if (exportFormat === 'dxf') {
            const dxf = [
                '0',
                'SECTION',
                '2',
                'HEADER',
                '9',
                '$ACADVER',
                '1',
                'AC1018',
                '0',
                'ENDSEC',
                '0',
                'SECTION',
                '2',
                'ENTITIES',
                '0',
                'TEXT',
                '8',
                '0',
                '10',
                '10.0',
                '20',
                '10.0',
                '30',
                '0.0',
                '40',
                '2.5',
                '1',
                `Gearbox Report - ${reportPayload.meta.generatedAt}`,
                '0',
                'TEXT',
                '8',
                '0',
                '10',
                '10.0',
                '20',
                '15.0',
                '30',
                '0.0',
                '40',
                '1.8',
                '1',
                `Torque in: ${summary.torqueInputNm} Nm`,
                '0',
                'TEXT',
                '8',
                '0',
                '10',
                '10.0',
                '20',
                '20.0',
                '30',
                '0.0',
                '40',
                '1.8',
                '1',
                `Overall SF: ${summary.overallSafety}`,
                '0',
                'ENDSEC',
                '0',
                'EOF',
            ].join('\n');
            const blob = new Blob([dxf], { type: 'application/dxf' });
            downloadBlob(blob, `gearbox-design-${timestamp}.dxf`);
            return;
        }

        const content = generateTextReport(reportPayload);
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        downloadBlob(blob, `gearbox-design-${timestamp}.txt`);
    };

    const handleExport = async () => {
        setLoading(true);
        setError('');
        setDraftMessage('');

        try {
            persistStep5();

            try {
                const saveResult = await saveProjectDraft({ status: 'completed' });
                setStepSaved(5, true);
                setDraftMessage(saveResult?.source === 'api'
                    ? t('step5_completed_saved_api')
                    : t('step5_completed_saved_local'));
            } catch (saveError) {
                setStepSaved(5, true);
                setDraftMessage(t('step5_sync_warning'));
            }

            const response = await axiosClient.post('/export/report', reportPayload, {
                responseType: 'blob',
                timeout: 12000,
            });

            const contentType = response?.headers?.['content-type'] || 'application/octet-stream';
            const blob = response?.data instanceof Blob
                ? response.data
                : new Blob([response.data], { type: contentType });

            const fallbackName = `gearbox-design-${Date.now()}.${exportFormat}`;
            const fileName = getDownloadNameFromHeaders(response?.headers, fallbackName);
            downloadBlob(blob, fileName);

            onComplete && onComplete();
        } catch (err) {
            try {
                exportClientFile();
                setDraftMessage(t('step5_fallback_exported'));
                onComplete && onComplete();
            } catch (fallbackError) {
                setError(err?.response?.data?.message || t('step5_export_failed'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDraft = async () => {
        setSavingDraft(true);
        setDraftMessage('');
        setError('');

        try {
            persistStep5();
            const result = await saveProjectDraft({ status: 'completed' });
            setStepSaved(5, true);
            setDraftMessage(result?.source === 'api'
                ? t('step5_draft_saved_api')
                : t('step5_draft_saved_local'));
        } catch (err) {
            setError(t('step5_saving_error'));
        } finally {
            setSavingDraft(false);
        }
    };

    return (
        <WizardScaffold activeKey="validation">
            <div className="p-8 min-h-screen">
                <div className="max-w-6xl mx-auto mb-10">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#495e8a]">{t('step_of')} 05</span>
                            <h1 className="text-2xl font-bold tracking-tight">{t('step5_title')}</h1>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold text-[#0058be]">{t('step_of')} 5/5</span>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">{t('step5_final_review')}</p>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-[#edeeef] rounded-full overflow-hidden"><div className="h-full w-full bg-[#0058be]" /></div>
                </div>

                <div className="max-w-6xl mx-auto grid grid-cols-12 gap-6">
                    <div className="col-span-12 lg:col-span-4 space-y-6">
                        <section className="bg-white rounded-xl p-6 shadow-sm border border-[#c2c6d6]/20">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-sm">verified</span>{t('step5_stress_table')}</h3>
                            <div className="space-y-3 text-sm">
                                <div className="grid grid-cols-4 gap-2 items-center bg-slate-50 rounded-lg p-3">
                                    <span className="font-semibold col-span-2">Sigma_H</span>
                                    <span className="text-right font-mono">{round(sigmaH, 1)} MPa</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded justify-self-end ${getStatusTone(sfContact, statusLabels).className}`}>{getStatusTone(sfContact, statusLabels).tag}</span>
                                </div>
                                <div className="grid grid-cols-4 gap-2 items-center bg-slate-50 rounded-lg p-3">
                                    <span className="font-semibold col-span-2">Sigma_F</span>
                                    <span className="text-right font-mono">{round(sigmaF, 1)} MPa</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded justify-self-end ${getStatusTone(sfBending, statusLabels).className}`}>{getStatusTone(sfBending, statusLabels).tag}</span>
                                </div>
                                <div className="grid grid-cols-4 gap-2 items-center bg-slate-50 rounded-lg p-3">
                                    <span className="font-semibold col-span-2">SF_contact</span>
                                    <span className="text-right font-mono">{round(sfContact, 2)}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded justify-self-end ${getStatusTone(sfContact, statusLabels).className}`}>{getStatusTone(sfContact, statusLabels).tag}</span>
                                </div>
                                <div className="grid grid-cols-4 gap-2 items-center bg-slate-50 rounded-lg p-3">
                                    <span className="font-semibold col-span-2">SF_bending</span>
                                    <span className="text-right font-mono">{round(sfBending, 2)}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded justify-self-end ${getStatusTone(sfBending, statusLabels).className}`}>{getStatusTone(sfBending, statusLabels).tag}</span>
                                </div>
                                <div className="grid grid-cols-4 gap-2 items-center bg-slate-50 rounded-lg p-3">
                                    <span className="font-semibold col-span-2">SF_shaft</span>
                                    <span className="text-right font-mono">{round(sfShaft, 2)}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded justify-self-end ${getStatusTone(sfShaft, statusLabels).className}`}>{getStatusTone(sfShaft, statusLabels).tag}</span>
                                </div>
                                <div className="grid grid-cols-4 gap-2 items-center bg-[#d8e2ff]/45 rounded-lg p-3 border border-[#0058be]/20">
                                    <span className="font-semibold col-span-2">Overall SF</span>
                                    <span className="text-right font-mono font-bold">{round(overallSafety, 2)}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded justify-self-end ${safetyTone.className}`}>{safetyTone.tag}</span>
                                </div>
                            </div>
                        </section>

                        <section className="bg-slate-900 rounded-xl p-6 text-white relative shadow-xl">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-sm">tips_and_updates</span>{t('step5_optimization_notes')}</h3>
                            <div className="space-y-3">
                                {optimizationNotes.map((note, idx) => (
                                    <div key={`opt-${idx}`} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[12px] leading-5 text-slate-200">
                                        {note}
                                    </div>
                                ))}
                            </div>

                        </section>
                    </div>

                    <div className="col-span-12 lg:col-span-8 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <section className="bg-white rounded-xl p-6 shadow-sm border border-[#c2c6d6]/20">
                                <div className="flex justify-between items-start mb-6"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('step5_torque_distribution')}</h3><span className="text-[10px] font-bold text-slate-400 uppercase">Tin: {round(torqueInputNm, 1)} Nm</span></div>
                                <div className="h-40 flex items-end justify-between gap-1">
                                    {torqueBars.map((height, idx) => (
                                        <div key={`bar-${idx}`} className={`w-full rounded-t-sm ${idx === 3 ? 'bg-blue-600' : idx === 2 || idx === 4 ? 'bg-blue-400' : idx === 1 || idx === 5 ? 'bg-blue-300' : 'bg-blue-200'}`} style={{ height: `${height}%` }} />
                                    ))}
                                </div>
                                <div className="flex justify-between mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-tighter"><span>{t('step5_input_stage')}</span><span>{t('step5_peak_load')}</span><span>{t('step5_output_stage')}</span></div>
                            </section>

                            <section className="bg-white rounded-xl p-6 shadow-sm border border-[#c2c6d6]/20">
                                <div className="flex justify-between items-start mb-6"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('step5_shaft_deflection')}</h3><span className="text-[10px] font-bold text-slate-400 uppercase">delta_max: {round(deflection, 3)} mm</span></div>
                                <div className="h-40 flex items-center">
                                    <svg className="w-full h-full text-blue-600 overflow-visible" viewBox="0 0 200 100">
                                        <path d="M0 78 Q 55 8, 100 48 T 200 28" fill="none" stroke="currentColor" strokeWidth="2.5" />
                                        <circle cx="55" cy="20" r="4" fill="currentColor" />
                                        <text x="60" y="14" fill="currentColor" fontSize="8" fontWeight="bold">{t('step5_max_deflection')}</text>
                                    </svg>
                                </div>
                            </section>
                        </div>

                        <section className="bg-white rounded-xl p-6 shadow-sm border border-[#c2c6d6]/20">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">{t('step5_formula_panel')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="bg-slate-50 rounded-lg p-4">
                                    <p className="font-semibold mb-2">{t('step5_contact_stress')}</p>
                                    <div className="formula-scroll">
                                        <math xmlns="http://www.w3.org/1998/Math/MathML" className="formula-math"><mrow><msub><mi>&#x03C3;</mi><mi>H</mi></msub><mo>=</mo><msub><mi>Z</mi><mi>M</mi></msub><mo>&#x22C5;</mo><msub><mi>Z</mi><mi>H</mi></msub><mo>&#x22C5;</mo><msub><mi>Z</mi><mi>&#x03B5;</mi></msub><mo>&#x22C5;</mo><msqrt><mfrac><mrow><mn>2</mn><mo>&#x22C5;</mo><msub><mi>T</mi><mn>1</mn></msub><mo>&#x22C5;</mo><msub><mi>K</mi><mi>H</mi></msub><mo>&#x22C5;</mo><mo>(</mo><mi>u</mi><mo>+</mo><mn>1</mn><mo>)</mo></mrow><mrow><mi>b</mi><mo>&#x22C5;</mo><msubsup><mi>d</mi><mn>1</mn><mn>2</mn></msubsup><mo>&#x22C5;</mo><mi>u</mi></mrow></mfrac></msqrt></mrow></math>
                                    </div>
                                    <p className="mt-2 text-slate-600">ZM={zm}, KH={kh}, T1={round(torqueInputNmm, 1)} Nmm, b={faceWidth} mm</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-4">
                                    <p className="font-semibold mb-2">{t('step5_root_bending')}</p>
                                    <div className="formula-scroll">
                                        <math xmlns="http://www.w3.org/1998/Math/MathML" className="formula-math"><mrow><msub><mi>&#x03C3;</mi><mi>F</mi></msub><mo>=</mo><mfrac><mrow><mn>2</mn><mo>&#x22C5;</mo><msub><mi>T</mi><mn>1</mn></msub><mo>&#x22C5;</mo><msub><mi>K</mi><mi>f</mi></msub><mo>&#x22C5;</mo><msub><mi>Y</mi><mi>F</mi></msub><mo>&#x22C5;</mo><msub><mi>Y</mi><mi>&#x03B2;</mi></msub></mrow><mrow><mi>b</mi><mo>&#x22C5;</mo><msub><mi>d</mi><mn>1</mn></msub><mo>&#x22C5;</mo><mi>m</mi></mrow></mfrac></mrow></math>
                                    </div>
                                    <p className="mt-2 text-slate-600">Kf={kf}, m={moduleValue}, YF={round(yf, 3)}, Ybeta={round(ybeta, 3)}</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-4">
                                    <p className="font-semibold mb-2">{t('step5_bearing_life_gate')}</p>
                                    <div className="formula-scroll">
                                        <math xmlns="http://www.w3.org/1998/Math/MathML" className="formula-math">
                                            <mrow>
                                                <msub><mi>L</mi><mrow><mi>h</mi><mo>,</mo><mi>selected</mi></mrow></msub>
                                                <mo>&#x2265;</mo>
                                                <msub><mi>L</mi><mrow><mi>h</mi><mo>,</mo><mi>required</mi></mrow></msub>
                                            </mrow>
                                        </math>
                                    </div>
                                    <p className="mt-2 text-slate-600">{bearingLifeHours.toLocaleString(numberLocale)} h / {requiredLifeHours.toLocaleString(numberLocale)} h</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-4">
                                    <p className="font-semibold mb-2">{t('step5_shaft_safety')}</p>
                                    <div className="formula-scroll">
                                        <math xmlns="http://www.w3.org/1998/Math/MathML" className="formula-math">
                                            <mrow>
                                                <msub><mi>SF</mi><mi>shaft</mi></msub><mo>=</mo>
                                                <mfrac>
                                                    <msub><mi>d</mi><mi>std</mi></msub>
                                                    <msub><mi>d</mi><mi>min</mi></msub>
                                                </mfrac>
                                            </mrow>
                                        </math>
                                    </div>
                                    <p className="mt-2 text-slate-600">d_std={round(dStd, 2)} mm, d_min={round(dMin, 2)} mm</p>
                                </div>
                            </div>
                        </section>

                        <div className="flex justify-between items-center pt-4">
                            <button onClick={onBack} className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-200"><span className="material-symbols-outlined">arrow_back</span>{t('step5_back_to_design')}</button>
                            <div className="flex gap-4">
                                <button type="button" onClick={handleSaveDraft} disabled={savingDraft} className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold border border-[#c2c6d6] text-slate-700 hover:bg-white disabled:opacity-60"><span className="material-symbols-outlined">save</span>{savingDraft ? t('saving') : t('save_draft')}</button>
                                <select aria-label="Export format" value={exportFormat} onChange={(event) => setExportFormat(event.target.value)} className="px-3 py-2.5 rounded-lg text-sm border border-[#c2c6d6] bg-white">
                                    <option value="pdf">PDF</option>
                                    <option value="docx">DOCX</option>
                                    <option value="dxf">DXF</option>
                                    <option value="step">STEP</option>
                                </select>
                                <button 
                                    onClick={handleExport}
                                    disabled={loading}
                                    className="gradient-button flex items-center gap-2 px-8 py-2.5 rounded-lg text-sm font-bold text-white shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined">description</span>
                                    {loading ? t('step5_exporting') : t('step5_export_full')}
                                </button>
                            </div>
                        </div>
                        {draftMessage && <div className="mt-4 text-green-600 text-sm p-3 bg-green-50 rounded-lg">{draftMessage}</div>}
                        {error && <div className="mt-4 text-red-500 text-sm p-3 bg-red-50 rounded-lg">{error}</div>}
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
