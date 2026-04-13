import axiosClient from '../api/axiosClient';

export const requestFullDraft = async ({ goal, language, currentData }) => {
    const response = await axiosClient.post('/ai/generate-draft', {
        goal,
        language,
        currentData,
    });

    return response?.data?.data || null;
};

export const reviewStepData = async ({ step, language, payload }) => {
    const response = await axiosClient.post('/ai/review-step', {
        step,
        language,
        payload,
    });

    return response?.data?.data || null;
};
