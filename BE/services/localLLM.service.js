const DEFAULT_TIMEOUT_MS = Number(process.env.LOCAL_LLM_TIMEOUT_MS || 15000);

const hasFetch = typeof fetch === 'function';

const parseJsonSafe = (text, fallback = null) => {
    try {
        return JSON.parse(text);
    } catch (error) {
        return fallback;
    }
};

const withTimeoutSignal = (timeoutMs = DEFAULT_TIMEOUT_MS) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return {
        signal: controller.signal,
        clear: () => clearTimeout(timer),
    };
};

const callOllama = async ({ prompt, model, timeoutMs }) => {
    const endpoint = process.env.OLLAMA_ENDPOINT || 'http://127.0.0.1:11434/api/chat';
    const activeModel = model || process.env.LOCAL_LLM_MODEL || process.env.OLLAMA_MODEL || 'llama3';

    const payload = {
        model: activeModel,
        stream: false,
        messages: [
            { role: 'system', content: 'You are an engineering assistant. Return concise JSON only.' },
            { role: 'user', content: prompt },
        ],
    };

    const { signal, clear } = withTimeoutSignal(timeoutMs);
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal,
        });

        if (!response.ok) {
            throw new Error(`Ollama response ${response.status}`);
        }

        const data = await response.json();
        return data?.message?.content || '';
    } finally {
        clear();
    }
};

const callLMStudio = async ({ prompt, model, timeoutMs }) => {
    const endpoint = process.env.LMSTUDIO_ENDPOINT || 'http://127.0.0.1:1234/v1/chat/completions';
    const activeModel = model || process.env.LOCAL_LLM_MODEL || process.env.LMSTUDIO_MODEL || 'local-model';

    const payload = {
        model: activeModel,
        temperature: 0.2,
        messages: [
            { role: 'system', content: 'You are an engineering assistant. Return concise JSON only.' },
            { role: 'user', content: prompt },
        ],
    };

    const { signal, clear } = withTimeoutSignal(timeoutMs);
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal,
        });

        if (!response.ok) {
            throw new Error(`LM Studio response ${response.status}`);
        }

        const data = await response.json();
        return data?.choices?.[0]?.message?.content || '';
    } finally {
        clear();
    }
};

const extractJsonText = (rawText) => {
    if (!rawText) return null;
    const direct = parseJsonSafe(rawText);
    if (direct) return direct;

    const first = rawText.indexOf('{');
    const last = rawText.lastIndexOf('}');
    if (first >= 0 && last > first) {
        return parseJsonSafe(rawText.slice(first, last + 1));
    }

    return null;
};

const askLocalLLMJson = async ({ prompt, provider, model, timeoutMs }) => {
    if (!hasFetch) {
        throw new Error('Global fetch is not available in current Node runtime.');
    }

    const activeProvider = String(provider || process.env.LOCAL_LLM_PROVIDER || 'ollama').toLowerCase();
    const raw = activeProvider === 'lmstudio'
        ? await callLMStudio({ prompt, model, timeoutMs })
        : await callOllama({ prompt, model, timeoutMs });

    return {
        raw,
        parsed: extractJsonText(raw),
        provider: activeProvider,
        model: model || process.env.LOCAL_LLM_MODEL || null,
    };
};

module.exports = {
    askLocalLLMJson,
};
