import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useThemeStore } from '@/stores/themeStore';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { TaskFormData, TaskStatus } from '@/types';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().max(500, 'Description too long').default(''),
  status: z.enum(['todo', 'in_progress', 'done']),
  due_date: z.string().default(''),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
  initialValues?: Partial<TaskFormData>;
  onSubmit: (data: TaskFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

export function TaskForm({ initialValues, onSubmit, onCancel, isLoading }: TaskFormProps) {
  const { colors } = useThemeStore();

  const { control, handleSubmit, formState: { errors } } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema) as any,
    defaultValues: {
      title: initialValues?.title ?? '',
      description: initialValues?.description ?? '',
      status: initialValues?.status ?? 'todo',
      due_date: initialValues?.due_date ?? '',
    },
  });

  const handleFormSubmit: SubmitHandler<TaskFormValues> = async (values) => {
    await onSubmit({
      title: values.title,
      description: values.description ?? '',
      status: values.status,
      due_date: values.due_date || undefined,
    });
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Task Title *"
            placeholder="e.g. Complete CSS Flexbox exercise"
            value={value}
            onChangeText={onChange}
            error={errors.title?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Description"
            placeholder="What do you need to do?"
            value={value}
            onChangeText={onChange}
            multiline
            numberOfLines={3}
            error={errors.description?.message}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
        )}
      />

      <Controller
        control={control}
        name="status"
        render={({ field: { onChange, value } }) => (
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Status</Text>
            <View style={styles.statusOptions}>
              {STATUS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.statusOption,
                    { borderColor: value === opt.value ? colors.primary : colors.border },
                    value === opt.value && { backgroundColor: `${colors.primary}18` },
                  ]}
                  onPress={() => onChange(opt.value)}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      { color: value === opt.value ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      />

      <Controller
        control={control}
        name="due_date"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Due Date (YYYY-MM-DD)"
            placeholder="2024-12-31"
            value={value}
            onChangeText={onChange}
            error={errors.due_date?.message}
            hint="Leave blank for no due date"
          />
        )}
      />

      <View style={styles.actions}>
        <Button title="Cancel" onPress={onCancel} variant="outline" style={styles.cancelBtn} />
        <Button
          title={initialValues ? 'Update Task' : 'Create Task'}
          onPress={handleSubmit(handleFormSubmit)}
          loading={isLoading}
          style={styles.submitBtn}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fieldGroup: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  statusOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  statusOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: { flex: 1 },
  submitBtn: { flex: 2 },
});
