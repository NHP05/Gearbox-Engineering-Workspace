import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { getWizardState } from '../utils/wizardState';
import { requestFullDraft, reviewStepData } from '../services/aiDraftAssistant';

const quickPrompts = {
    vi: [
        'Toi uu safety factor cho bo truyen hien tai',
        'Goi y cap nhat spur/bevel de giam contact stress',
        'Kiem tra lai ratio theo du lieu Step 1 va Step 3',
        'Canh bao loi thuong gap truoc khi export report',
    ],
    en: [
        'Optimize safety factor for current transmission',
        'Suggest spur/bevel updates to reduce contact stress',
        'Review ratio from Step 1 and Step 3 data',
        'Show common errors before export report',
    ],
};

const normalize = (text) => String(text || '').toLowerCase();

const buildFallbackReply = (question, language) => {
    const q = normalize(question);
    if (language === 'en') {
        if (q.includes('safety')) return 'Please verify safety-factor margin and shaft diameter before final export.';
        if (q.includes('ratio')) return 'Please review stage ratio split to reduce peak stress.';
        return 'AI backend is temporarily unavailable. Please retry in a moment.';
    }

    if (q.includes('safety')) return 'Vui long kiem tra he so an toan va duong kinh truc truoc khi export cuoi.';
    if (q.includes('ratio')) return 'Vui long xem lai phan bo ti so truyen de giam peak stress.';
    return 'He thong AI backend tam thoi khong san sang. Vui long thu lai.';
};

const AIAssistant = () => {
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const { language, t } = useLanguage();
    const wizard = useMemo(() => getWizardState(), []);

    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            text: language === 'en'
                ? 'Hello, I am AI Smart Assistant. I can help optimize your design from Step 1 to Step 5 using current data.'
                : 'Xin chao, toi la AI Smart Assistant. Toi co the ho tro toi uu thiet ke tu Step 1 den Step 5 dua tren du lieu hien tai.',
            source: 'system',
        },
    ]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [reviewHints, setReviewHints] = useState([]);

    const context = {
        power: Number(wizard?.step1Input?.power) || 15.5,
        speed: Number(wizard?.step1Input?.speed) || 1450,
        beltRatio: Number(wizard?.step3Result?.input?.u_belt || 3).toFixed(2),
        spurRatio: Number((wizard?.step3Result?.d2 || 300) / Math.max(1, wizard?.step3Result?.d1 || 120)).toFixed(2),
        faceWidth: Number(wizard?.designState?.faceWidth || 25),
        bevelAngle: Number(wizard?.designState?.bevelAngle || 90),
        gearMode: wizard?.designState?.gearMode || 'spiral',
        shaftDiameter: Number(wizard?.step4Result?.standard_diameter_d || 40),
        safetyFactor: Number((Number(wizard?.step4Result?.standard_diameter_d || 40) / Math.max(1, Number(wizard?.step4Result?.calculated_d_min || 34))).toFixed(2)),
    };

    useEffect(() => {
        let mounted = true;

        const fetchHints = async () => {
            try {
                const [step1Review, step3Review] = await Promise.all([
                    reviewStepData({
                        step: 1,
                        language,
                        payload: {
                            power: context.power,
                            speed: context.speed,
                        },
                    }),
                    reviewStepData({
                        step: 3,
                        language,
                        payload: {
                            uBelt: Number(context.beltRatio),
                            faceWidth: context.faceWidth,
                        },
                    }),
                ]);

                if (mounted) {
                    const hints = [
                        ...(step1Review?.warnings || []),
                        ...(step1Review?.suggestions || []),
                        ...(step3Review?.warnings || []),
                        ...(step3Review?.suggestions || []),
                    ].slice(0, 4);
                    setReviewHints(hints);
                }
            } catch (error) {
                if (mounted) {
                    setReviewHints([]);
                }
            }
        };

        fetchHints();

        return () => {
            mounted = false;
        };
    }, [language, context.power, context.speed, context.beltRatio, context.faceWidth]);

    const summarizeDraft = (draft) => {
        if (!draft || typeof draft !== 'object') {
            return language === 'en' ? 'Unable to build draft.' : 'Không tạo được draft.';
        }

        const s1 = draft.step1 || {};
        const s3 = draft.step3 || {};
        const s5 = draft.step5Estimate || {};

        if (language === 'en') {
            return [
                `Draft generated: P=${s1.power ?? '-'} kW, n=${s1.speed ?? '-'} rpm, load=${s1.loadType ?? '-'}.`,
                `Step 3 proposal: uBelt=${s3.uBelt ?? '-'}, d1=${s3.d1 ?? '-'} mm, module=${s3.moduleValue ?? '-'}, faceWidth=${s3.faceWidth ?? '-'} mm.`,
                `Step 5 estimate: target SF=${s5.safetyFactorTarget ?? '-'}, risk=${s5.riskLevel ?? '-'}.`,
                'You can now copy these values into Step 1 -> Step 5 to complete the workflow quickly.',
            ].join(' ');
        }

        return [
            `Đã tạo draft: P=${s1.power ?? '-'} kW, n=${s1.speed ?? '-'} rpm, tải=${s1.loadType ?? '-'}.`,
            `Gợi ý Step 3: uBelt=${s3.uBelt ?? '-'}, d1=${s3.d1 ?? '-'} mm, module=${s3.moduleValue ?? '-'}, faceWidth=${s3.faceWidth ?? '-'} mm.`,
            `Ước tính Step 5: SF mục tiêu=${s5.safetyFactorTarget ?? '-'}, mức rủi ro=${s5.riskLevel ?? '-'}.`,
            'Bạn có thể điền các giá trị này vào Step 1 -> Step 5 để hoàn thành nhanh.',
        ].join(' ');
    };

    const generateDraft = async (goalText) => {
        const draft = await requestFullDraft({
            goal: goalText,
            language,
            currentData: wizard,
        });

        const summary = summarizeDraft(draft);
        setMessages((prev) => [...prev, {
            role: 'assistant',
            text: summary,
            source: draft?.source || 'local-llm',
            draft,
        }]);
    };

    const sendQuestion = async (questionText) => {
        const q = String(questionText || '').trim();
        if (!q) return;

        setSending(true);
        setMessages((prev) => [...prev, { role: 'user', text: q }]);

        try {
            const normalizedQuestion = q.toLowerCase();
            if (
                normalizedQuestion.includes('draft')
                || normalizedQuestion.includes('hoan chinh')
                || normalizedQuestion.includes('điền')
                || normalizedQuestion.includes('full step')
            ) {
                await generateDraft(q);
                return;
            }

            let reply = buildFallbackReply(q, language);
            let actions = [];
            let confidence = null;
            let source = 'fallback';

            try {
                const response = await axiosClient.post('/support/ai-hint', {
                    question: q,
                    context,
                    language,
                });
                if (response?.data?.success && response?.data?.data?.reply) {
                    reply = response.data.data.reply;
                    actions = Array.isArray(response?.data?.data?.actions) ? response.data.data.actions : [];
                    confidence = Number.isFinite(Number(response?.data?.data?.confidence)) ? Number(response.data.data.confidence) : null;
                    source = response?.data?.data?.source || 'python';
                }
            } catch (apiError) {
                // Keep local fallback reply
            }

            setMessages((prev) => [...prev, { role: 'assistant', text: reply, actions, confidence, source }]);
        } catch (error) {
            const fallbackMessage = language === 'en'
                ? 'Unable to process your request right now. Please try again.'
                : 'Hiện tại chưa thể xử lý yêu cầu của bạn. Vui lòng thử lại.';

            setMessages((prev) => [...prev, {
                role: 'assistant',
                text: error?.response?.data?.message || fallbackMessage,
                source: 'error',
            }]);
        } finally {
            setSending(false);
            setInput('');
        }
    };

    return (
        <div className={`min-h-screen ${isDark ? 'bg-[#070f23] text-slate-100' : 'bg-[#f8f9fa] text-[#191c1d]'}`}>
            <header className={`h-14 px-6 border-b backdrop-blur-xl flex items-center justify-between sticky top-0 z-40 ${isDark ? 'border-slate-700/70 bg-[#0f172a]/95' : 'border-slate-200/70 bg-white/90'}`}>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => navigate('/dashboard')} className={`text-sm font-semibold ${isDark ? 'text-slate-300 hover:text-blue-300' : 'text-slate-600 hover:text-blue-700'}`}>Dashboard</button>
                    <span className={`${isDark ? 'text-slate-600' : 'text-slate-300'}`}>/</span>
                    <h1 className="text-lg font-bold tracking-tight">{t('ai_page_title')}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
                        <span className="material-symbols-outlined text-[18px]">{isDark ? 'light_mode' : 'dark_mode'}</span>
                    </button>
                    <button type="button" onClick={() => navigate('/wizard/motor')} className="gradient-button px-4 py-2 text-sm">{t('ai_to_wizard')}</button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                <aside className="lg:col-span-4 space-y-4">
                    <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">{t('ai_context_title')}</h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span>Power</span><strong>{context.power} kW</strong></div>
                            <div className="flex justify-between"><span>Speed</span><strong>{context.speed} rpm</strong></div>
                            <div className="flex justify-between"><span>Belt Ratio</span><strong>{context.beltRatio}</strong></div>
                            <div className="flex justify-between"><span>Safety Factor</span><strong>{context.safetyFactor}</strong></div>
                        </div>
                    </div>

                    <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">{t('ai_quick_prompt_title')}</h2>
                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => sendQuestion(language === 'en' ? 'Generate a full draft from current wizard data' : 'Tạo draft hoàn chỉnh từ dữ liệu wizard hiện tại')}
                                className="w-full rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-left text-sm font-semibold text-blue-700 hover:bg-blue-100"
                            >
                                {language === 'en' ? 'Generate Full Draft' : 'Tạo Draft Hoàn Chỉnh'}
                            </button>
                            {(quickPrompts[language] || quickPrompts.vi).map((prompt) => (
                                <button
                                    key={prompt}
                                    type="button"
                                    onClick={() => sendQuestion(prompt)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left text-sm hover:bg-blue-50 hover:border-blue-200"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {reviewHints.length > 0 ? (
                        <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">{language === 'en' ? 'Live Design Review' : 'Đánh giá nhanh dữ liệu'}</h2>
                            <ul className="space-y-2 text-sm">
                                {reviewHints.map((hint, idx) => (
                                    <li key={`hint-${idx}`} className="rounded-lg border border-slate-200 px-3 py-2">{hint}</li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </aside>

                <section className={`lg:col-span-8 rounded-2xl border p-5 flex flex-col min-h-[70vh] ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                        {messages.map((message, index) => (
                            <div
                                key={`${message.role}-${index}`}
                                className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'assistant' ? 'bg-blue-50 text-slate-700 border border-blue-100' : 'ml-auto bg-slate-900 text-white'}`}
                            >
                                <p className="text-[10px] uppercase tracking-wider mb-1 opacity-70">{message.role === 'assistant' ? 'AI Assistant' : t('ai_you')}</p>
                                <p>{message.text}</p>
                                {message.role === 'assistant' && Array.isArray(message.actions) && message.actions.length > 0 ? (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {message.actions.slice(0, 3).map((item) => (
                                            <span key={item} className="inline-flex rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                ) : null}
                                {message.role === 'assistant' && message.confidence ? (
                                    <p className="mt-1 text-[10px] text-slate-500">Confidence: {(Number(message.confidence) * 100).toFixed(0)}% · {message.source || 'python'}</p>
                                ) : null}
                                {message.role === 'assistant' && message.draft ? (
                                    <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900/95 p-2 text-[10px] text-slate-100">{JSON.stringify(message.draft, null, 2)}</pre>
                                ) : null}
                            </div>
                        ))}
                        {sending ? (
                            <div className="max-w-[90%] rounded-2xl px-4 py-3 text-sm bg-blue-50 border border-blue-100 text-slate-600">
                                {t('ai_thinking')}
                            </div>
                        ) : null}
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-200 flex items-center gap-3">
                        <textarea
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            placeholder={t('ai_input_placeholder')}
                            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm min-h-[52px] max-h-32 outline-none focus:ring-2 focus:ring-blue-100"
                        />
                        <button
                            type="button"
                            onClick={() => sendQuestion(input)}
                            disabled={sending}
                            className="gradient-button px-5 py-3 text-sm disabled:opacity-60"
                        >
                            {t('ai_send')}
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default AIAssistant;
