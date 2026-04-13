const { askLocalLLMJson } = require('../services/localLLM.service');

const safeNum = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const isEnglish = (language) => String(language || '').toLowerCase() === 'en';

const buildFallbackDraft = ({ language, currentData = {}, goal = '' }) => {
    const en = isEnglish(language);
    const step1Input = currentData?.step1Input || {};
    const step3Input = currentData?.step3Input || {};
    const step4Result = currentData?.step4Result || {};

    return {
        goal,
        step1: {
            power: safeNum(step1Input.power, 15.5),
            speed: safeNum(step1Input.speed, 1450),
            loadType: step1Input.loadType || 'constant',
            life: safeNum(step1Input.life, 20000),
        },
        step2: {
            strategy: en ? 'Select motor closest to required power and speed.' : 'Chọn motor gần nhất với công suất và tốc độ yêu cầu.',
        },
        step3: {
            uBelt: safeNum(step3Input.uBelt, 3),
            d1: safeNum(step3Input.d1, 120),
            spurTeeth: safeNum(currentData?.designState?.spurTeeth, 24),
            moduleValue: safeNum(currentData?.designState?.moduleValue, 2.5),
            faceWidth: safeNum(currentData?.designState?.faceWidth, 25),
            gearMode: currentData?.designState?.gearMode || 'spiral',
            helixAngle: safeNum(currentData?.designState?.helixAngle, 20),
        },
        step4: {
            preferredBearing: step4Result?.selectedBearing?.model || 'SKF 6207-2RS1',
            expectedLifeHours: safeNum(step4Result?.required_life_hours, 20000),
        },
        step5Estimate: {
            safetyFactorTarget: 1.25,
            riskLevel: 'medium',
            summary: en
                ? 'Validate contact stress, root bending, bearing life, and shaft margin before export.'
                : 'Kiểm tra ứng suất tiếp xúc, uốn chân răng, tuổi thọ ổ lăn và biên an toàn trục trước khi xuất báo cáo.',
        },
        notes: en
            ? ['Review ratio split to avoid peak stress.', 'Increase face width if safety factor is below target.']
            : ['Xem lại phân bố tỉ số truyền để giảm peak stress.', 'Tăng bề rộng mặt răng nếu hệ số an toàn thấp hơn mục tiêu.'],
        source: 'fallback',
    };
};

const buildDraftPrompt = ({ goal, language, currentData }) => {
    return [
        `Language: ${isEnglish(language) ? 'English' : 'Vietnamese'}`,
        'Task: Generate a complete gearbox design draft from wizard context.',
        'Return ONLY valid JSON with schema:',
        '{',
        '  "step1": { "power": number, "speed": number, "loadType": string, "life": number },',
        '  "step2": { "strategy": string },',
        '  "step3": { "uBelt": number, "d1": number, "spurTeeth": number, "moduleValue": number, "faceWidth": number, "gearMode": string, "helixAngle": number },',
        '  "step4": { "preferredBearing": string, "expectedLifeHours": number },',
        '  "step5Estimate": { "safetyFactorTarget": number, "riskLevel": string, "summary": string },',
        '  "notes": [string, string]',
        '}',
        `Goal: ${goal || 'Create a reliable baseline draft.'}`,
        `CurrentData: ${JSON.stringify(currentData || {})}`,
    ].join('\n');
};

const generateDraft = async (req, res) => {
    try {
        const { goal, language, currentData } = req.body || {};
        const fallback = buildFallbackDraft({ language, currentData, goal });

        try {
            const llm = await askLocalLLMJson({
                prompt: buildDraftPrompt({ goal, language, currentData }),
                provider: process.env.LOCAL_LLM_PROVIDER,
                model: process.env.LOCAL_LLM_MODEL,
                timeoutMs: Number(process.env.LOCAL_LLM_TIMEOUT_MS || 18000),
            });

            if (llm?.parsed && typeof llm.parsed === 'object') {
                return res.status(200).json({
                    success: true,
                    data: {
                        ...llm.parsed,
                        source: llm.provider || 'local-llm',
                    },
                });
            }
        } catch (llmError) {
            // Fallback below
        }

        return res.status(200).json({ success: true, data: fallback });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const reviewStepInput = async (req, res) => {
    try {
        const { step, payload, language } = req.body || {};
        const en = isEnglish(language);
        const warnings = [];
        const suggestions = [];

        if (Number(step) === 1) {
            const power = safeNum(payload?.power, 0);
            const speed = safeNum(payload?.speed, 0);
            if (power <= 0) warnings.push(en ? 'Power must be greater than 0.' : 'Công suất phải lớn hơn 0.');
            if (speed < 100) warnings.push(en ? 'Speed appears too low.' : 'Tốc độ có vẻ quá thấp.');
            if (speed > 6000) warnings.push(en ? 'Speed appears too high for this baseline.' : 'Tốc độ có vẻ quá cao so với cấu hình nền.');
        }

        if (Number(step) === 3) {
            const ratio = safeNum(payload?.uBelt, 0);
            if (ratio < 1.5 || ratio > 6) {
                warnings.push(en ? 'Belt ratio is outside the common stable range (1.5-6).' : 'Tỉ số đai đang ngoài vùng ổn định thường dùng (1.5-6).');
            }
            suggestions.push(en ? 'Check ratio split across stages to reduce peak stress.' : 'Nên xem lại phân bố tỉ số giữa các cấp để giảm peak stress.');
        }

        if (Number(step) === 4) {
            const life = safeNum(payload?.required_life_hours, 0);
            if (life > 0 && life < 8000) {
                warnings.push(en ? 'Required bearing life is relatively low for industrial duty.' : 'Tuổi thọ ổ lăn yêu cầu đang khá thấp cho tải công nghiệp.');
            }
        }

        if (warnings.length === 0) {
            suggestions.push(en ? 'Input looks reasonable. Continue to next step and validate in Step 5.' : 'Thông số hiện tại hợp lý. Bạn có thể sang bước tiếp theo và kiểm tra lại ở Step 5.');
        }

        return res.status(200).json({
            success: true,
            data: {
                step: Number(step) || 0,
                warnings,
                suggestions,
                source: 'rule-check',
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    generateDraft,
    reviewStepInput,
};
