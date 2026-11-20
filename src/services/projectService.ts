import { supabase, IS_MOCK_MODE } from '@/lib/supabase';
import { MOCK_SUGGESTED_PROJECTS } from '@/lib/mockData';
import { Project, ProjectFormData, ProjectStatus, LearningGoal } from '@/types';

let mockProjectsStore: Project[] = [];
let mockId = 0;

export const projectService = {
  async getProjects(userId: string, goal: LearningGoal | null): Promise<Project[]> {
    if (IS_MOCK_MODE) {
      const suggested = goal ? MOCK_SUGGESTED_PROJECTS[goal] ?? [] : [];
      const saved = mockProjectsStore.filter((p) => p.user_id === userId);
      return [
        ...suggested.map((project) => saved.find((item) => item.id === project.id) ?? project),
        ...saved.filter((project) => !project.is_suggested),
      ];
    }

    const { data, error } = await supabase!
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Project[];
  },

  async createProject(userId: string, formData: ProjectFormData): Promise<Project> {
    const now = new Date().toISOString();
    const newProject: Project = {
      id: `proj-custom-${Date.now()}-${++mockId}`,
      user_id: userId,
      ...formData,
      goal: null,
      github_url: formData.github_url ?? null,
      is_suggested: false,
      created_at: now,
      updated_at: now,
    };

    if (IS_MOCK_MODE) {
      mockProjectsStore = [newProject, ...mockProjectsStore];
      return newProject;
    }

    const { data, error } = await supabase!
      .from('projects')
      .insert({ ...formData, user_id: userId, is_suggested: false })
      .select()
      .single();

    if (error) throw error;
    return data as Project;
  },

  async updateProject(projectId: string, updates: Partial<ProjectFormData>): Promise<Project> {
    if (IS_MOCK_MODE) {
      // Update in both suggested and custom stores
      const allProjects = [...mockProjectsStore, ...Object.values(MOCK_SUGGESTED_PROJECTS).flat()];
      const project = allProjects.find((p) => p.id === projectId);
      if (!project) throw new Error('Project not found');

      const updated = { ...project, ...updates, updated_at: new Date().toISOString() };

      mockProjectsStore = [updated, ...mockProjectsStore.filter((p) => p.id !== projectId)];

      return updated;
    }

    const { data, error } = await supabase!
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data as Project;
  },

  async updateProjectStatus(projectId: string, status: ProjectStatus): Promise<void> {
    if (IS_MOCK_MODE) {
      await projectService.updateProject(projectId, { status });
      return;
    }

    const { error } = await supabase!
      .from('projects')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', projectId);

    if (error) throw error;
  },
};
