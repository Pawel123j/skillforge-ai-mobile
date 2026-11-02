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
}

let mutationVersion = 0;
let loadVersion = 0;

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  isLoading: false,
  error: null,
  pendingStatus: {},

  loadProjects: async (userId, goal) => {
    const currentLoad = ++loadVersion;
    const currentMutation = mutationVersion;
    set({ isLoading: true, error: null });
    try {
      const projects = await projectService.getProjects(userId, goal);
      if (currentLoad !== loadVersion || currentMutation !== mutationVersion) return;
      set({ projects: projects.map((item) => get().pendingStatus[item.id]
        ? get().projects.find((current) => current.id === item.id) ?? item : item) });
    } catch (err: any) {
      if (currentLoad === loadVersion && currentMutation === mutationVersion) {
        set({ error: err.message ?? 'Failed to load projects' });
      }
    } finally {
      if (currentLoad === loadVersion) set({ isLoading: false });
    }
  },

  createProject: async (userId, formData) => {
    mutationVersion++;
    set({ error: null });
    set({ isLoading: true, error: null });
    try {
      const newProject = await projectService.createProject(userId, formData);
      set({ projects: [newProject, ...get().projects] });
    } catch (err: any) {
      set({ error: err.message ?? 'Failed to create project' });
      throw err;
    } finally {
      mutationVersion++;
      set({ isLoading: false });
    }
  },

  updateProject: async (projectId, updates) => {
    mutationVersion++;
    set({ error: null });
    try {
      const updated = await projectService.updateProject(projectId, updates);
      set({
        projects: get().projects.map((p) => (p.id === projectId ? updated : p)),
      });
    } catch (err: any) {
      set({ error: err.message ?? 'Failed to update project' });
      throw err;
    } finally {
      mutationVersion++;
    }
  },

  setProjectStatus: async (projectId, status) => {
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
    } catch (err: any) {
      set({
        projects: get().projects.map((item) => item.id === projectId ? { ...item, status: previous.status } : item),
        error: err.message ?? 'Could not save project status. Please try again.',
      });
    } finally {
      mutationVersion++;
      const pendingStatus = { ...get().pendingStatus };
      delete pendingStatus[projectId];
      set({ pendingStatus });
    }
  },

  clearError: () => set({ error: null }),
}));
