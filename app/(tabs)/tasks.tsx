import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/taskStore';
import { TaskCard } from '@/components/cards/TaskCard';
import { TaskForm } from '@/components/forms/TaskForm';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { Task, TaskStatus, TaskFormData } from '@/types';

type FilterOption = 'all' | TaskStatus;

const FILTERS: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

export default function TasksScreen() {
  const { colors } = useThemeStore();
  const { userId } = useAuthStore();
  const { tasks, isLoading, loadTasks, createTask, updateTask, deleteTask, setTaskStatus } = useTaskStore();

  const [filter, setFilter] = useState<FilterOption>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (userId) loadTasks(userId);
  }, [userId]);

  const filteredTasks = tasks.filter((t) =>
    filter === 'all' ? true : t.status === filter
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    if (userId) await loadTasks(userId);
    setIsRefreshing(false);
  };

  const handleCreate = async (data: TaskFormData) => {
    if (!userId) return;
    setIsFormLoading(true);
    try {
      await createTask(userId, data);
      setShowForm(false);
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleUpdate = async (data: TaskFormData) => {
    if (!editingTask) return;
    setIsFormLoading(true);
    try {
      await updateTask(editingTask.id, data);
      setEditingTask(null);
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleDelete = (taskId: string) => {
    deleteTask(taskId);
  };

  const taskCounts = {
    all: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.screenLabel, { color: colors.textSecondary }]}>Task Manager</Text>
          <Text style={[styles.title, { color: colors.text }]}>My Tasks</Text>
        </View>
        <Button
          title="+ New Task"
          onPress={() => setShowForm(true)}
          size="sm"
        />
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {FILTERS.map((f) => {
          const isActive = filter === f.value;
          return (
            <TouchableOpacity
              key={f.value}
              style={[
                styles.filterBtn,
                {
                  backgroundColor: isActive ? colors.primary : colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setFilter(f.value)}
            >
              <Text style={[styles.filterText, { color: isActive ? '#FFF' : colors.textSecondary }]}>
                {f.label}
              </Text>
              <View
                style={[
                  styles.filterCount,
                  { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : colors.surfaceSecondary },
                ]}
              >
                <Text style={[styles.filterCountText, { color: isActive ? '#FFF' : colors.textMuted }]}>
                  {taskCounts[f.value]}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Task List */}
      {isLoading && !isRefreshing ? (
        <LoadingState message="Loading tasks..." />
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {filteredTasks.length === 0 ? (
            <EmptyState
              icon="✅"
              title={filter === 'done' ? 'No completed tasks yet' : 'No tasks here'}
              message={
                filter === 'all'
                  ? "You haven't added any tasks yet. Create your first task to get started!"
                  : `No tasks with status "${filter.replace('_', ' ')}".`
              }
              actionLabel={filter === 'all' ? 'Add First Task' : undefined}
              onAction={filter === 'all' ? () => setShowForm(true) : undefined}
            />
          ) : (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onPress={() => setEditingTask(task)}
                onStatusChange={(status) => setTaskStatus(task.id, status)}
                onDelete={() => handleDelete(task.id)}
              />
            ))
          )}
          <View style={styles.bottomPad} />
        </ScrollView>
      )}

      {/* Create / Edit Modal */}
      <Modal
        visible={showForm || editingTask !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowForm(false);
          setEditingTask(null);
        }}
      >
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingTask ? 'Edit Task' : 'New Task'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowForm(false);
                setEditingTask(null);
              }}
            >
              <Text style={[styles.modalClose, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.modalContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TaskForm
              initialValues={editingTask ? {
                title: editingTask.title,
                description: editingTask.description,
                status: editingTask.status,
                module_id: editingTask.module_id ?? undefined,
                module_title: editingTask.module_title ?? undefined,
                due_date: editingTask.due_date ?? undefined,
              } : undefined}
              onSubmit={editingTask ? handleUpdate : handleCreate}
              onCancel={() => {
                setShowForm(false);
                setEditingTask(null);
              }}
              isLoading={isFormLoading}
            />
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  screenLabel: { fontSize: 13, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  filtersContainer: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 16,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  filterText: { fontSize: 14, fontWeight: '600' },
  filterCount: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  filterCountText: { fontSize: 12, fontWeight: '700' },
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    flexGrow: 1,
  },
  bottomPad: { height: 20 },
  modal: {
    flex: 1,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalClose: { fontSize: 20 },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
});
