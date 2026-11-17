import { projectService } from '@/services/projectService';
import { taskService } from '@/services/taskService';
import { MOCK_USER_ID, MOCK_SUGGESTED_PROJECTS } from '@/lib/mockData';
import { ProjectFormData, TaskFormData } from '@/types';
jest.mock('@/lib/supabase', () => ({ IS_MOCK_MODE: true, supabase: null }));

test('suggested project status and edits survive rereads without duplicates', async () => {
  const project = MOCK_SUGGESTED_PROJECTS.frontend[0];
  await projectService.updateProjectStatus(project.id, 'building');
  await projectService.updateProject(project.id, { title: 'Edited suggested project' });
  await projectService.updateProjectStatus(project.id, 'completed');
  const projects = await projectService.getProjects(MOCK_USER_ID, 'frontend');
  expect(projects.filter(item => item.id === project.id)).toHaveLength(1);
  expect(projects.find(item => item.id === project.id)).toMatchObject({ title: 'Edited suggested project', status: 'completed' });
  expect(MOCK_SUGGESTED_PROJECTS.frontend[0]).toEqual(project);
});

test('rapid demo creation has unique ids and filters task owners', async () => {
  const clock = jest.spyOn(Date, 'now').mockReturnValue(1234);
  try {
    const tasks = await Promise.all([1, 2].map(() => taskService.createTask('isolated', { title: 'Task', description: '', status: 'todo', priority: 'medium' } as TaskFormData)));
    const projects = await Promise.all([1, 2].map(() => projectService.createProject('isolated', { title: 'Project', status: 'idea' } as ProjectFormData)));
    expect(new Set(tasks.map(item => item.id)).size).toBe(2);
    expect(new Set(projects.map(item => item.id)).size).toBe(2);
    expect((await taskService.getTasks('isolated')).every(item => item.user_id === 'isolated')).toBe(true);
    expect((await taskService.getTasks('another-account'))).toEqual([]);
  } finally { clock.mockRestore(); }
});
