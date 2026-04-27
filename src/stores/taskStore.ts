import { create } from 'zustand';
import { taskService } from '@/services/taskService';
import { Task, TaskFormData, TaskStatus } from '@/types';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;

  loadTasks: (userId: string) => Promise<void>;
  createTask: (userId: string, formData: TaskFormData) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<TaskFormData>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  setTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  clearError: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  loadTasks: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await taskService.getTasks(userId);
      set({ tasks });
    } catch (err: any) {
      set({ error: err.message ?? 'Failed to load tasks' });
    } finally {
      set({ isLoading: false });
    }
  },

  createTask: async (userId, formData) => {
    set({ isLoading: true, error: null });
    try {
      const newTask = await taskService.createTask(userId, formData);
      set({ tasks: [newTask, ...get().tasks] });
    } catch (err: any) {
      set({ error: err.message ?? 'Failed to create task' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  updateTask: async (taskId, updates) => {
    try {
      const updated = await taskService.updateTask(taskId, updates);
      set({ tasks: get().tasks.map((t) => (t.id === taskId ? updated : t)) });
    } catch (err: any) {
      set({ error: err.message ?? 'Failed to update task' });
      throw err;
    }
  },

  deleteTask: async (taskId) => {
    try {
      await taskService.deleteTask(taskId);
      set({ tasks: get().tasks.filter((t) => t.id !== taskId) });
    } catch (err: any) {
      set({ error: err.message ?? 'Failed to delete task' });
      throw err;
    }
  },

  setTaskStatus: async (taskId, status) => {
    // Optimistic update
    set({ tasks: get().tasks.map((t) => (t.id === taskId ? { ...t, status } : t)) });
    try {
      await taskService.updateTaskStatus(taskId, status);
    } catch (err: any) {
      // Revert on failure
      set({ tasks: get().tasks.map((t) => (t.id === taskId ? { ...t, status: t.status } : t)) });
      set({ error: err.message ?? 'Failed to update task status' });
    }
  },

  clearError: () => set({ error: null }),
}));
