import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeStore } from '@/stores/themeStore';
import { Task, TaskStatus } from '@/types';
import { Badge } from '@/components/common/Badge';
import { getTaskStatusColor, getTaskStatusLabel, formatRelativeDate, isOverdue } from '@/utils';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onStatusChange: (status: TaskStatus) => void;
  onDelete: () => void;
}

const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
};

export function TaskCard({ task, onPress, onStatusChange, onDelete }: TaskCardProps) {
  const { colors } = useThemeStore();
  const overdue = isOverdue(task.due_date) && task.status !== 'done';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: overdue ? colors.error : colors.border },
        task.status === 'done' && styles.done,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.row}>
        {/* Status toggle circle */}
        <TouchableOpacity
          style={[
            styles.statusDot,
            { borderColor: getTaskStatusColor(task.status) },
            task.status === 'done' && { backgroundColor: getTaskStatusColor('done') },
          ]}
          onPress={() => onStatusChange(STATUS_CYCLE[task.status])}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {task.status === 'done' && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              { color: colors.text },
              task.status === 'done' && styles.titleDone,
            ]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
          {task.description && (
            <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={1}>
              {task.description}
            </Text>
          )}
          <View style={styles.meta}>
            <Badge
              label={getTaskStatusLabel(task.status)}
              backgroundColor={`${getTaskStatusColor(task.status)}22`}
              color={getTaskStatusColor(task.status)}
              size="sm"
            />
            {task.module_title && (
              <Text style={[styles.module, { color: colors.textMuted }]}>
                📚 {task.module_title}
              </Text>
            )}
            {task.due_date && (
              <Text style={[styles.dueDate, { color: overdue ? colors.error : colors.textMuted }]}>
                {overdue ? '⚠️ ' : '📅 '}
                {formatRelativeDate(task.due_date)}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.deleteIcon, { color: colors.textMuted }]}>✕</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  done: { opacity: 0.65 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statusDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  content: { flex: 1 },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20,
  },
  titleDone: {
    textDecorationLine: 'line-through',
  },
  description: {
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  module: { fontSize: 12 },
  dueDate: { fontSize: 12 },
  deleteBtn: { padding: 4 },
  deleteIcon: { fontSize: 16 },
});
