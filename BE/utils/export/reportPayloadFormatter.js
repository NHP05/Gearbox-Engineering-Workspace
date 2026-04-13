const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const toSafeText = (value, fallback = '-') => {
    const text = String(value ?? '').trim();
    return text || fallback;
};

const toLanguage = (value) => (String(value || '').trim().toLowerCase() === 'en' ? 'en' : 'vi');

const byLanguage = (language, vi, en) => (toLanguage(language) === 'en' ? en : vi);

const getReportLabels = (language) => {
    const lang = toLanguage(language);

    return {
        title: byLanguage(lang, 'BAO CAO THIET KE HOP GIAM TOC', 'GEARBOX ENGINEERING REPORT'),
        generatedAt: byLanguage(lang, 'Thoi diem tao', 'Generated At'),
        user: byLanguage(lang, 'Nguoi dung', 'User'),
        requestedFormat: byLanguage(lang, 'Dinh dang yeu cau', 'Requested Format'),
        sectionSummary: byLanguage(lang, 'TOM TAT', 'SUMMARY'),
        torqueEstimate: byLanguage(lang, 'Uoc tinh mo men', 'Torque Estimate'),
        contactStress: byLanguage(lang, 'Ung suat tiep xuc', 'Contact Stress'),
        rootBending: byLanguage(lang, 'Ung suat uon chan rang', 'Root Bending'),
        safetyFactor: byLanguage(lang, 'He so an toan', 'Safety Factor'),
        sectionStep1: byLanguage(lang, 'BUOC 1 - DAU VAO DONG CO', 'STEP 1 - MOTOR INPUT'),
        power: byLanguage(lang, 'Cong suat', 'Power'),
        speed: byLanguage(lang, 'Toc do', 'Speed'),
        loadType: byLanguage(lang, 'Che do tai', 'Load Type'),
        sectionStep3: byLanguage(lang, 'BUOC 3 - BO TRUYEN', 'STEP 3 - TRANSMISSION'),
        beltType: byLanguage(lang, 'Loai dai', 'Belt Type'),
        pulleyD1: byLanguage(lang, 'Duong kinh puly d1', 'Pulley d1'),
        pulleyD2: byLanguage(lang, 'Duong kinh puly d2', 'Pulley d2'),
        beltRatio: byLanguage(lang, 'Ty so truyen dai', 'Belt Ratio'),
        sectionStep4: byLanguage(lang, 'BUOC 4 - TRUC / O LAN', 'STEP 4 - SHAFT / BEARING'),
        shaftDMin: byLanguage(lang, 'Duong kinh truc d_min', 'Shaft d_min'),
        shaftDStd: byLanguage(lang, 'Duong kinh truc tieu chuan', 'Shaft d_standard'),
        material: byLanguage(lang, 'Vat lieu', 'Material'),
        bearing: byLanguage(lang, 'O lan', 'Bearing'),
        sectionAiNotes: byLanguage(lang, 'GHI CHU TU TRO LY AI', 'AI NOTES'),
        noNote: byLanguage(lang, 'Khong co ghi chu.', 'No note provided.'),
    };
};

const pickFirst = (...values) => {
    for (let i = 0; i < values.length; i += 1) {
        const value = values[i];
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }
        if (typeof value === 'string' && value.trim()) {
            return value.trim();
        }
    }

    return undefined;
};

const normalizePayload = (payload = {}) => {
    const meta = payload?.meta || {};
    const steps = payload?.steps || {};
    const summary = payload?.summary || {};
    const aiNotes = Array.isArray(payload?.aiNotes) ? payload.aiNotes : [];
    const language = toLanguage(meta.language || meta.lang || payload?.language || payload?.settings?.language);

    return {
        meta: {
            generatedAt: toSafeText(meta.generatedAt, new Date().toLocaleString(language === 'en' ? 'en-US' : 'vi-VN')),
            userName: toSafeText(meta.userName, 'unknown-user'),
            exportFormat: toSafeText(meta.exportFormat, 'pdf').toLowerCase(),
            language,
        },
        steps: {
            step1: steps?.step1 || {},
            step3: steps?.step3 || {},
            step4: steps?.step4 || {},
        },
        summary: {
            torqueEstimate: toNumber(
                pickFirst(summary?.torqueEstimate, summary?.torqueOutputNm, summary?.torqueInputNm),
                0
            ),
            contactStress: toNumber(
                pickFirst(summary?.contactStress, summary?.sigmaH),
                0
            ),
            rootBending: toNumber(
                pickFirst(summary?.rootBending, summary?.sigmaF),
                0
            ),
            safetyFactor: toSafeText(
                pickFirst(summary?.safetyFactor, summary?.overallSafety, summary?.sfContact, summary?.sfBending),
                '0.00'
            ),
        },
        aiNotes,
    };
};

const buildReportLines = (payload = {}) => {
    const normalized = normalizePayload(payload);
    const { meta, steps, summary, aiNotes } = normalized;
    const labels = getReportLabels(meta.language);

    const step1Input = steps?.step1?.input || steps?.step1?.inputs || steps?.step1 || {};
    const step3Input = steps?.step3?.input || steps?.step3 || {};
    const step4Data = steps?.step4 || {};

    const step1Power = pickFirst(step1Input?.power, step1Input?.power_P, step1Input?.P);
    const step1Speed = pickFirst(step1Input?.n_motor, step1Input?.speed, step1Input?.speed_n, step1Input?.n);
    const step1LoadType = pickFirst(step1Input?.load_type, step1Input?.loadType);

    const beltType = pickFirst(steps?.step3?.belt_type, step3Input?.belt_type, step3Input?.beltType);
    const beltD1 = pickFirst(steps?.step3?.d1, step3Input?.d1);
    const beltD2 = pickFirst(steps?.step3?.d2, step3Input?.d2);
    const beltRatio = pickFirst(step3Input?.u_belt, step3Input?.uBelt, steps?.step3?.u_belt, steps?.step3?.ratio);

    const shaftDMin = pickFirst(step4Data?.calculated_d_min, step4Data?.d_min);
    const shaftDStd = pickFirst(step4Data?.standard_diameter_d, step4Data?.d_standard);
    const shaftMaterial = pickFirst(step4Data?.material_suggested, step4Data?.material);
    const bearingModel = pickFirst(step4Data?.selectedBearing?.model, step4Data?.selected_bearing_model);

    return [
        labels.title,
        `${labels.generatedAt}: ${meta.generatedAt}`,
        `${labels.user}: ${meta.userName}`,
        `${labels.requestedFormat}: ${meta.exportFormat}`,
        '',
        labels.sectionSummary,
        `- ${labels.torqueEstimate}: ${summary.torqueEstimate} Nm`,
        `- ${labels.contactStress}: ${summary.contactStress} MPa`,
        `- ${labels.rootBending}: ${summary.rootBending} MPa`,
        `- ${labels.safetyFactor}: ${summary.safetyFactor}`,
        '',
        labels.sectionStep1,
        `- ${labels.power}: ${toSafeText(step1Power, '-')} kW`,
        `- ${labels.speed}: ${toSafeText(step1Speed, '-')} rpm`,
        `- ${labels.loadType}: ${toSafeText(step1LoadType, '-')}`,
        '',
        labels.sectionStep3,
        `- ${labels.beltType}: ${toSafeText(beltType, '-')}`,
        `- ${labels.pulleyD1}: ${toSafeText(beltD1, '-')} mm`,
        `- ${labels.pulleyD2}: ${toSafeText(beltD2, '-')} mm`,
        `- ${labels.beltRatio}: ${toSafeText(beltRatio, '-')}`,
        '',
        labels.sectionStep4,
        `- ${labels.shaftDMin}: ${toSafeText(shaftDMin, '-')} mm`,
        `- ${labels.shaftDStd}: ${toSafeText(shaftDStd, '-')} mm`,
        `- ${labels.material}: ${toSafeText(shaftMaterial, '-')}`,
        `- ${labels.bearing}: ${toSafeText(bearingModel, '-')}`,
        '',
        labels.sectionAiNotes,
        ...(aiNotes.length ? aiNotes.map((note, index) => `${index + 1}. ${toSafeText(note, '-')}`) : [`1. ${labels.noNote}`]),
    ];
};

module.exports = {
    normalizePayload,
    buildReportLines,
};
