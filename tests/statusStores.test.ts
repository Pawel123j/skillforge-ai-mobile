import { useTaskStore } from '@/stores/taskStore';
import { useProjectStore } from '@/stores/projectStore';
import { taskService } from '@/services/taskService';
import { projectService } from '@/services/projectService';
import { Task, Project } from '@/types';
jest.mock('@/services/taskService', () => ({ taskService: { updateTaskStatus: jest.fn(), getTasks: jest.fn(), updateTask: jest.fn() } }));
jest.mock('@/services/projectService', () => ({ projectService: { updateProjectStatus: jest.fn(), getProjects: jest.fn(), updateProject: jest.fn() } }));

beforeEach(() => {
  jest.resetAllMocks();
  useTaskStore.setState({ tasks: [{ id: 'task', status: 'todo', title: 'Test' } as Task], pendingStatus: {}, error: null });
  useProjectStore.setState({ projects: [{ id: 'project', status: 'idea' } as Project], pendingStatus: {}, error: null });
});

test.each(['403 forbidden', 'offline'])('task restores prior status and exposes error: %s', async (message) => {
  jest.mocked(taskService.updateTaskStatus).mockRejectedValue(new Error(message));
  await useTaskStore.getState().setTaskStatus('task', 'done');
  expect(useTaskStore.getState().tasks[0].status).toBe('todo');
  expect(useTaskStore.getState().error).toBe(message);
  expect(useTaskStore.getState().pendingStatus).toEqual({});
});

test('project restores prior status on failure', async () => {
  jest.mocked(projectService.updateProjectStatus).mockRejectedValue(new Error('offline'));
  await useProjectStore.getState().setProjectStatus('project', 'completed');
  expect(useProjectStore.getState().projects[0].status).toBe('idea');
  expect(useProjectStore.getState().error).toBe('offline');
});

test('repeated taps are locked while request is pending, then retry can succeed', async () => {
  let reject!: (error: Error) => void;
  jest.mocked(taskService.updateTaskStatus).mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; }));
  const pending = useTaskStore.getState().setTaskStatus('task', 'in_progress');
  await useTaskStore.getState().setTaskStatus('task', 'done');
  expect(taskService.updateTaskStatus).toHaveBeenCalledTimes(1);
  reject(new Error('offline'));
  await pending;
  jest.mocked(taskService.updateTaskStatus).mockResolvedValue(undefined);
  await useTaskStore.getState().setTaskStatus('task', 'done');
  expect(useTaskStore.getState().tasks[0].status).toBe('done');
  expect(useTaskStore.getState().error).toBeNull();
});


test('a slow refresh cannot undo a status that finished after it started', async () => {
  let finish!: (tasks: Task[]) => void;
  jest.mocked(taskService.getTasks).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const refresh = useTaskStore.getState().loadTasks('user');
  jest.mocked(taskService.updateTaskStatus).mockResolvedValue(undefined);
  await useTaskStore.getState().setTaskStatus('task', 'done');
  finish([{ id: 'task', status: 'todo' } as Task]);
  await refresh;
  expect(useTaskStore.getState().tasks[0].status).toBe('done');
});

test('a refresh started during an edit cannot discard the saved task', async () => {
  let finishRefresh!: (tasks: Task[]) => void;
  let finishEdit!: (task: Task) => void;
  jest.mocked(taskService.getTasks).mockImplementationOnce(() => new Promise(resolve => { finishRefresh = resolve; }));
  jest.mocked(taskService.updateTask).mockImplementationOnce(() => new Promise(resolve => { finishEdit = resolve; }));

  const edit = useTaskStore.getState().updateTask('task', { title: 'Saved title' });
  const refresh = useTaskStore.getState().loadTasks('user');
  finishEdit({ id: 'task', title: 'Saved title', status: 'todo' } as Task);
  await edit;
  finishRefresh([{ id: 'task', title: 'Old title', status: 'todo' } as Task]);
  await refresh;

  expect(useTaskStore.getState().tasks[0].title).toBe('Saved title');
});
