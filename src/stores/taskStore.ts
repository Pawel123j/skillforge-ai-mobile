import { create } from 'zustand';
import { taskService } from '@/services/taskService';
import { Task, TaskFormData, TaskStatus } from '@/types';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  pendingStatus: Record<string, boolean>;

  loadTasks: (userId: string) => Promise<void>;
  createTask: (userId: string, formData: TaskFormData) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<TaskFormData>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  setTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

let mutationVersion = 0;
let loadVersion = 0;
let accountVersion = 0;

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  pendingStatus: {},

  loadTasks: async (userId) => {
    const account = accountVersion;
    const currentLoad = ++loadVersion;
    const currentMutation = mutationVersion;
    set({ isLoading: true, error: null });
    try {
      const tasks = await taskService.getTasks(userId);
      if (account !== accountVersion || currentLoad !== loadVersion || currentMutation !== mutationVersion) return;
      set({ tasks: tasks.map((item) => get().pendingStatus[item.id]
        ? get().tasks.find((current) => current.id === item.id) ?? item : item) });
    } catch (err: any) {
      if (account !== accountVersion) return;
      if (account === accountVersion && currentLoad === loadVersion && currentMutation === mutationVersion) {
        set({ error: err.message ?? 'Failed to load tasks' });
      }
    } finally {
      if (account === accountVersion && currentLoad === loadVersion) set({ isLoading: false });
    }
  },

  createTask: async (userId, formData) => {
    const account = accountVersion;
    mutationVersion++;
    set({ isLoading: true, error: null });
    try {
      const newTask = await taskService.createTask(userId, formData);
      if (account !== accountVersion) return;
      set({ tasks: [newTask, ...get().tasks] });
    } catch (err: any) {
      if (account !== accountVersion) return;
      set({ error: err.message ?? 'Failed to create task' });
      throw err;
    } finally {
      if (account === accountVersion) {
        mutationVersion++;
        set({ isLoading: false });
      }
    }
  },

  updateTask: async (taskId, updates) => {
    const account = accountVersion;
    mutationVersion++;
    set({ error: null });
    try {
      const updated = await taskService.updateTask(taskId, updates);
      if (account !== accountVersion) return;
      set({ tasks: get().tasks.map((t) => (t.id === taskId ? updated : t)) });
    } catch (err: any) {
      if (account !== accountVersion) return;
      set({ error: err.message ?? 'Failed to update task' });
      throw err;
    } finally {
      if (account === accountVersion) {
        mutationVersion++;
      }
    }
  },

  deleteTask: async (taskId) => {
    const account = accountVersion;
    mutationVersion++;
    set({ error: null });
    try {
      await taskService.deleteTask(taskId);
      if (account !== accountVersion) return;
      set({ tasks: get().tasks.filter((t) => t.id !== taskId) });
    } catch (err: any) {
      if (account !== accountVersion) return;
      set({ error: err.message ?? 'Failed to delete task' });
      throw err;
    } finally {
      if (account === accountVersion) {
        mutationVersion++;
      }
    }
  },

  setTaskStatus: async (taskId, status) => {
    const account = accountVersion;
    // One write per record: repeated taps cannot race an earlier response.
    if (get().pendingStatus[taskId]) return;
    const previous = get().tasks.find((item) => item.id === taskId);
    if (!previous || previous.status === status) return;
    mutationVersion++;
    set({
      error: null,
      pendingStatus: { ...get().pendingStatus, [taskId]: true },
      tasks: get().tasks.map((item) => item.id === taskId ? { ...item, status } : item),
    });
    try {
      await taskService.updateTaskStatus(taskId, status);
      if (account !== accountVersion) return;
    } catch (err: any) {
      if (account !== accountVersion) return;
      set({
        tasks: get().tasks.map((item) => item.id === taskId ? { ...item, status: previous.status } : item),
        error: err.message ?? 'Could not save task status. Please try again.',
      });
    } finally {
      if (account === accountVersion) {
        mutationVersion++;
        const pendingStatus = { ...get().pendingStatus };
        delete pendingStatus[taskId];
        set({ pendingStatus });
      }
    }
  },

  reset: () => {
    accountVersion++;
    mutationVersion++;
    loadVersion++;
    set({ tasks: [], pendingStatus: {}, error: null, isLoading: false });
  },
  clearError: () => set({ error: null }),
}));
