const WIZARD_STATE_KEY = 'gearbox_wizard_state_v1';

const baseState = {
    step1Input: {
        power: 15.5,
        speed: 1450,
        loadType: 'constant',
        life: 20000,
    },
    selectedMotor: null,
    step1Result: null,
    step3Input: {
        power: 15.5,
        speed: 1450,
        uBelt: 3,
        d1: 120,
    },
    step3Result: null,
    step4Result: null,
    designState: {
        spurTeeth: 24,
        faceWidth: 25,
        gearMode: 'spiral',
        bevelAngle: 90,
        viewMode: 'iso',
    },
    meta: {
        projectName: '',
        updatedAt: null,
    },
    stepSaved: {
        1: false,
        2: false,
        3: false,
        4: false,
        5: false,
    },
};

const parseJson = (value, fallback) => {
    try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch (error) {
        return fallback;
    }
};

export const getWizardState = () => {
    const stored = parseJson(localStorage.getItem(WIZARD_STATE_KEY), {});
    return {
        ...baseState,
        ...stored,
        step1Input: {
            ...baseState.step1Input,
            ...(stored.step1Input || {}),
        },
        designState: {
            ...baseState.designState,
            ...(stored.designState || {}),
        },
        step3Input: {
            ...baseState.step3Input,
            ...(stored.step3Input || {}),
        },
        meta: {
            ...baseState.meta,
            ...(stored.meta || {}),
        },
        stepSaved: {
            ...baseState.stepSaved,
            ...(stored.stepSaved || {}),
        },
    };
};

export const patchWizardState = (patch) => {
    const current = getWizardState();
    const next = {
        ...current,
        ...patch,
        step1Input: {
            ...current.step1Input,
            ...(patch.step1Input || {}),
        },
        designState: {
            ...current.designState,
            ...(patch.designState || {}),
        },
        step3Input: {
            ...current.step3Input,
            ...(patch.step3Input || {}),
        },
        meta: {
            ...current.meta,
            ...(patch.meta || {}),
            updatedAt: new Date().toISOString(),
        },
        stepSaved: {
            ...current.stepSaved,
            ...(patch.stepSaved || {}),
        },
    };

    localStorage.setItem(WIZARD_STATE_KEY, JSON.stringify(next));
    return next;
};

export const resetWizardState = () => {
    localStorage.removeItem(WIZARD_STATE_KEY);
};

export const toProjectPayload = (stateOverride = null) => {
    const state = stateOverride || getWizardState();
    const power = Number(state?.step1Input?.power);
    const speed = Number(state?.step1Input?.speed);

    const safePower = Number.isFinite(power) && power > 0 ? power : 15.5;
    const safeSpeed = Number.isFinite(speed) && speed > 0 ? speed : 1450;
    const safeLife = Number(state?.step1Input?.life) || 20000;

    const explicitProjectName = String(state?.meta?.projectName || '').trim();

    return {
        project_name: explicitProjectName,
        power_P: safePower,
        speed_n: safeSpeed,
        lifetime_L: safeLife,
        load_type: state?.step1Input?.loadType || 'constant',
    };
};

export const getStoredStepData = () => ({
    step1: parseJson(localStorage.getItem('step1_result'), {}),
    step3: parseJson(localStorage.getItem('step3_result'), {}),
    step4: parseJson(localStorage.getItem('step4_result'), {}),
});

export const setStepSaved = (stepNumber, saved = true) => {
    const step = String(stepNumber);
    return patchWizardState({
        stepSaved: {
            [step]: Boolean(saved),
        },
    });
};

export const invalidateFromStep = (stepNumber) => {
    const start = Number(stepNumber);
    const nextState = {};

    for (let step = start; step <= 5; step += 1) {
        nextState[String(step)] = false;
    }

    return patchWizardState({ stepSaved: nextState });
};

export const isStepSaved = (stepNumber) => {
    const state = getWizardState();
    return Boolean(state?.stepSaved?.[String(stepNumber)]);
};

export const canAccessStep = (stepNumber) => {
    const target = Number(stepNumber);
    if (!Number.isFinite(target) || target <= 1) return true;

    const state = getWizardState();
    for (let step = 1; step < target; step += 1) {
        if (!state?.stepSaved?.[String(step)]) {
            return false;
        }
    }

    return true;
};
