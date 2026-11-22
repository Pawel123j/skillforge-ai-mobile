import { create } from 'zustand';
import { projectService } from '@/services/projectService';
import { Project, ProjectFormData, ProjectStatus, LearningGoal } from '@/types';

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  pendingStatus: Record<string, boolean>;

  loadProjects: (userId: string, goal: LearningGoal | null) => Promise<void>;
  createProject: (userId: string, formData: ProjectFormData) => Promise<void>;
  updateProject: (projectId: string, updates: Partial<ProjectFormData>) => Promise<void>;
  setProjectStatus: (projectId: string, status: ProjectStatus) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

let mutationVersion = 0;
let loadVersion = 0;
let accountVersion = 0;

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  isLoading: false,
  error: null,
  pendingStatus: {},

  loadProjects: async (userId, goal) => {
    const account = accountVersion;
    const currentLoad = ++loadVersion;
    const currentMutation = mutationVersion;
    set({ isLoading: true, error: null });
    try {
      const projects = await projectService.getProjects(userId, goal);
      if (account !== accountVersion || currentLoad !== loadVersion || currentMutation !== mutationVersion) return;
      set({ projects: projects.map((item) => get().pendingStatus[item.id]
        ? get().projects.find((current) => current.id === item.id) ?? item : item) });
    } catch (err: any) {
      if (account !== accountVersion) return;
      if (account === accountVersion && currentLoad === loadVersion && currentMutation === mutationVersion) {
        set({ error: err.message ?? 'Failed to load projects' });
      }
    } finally {
      if (account === accountVersion && currentLoad === loadVersion) set({ isLoading: false });
    }
  },

  createProject: async (userId, formData) => {
    const account = accountVersion;
    mutationVersion++;
    set({ isLoading: true, error: null });
    try {
      const newProject = await projectService.createProject(userId, formData);
      if (account !== accountVersion) return;
      set({ projects: [newProject, ...get().projects] });
    } catch (err: any) {
      if (account !== accountVersion) return;
      set({ error: err.message ?? 'Failed to create project' });
      throw err;
    } finally {
      if (account === accountVersion) {
        mutationVersion++;
        set({ isLoading: false });
      }
    }
  },

  updateProject: async (projectId, updates) => {
    const account = accountVersion;
    mutationVersion++;
    set({ error: null });
    try {
      const updated = await projectService.updateProject(projectId, updates);
      if (account !== accountVersion) return;
      set({
        projects: get().projects.map((p) => (p.id === projectId ? updated : p)),
      });
    } catch (err: any) {
      if (account !== accountVersion) return;
      set({ error: err.message ?? 'Failed to update project' });
      throw err;
    } finally {
      if (account === accountVersion) {
        mutationVersion++;
      }
    }
  },

  setProjectStatus: async (projectId, status) => {
    const account = accountVersion;
    // One write per record: repeated taps cannot race an earlier response.
    if (get().pendingStatus[projectId]) return;
    const previous = get().projects.find((item) => item.id === projectId);
    if (!previous || previous.status === status) return;
    mutationVersion++;
    set({
      error: null,
      pendingStatus: { ...get().pendingStatus, [projectId]: true },
      projects: get().projects.map((item) => item.id === projectId ? { ...item, status } : item),
    });
    try {
      await projectService.updateProjectStatus(projectId, status);
      if (account !== accountVersion) return;
    } catch (err: any) {
      if (account !== accountVersion) return;
      set({
        projects: get().projects.map((item) => item.id === projectId ? { ...item, status: previous.status } : item),
        error: err.message ?? 'Could not save project status. Please try again.',
      });
    } finally {
      if (account === accountVersion) {
        mutationVersion++;
        const pendingStatus = { ...get().pendingStatus };
        delete pendingStatus[projectId];
        set({ pendingStatus });
      }
    }
  },

  reset: () => {
    accountVersion++;
    mutationVersion++;
    loadVersion++;
    set({ projects: [], pendingStatus: {}, error: null, isLoading: false });
  },
  clearError: () => set({ error: null }),
}));
