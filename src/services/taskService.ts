import { supabase, IS_MOCK_MODE } from '@/lib/supabase';
import { MOCK_TASKS } from '@/lib/mockData';
import { Task, TaskFormData, TaskStatus } from '@/types';

let mockTasksStore: Task[] = [...MOCK_TASKS];

export const taskService = {
  async getTasks(userId: string): Promise<Task[]> {
    if (IS_MOCK_MODE) return mockTasksStore.filter((t) => t.user_id === userId || true);

    const { data, error } = await supabase!
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Task[];
  },

  async createTask(userId: string, formData: TaskFormData): Promise<Task> {
    const now = new Date().toISOString();
    const newTask: Task = {
      id: `task-${Date.now()}`,
      user_id: userId,
      ...formData,
      module_id: formData.module_id ?? null,
      module_title: formData.module_title ?? null,
      due_date: formData.due_date ?? null,
      created_at: now,
      updated_at: now,
    };

    if (IS_MOCK_MODE) {
      mockTasksStore = [newTask, ...mockTasksStore];
      return newTask;
    }

    const { data, error } = await supabase!
      .from('tasks')
      .insert({ ...formData, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  },

  async updateTask(taskId: string, updates: Partial<TaskFormData>): Promise<Task> {
    if (IS_MOCK_MODE) {
      mockTasksStore = mockTasksStore.map((t) =>
        t.id === taskId ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
      );
      return mockTasksStore.find((t) => t.id === taskId)!;
    }

    const { data, error } = await supabase!
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  },

  async deleteTask(taskId: string): Promise<void> {
    if (IS_MOCK_MODE) {
      mockTasksStore = mockTasksStore.filter((t) => t.id !== taskId);
      return;
    }

    const { error } = await supabase!.from('tasks').delete().eq('id', taskId);
    if (error) throw error;
  },

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
    if (IS_MOCK_MODE) {
      mockTasksStore = mockTasksStore.map((t) =>
        t.id === taskId ? { ...t, status, updated_at: new Date().toISOString() } : t
      );
      return;
    }

    const { error } = await supabase!
      .from('tasks')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) throw error;
  },
};
