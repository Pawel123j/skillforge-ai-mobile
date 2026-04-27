import { create } from 'zustand';
import { projectService } from '@/services/projectService';
import { Project, ProjectFormData, ProjectStatus, LearningGoal } from '@/types';

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;

  loadProjects: (userId: string, goal: LearningGoal | null) => Promise<void>;
  createProject: (userId: string, formData: ProjectFormData) => Promise<void>;
  updateProject: (projectId: string, updates: Partial<ProjectFormData>) => Promise<void>;
  setProjectStatus: (projectId: string, status: ProjectStatus) => Promise<void>;
  clearError: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  isLoading: false,
  error: null,

  loadProjects: async (userId, goal) => {
    set({ isLoading: true, error: null });
    try {
      const projects = await projectService.getProjects(userId, goal);
      set({ projects });
    } catch (err: any) {
      set({ error: err.message ?? 'Failed to load projects' });
    } finally {
      set({ isLoading: false });
    }
  },

  createProject: async (userId, formData) => {
    set({ isLoading: true, error: null });
    try {
      const newProject = await projectService.createProject(userId, formData);
      set({ projects: [newProject, ...get().projects] });
    } catch (err: any) {
      set({ error: err.message ?? 'Failed to create project' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  updateProject: async (projectId, updates) => {
    try {
      const updated = await projectService.updateProject(projectId, updates);
      set({
        projects: get().projects.map((p) => (p.id === projectId ? updated : p)),
      });
    } catch (err: any) {
      set({ error: err.message ?? 'Failed to update project' });
      throw err;
    }
  },

  setProjectStatus: async (projectId, status) => {
    // Optimistic update
    set({
      projects: get().projects.map((p) => (p.id === projectId ? { ...p, status } : p)),
    });
    try {
      await projectService.updateProjectStatus(projectId, status);
    } catch (err: any) {
      set({ error: err.message ?? 'Failed to update project status' });
    }
  },

  clearError: () => set({ error: null }),
}));
