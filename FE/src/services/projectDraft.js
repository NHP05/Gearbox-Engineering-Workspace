import axiosClient from '../api/axiosClient';
import { getWizardState, patchWizardState, toProjectPayload } from '../utils/wizardState';

const LOCAL_DRAFTS_KEY = 'gearbox_local_drafts';
const LOCAL_REMOVED_PROJECT_IDS_KEY = 'gearbox_local_removed_project_ids';

// API-first by default so projects stay consistent across users/admin and DB.
const FORCE_LOCAL_PROJECT_STORE = String(import.meta.env.VITE_FORCE_LOCAL_PROJECT_STORE || 'false').toLowerCase() === 'true';

export const isUsingLocalProjectStore = () => FORCE_LOCAL_PROJECT_STORE;

const resolveUserScopeKey = () => {
    try {
        const user = JSON.parse(localStorage.getItem('gearbox_user') || '{}');
        const candidate = user?.id || user?.username || 'anonymous';
        return String(candidate || 'anonymous').trim().toLowerCase() || 'anonymous';
    } catch (error) {
        return 'anonymous';
    }
};

const getLocalDraftsStorageKey = () => `${LOCAL_DRAFTS_KEY}_${resolveUserScopeKey()}`;
const getRemovedProjectIdsStorageKey = () => `${LOCAL_REMOVED_PROJECT_IDS_KEY}_${resolveUserScopeKey()}`;

const readLocalDrafts = () => {
    try {
        const parsed = JSON.parse(localStorage.getItem(getLocalDraftsStorageKey()) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
};

const writeLocalDrafts = (drafts) => {
    localStorage.setItem(getLocalDraftsStorageKey(), JSON.stringify(drafts));
};

const readRemovedProjectIds = () => {
    try {
        const parsed = JSON.parse(localStorage.getItem(getRemovedProjectIdsStorageKey()) || '[]');
        const list = Array.isArray(parsed) ? parsed : [];
        return new Set(list.map((item) => String(item)));
    } catch (error) {
        return new Set();
    }
};

const writeRemovedProjectIds = (ids) => {
    localStorage.setItem(getRemovedProjectIdsStorageKey(), JSON.stringify(Array.from(ids)));
};

const addRemovedProjectId = (projectId) => {
    const value = String(projectId || '').trim();
    if (!value) return;

    const removed = readRemovedProjectIds();
    removed.add(value);
    writeRemovedProjectIds(removed);
};

const clearRemovedProjectId = (projectId) => {
    const value = String(projectId || '').trim();
    if (!value) return;

    const removed = readRemovedProjectIds();
    if (!removed.has(value)) return;

    removed.delete(value);
    writeRemovedProjectIds(removed);
};

const updateLocalDraftById = (projectId, patch) => {
    const drafts = readLocalDrafts();
    const next = drafts.map((item) => {
        if (String(item.id) !== String(projectId)) return item;
        return {
            ...item,
            ...patch,
            updatedAt: new Date().toISOString(),
        };
    });

    writeLocalDrafts(next);
    return next.find((item) => String(item.id) === String(projectId)) || null;
};

const removeLocalDraftById = (projectId) => {
    const drafts = readLocalDrafts();
    const next = drafts.filter((item) => String(item.id) !== String(projectId));
    writeLocalDrafts(next);
    return drafts.length !== next.length;
};

export const getLocalDrafts = () => readLocalDrafts();

const isLocalProjectId = (projectId) => String(projectId || '').startsWith('local-');

const normalizeCurrentProjectId = (projectId) => {
    const value = String(projectId || '').trim();
    if (!value || value === 'undefined' || value === 'null' || value === 'NaN') {
        return null;
    }
    return value;
};

const resolveProjectId = (projectId) => normalizeCurrentProjectId(projectId);

const upsertLocalDraft = (projectId, payload) => {
    const drafts = readLocalDrafts();

    if (projectId) {
        const idx = drafts.findIndex((item) => String(item.id) === String(projectId));
        if (idx >= 0) {
            drafts[idx] = {
                ...drafts[idx],
                ...payload,
                updatedAt: new Date().toISOString(),
            };
            writeLocalDrafts(drafts);
            return drafts[idx];
        }
    }

    const fallbackProject = {
        id: projectId || `local-${Date.now()}`,
        ...payload,
        status: payload.status || 'draft',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
    };

    drafts.unshift(fallbackProject);
    clearRemovedProjectId(fallbackProject.id);
    writeLocalDrafts(drafts.slice(0, 30));
    return fallbackProject;
};

const syncApiProjectsToLocal = (apiProjects = []) => {
    if (!Array.isArray(apiProjects) || apiProjects.length === 0) {
        return;
    }

    const drafts = readLocalDrafts();
    const knownIds = new Set(drafts.map((item) => String(item.id)));
    let changed = false;

    apiProjects.forEach((item) => {
        const id = normalizeCurrentProjectId(item?.id);
        if (!id || knownIds.has(id)) return;

        drafts.push({
            ...item,
            id,
            updatedAt: item?.updatedAt || new Date().toISOString(),
            createdAt: item?.createdAt || new Date().toISOString(),
        });
        knownIds.add(id);
        changed = true;
    });

    if (changed) {
        writeLocalDrafts(drafts.slice(0, 60));
    }
};

const mergeFromLocalStore = (apiProjects = []) => {
    const removedIds = readRemovedProjectIds();
    const localDrafts = readLocalDrafts();

    const filteredApi = (Array.isArray(apiProjects) ? apiProjects : []).filter((item) => !removedIds.has(String(item.id)));
    const mergedMap = new Map();

    filteredApi.forEach((item) => {
        const id = normalizeCurrentProjectId(item?.id);
        if (!id) return;
        mergedMap.set(id, item);
    });

    localDrafts.forEach((item) => {
        const id = normalizeCurrentProjectId(item?.id);
        if (!id || removedIds.has(id)) return;
        mergedMap.set(id, item);
    });

    return Array.from(mergedMap.values()).sort((a, b) => {
        const aTime = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
        const bTime = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
        return bTime - aTime;
    });
};

export const saveProjectDraft = async (override = {}) => {
    const state = getWizardState();
    const currentProjectId = normalizeCurrentProjectId(localStorage.getItem('current_project'));
    const payload = {
        ...toProjectPayload(state),
        ...override,
    };
    const normalizedName = String(payload.project_name || '').trim();

    if (!currentProjectId && !normalizedName) {
        const error = new Error('Project name is required.');
        error.code = 'PROJECT_NAME_REQUIRED';
        throw error;
    }

    if (normalizedName) {
        payload.project_name = normalizedName;
    } else {
        delete payload.project_name;
    }

    const persistMeta = (project) => {
        localStorage.setItem('current_project', String(project.id));
        patchWizardState({
            meta: {
                projectName: project.project_name || payload.project_name,
            },
        });
    };

    if (isUsingLocalProjectStore()) {
        const localProject = upsertLocalDraft(currentProjectId, payload);
        persistMeta(localProject);

        return {
            success: true,
            source: 'local',
            project: localProject,
        };
    }

    if (currentProjectId && !isLocalProjectId(currentProjectId)) {
        try {
            const response = await axiosClient.put(`/project/${encodeURIComponent(currentProjectId)}`, payload);
            const project = response?.data?.data || { id: currentProjectId, ...payload };
            persistMeta(project);
            return {
                success: true,
                source: 'api',
                project,
            };
        } catch (error) {
            // Continue with create fallback below.
        }
    }

    try {
        const response = await axiosClient.post('/project/create', payload);
        const project = response?.data?.data;

        if (project?.id) {
            persistMeta(project);
        }

        return {
            success: true,
            source: 'api',
            project,
        };
    } catch (error) {
        const status = Number(error?.response?.status);
        const message = String(error?.response?.data?.message || '');

        if (status === 400 && /project name is required/i.test(message)) {
            const requiredError = new Error(message || 'Project name is required.');
            requiredError.code = 'PROJECT_NAME_REQUIRED';
            throw requiredError;
        }

        const fallbackProject = upsertLocalDraft(
            currentProjectId && isLocalProjectId(currentProjectId) ? currentProjectId : null,
            payload
        );
        persistMeta(fallbackProject);

        return {
            success: true,
            source: 'local',
            project: fallbackProject,
        };
    }
};

export const mergeProjects = (apiProjects = []) => {
    if (isUsingLocalProjectStore()) {
        syncApiProjectsToLocal(apiProjects);
        return mergeFromLocalStore(apiProjects);
    }

    const localDrafts = readLocalDrafts();

    if (!Array.isArray(apiProjects) || apiProjects.length === 0) {
        return localDrafts;
    }

    const knownIds = new Set(apiProjects.map((item) => String(item.id)));
    const extras = localDrafts.filter((item) => !knownIds.has(String(item.id)));

    return [...apiProjects, ...extras];
};

export const updateProjectById = async (projectId, patch = {}) => {
    const resolvedProjectId = resolveProjectId(projectId);

    if (!resolvedProjectId) {
        throw new Error('Project ID is invalid.');
    }

    if (isUsingLocalProjectStore()) {
        const localProject = upsertLocalDraft(resolvedProjectId, patch);
        return {
            success: true,
            source: 'local',
            project: localProject,
        };
    }

    if (isLocalProjectId(resolvedProjectId)) {
        const localProject = updateLocalDraftById(resolvedProjectId, patch);
        if (!localProject) {
            throw new Error('Local project not found.');
        }

        return {
            success: true,
            source: 'local',
            project: localProject,
        };
    }

    try {
        const response = await axiosClient.put(`/project/${encodeURIComponent(resolvedProjectId)}`, patch);
        return {
            success: true,
            source: 'api',
            project: response?.data?.data,
        };
    } catch (error) {
        const localProject = updateLocalDraftById(resolvedProjectId, patch);
        if (!localProject) {
            throw error;
        }

        return {
            success: true,
            source: 'local',
            project: localProject,
        };
    }
};

export const deleteProjectById = async (projectId) => {
    const resolvedProjectId = resolveProjectId(projectId);

    if (!resolvedProjectId) {
        throw new Error('Project ID is invalid.');
    }

    if (isUsingLocalProjectStore()) {
        removeLocalDraftById(resolvedProjectId);
        addRemovedProjectId(resolvedProjectId);

        if (String(localStorage.getItem('current_project') || '') === String(resolvedProjectId)) {
            localStorage.removeItem('current_project');
        }

        return {
            success: true,
            source: 'local',
        };
    }

    if (isLocalProjectId(resolvedProjectId)) {
        const removed = removeLocalDraftById(resolvedProjectId);
        if (!removed) {
            throw new Error('Local project not found.');
        }

        return {
            success: true,
            source: 'local',
        };
    }

    try {
        await axiosClient.delete(`/project/${encodeURIComponent(resolvedProjectId)}`);
        return {
            success: true,
            source: 'api',
        };
    } catch (error) {
        const removed = removeLocalDraftById(resolvedProjectId);
        if (!removed) {
            throw error;
        }

        return {
            success: true,
            source: 'local',
        };
    }
};
