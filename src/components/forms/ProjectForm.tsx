import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useThemeStore } from '@/stores/themeStore';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { ProjectFormData, ProjectStatus } from '@/types';

const projectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().min(1, 'Description is required').max(500),
  status: z.enum(['idea', 'building', 'completed']),
  github_url: z.string().default(''),
  tech_stack: z.string().default(''),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  initialValues?: Partial<ProjectFormData>;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const STATUS_OPTIONS: { value: ProjectStatus; label: string; icon: string }[] = [
  { value: 'idea', label: 'Idea', icon: '💡' },
  { value: 'building', label: 'Building', icon: '🏗️' },
  { value: 'completed', label: 'Completed', icon: '✅' },
];

export function ProjectForm({ initialValues, onSubmit, onCancel, isLoading }: ProjectFormProps) {
  const { colors } = useThemeStore();

  const { control, handleSubmit, formState: { errors } } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema) as any,
    defaultValues: {
      title: initialValues?.title ?? '',
      description: initialValues?.description ?? '',
      status: initialValues?.status ?? 'idea',
      github_url: initialValues?.github_url ?? '',
      tech_stack: initialValues?.tech_stack?.join(', ') ?? '',
    },
  });

  const handleFormSubmit: SubmitHandler<ProjectFormValues> = async (values) => {
    const techStack = values.tech_stack
      ? values.tech_stack.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    await onSubmit({
      title: values.title,
      description: values.description,
      status: values.status,
      github_url: values.github_url || undefined,
      tech_stack: techStack,
    });
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Project Title *"
            placeholder="e.g. Portfolio Website"
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
            label="Description *"
            placeholder="What will you build?"
            value={value}
            onChangeText={onChange}
            multiline
            numberOfLines={4}
            error={errors.description?.message}
            style={{ minHeight: 100, textAlignVertical: 'top' }}
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
                  <Text style={styles.statusIcon}>{opt.icon}</Text>
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
        name="tech_stack"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Tech Stack"
            placeholder="React, TypeScript, Node.js"
            value={value}
            onChangeText={onChange}
            hint="Comma-separated list"
          />
        )}
      />

      <Controller
        control={control}
        name="github_url"
        render={({ field: { onChange, value } }) => (
          <Input
            label="GitHub URL"
            placeholder="https://github.com/username/project"
            value={value}
            onChangeText={onChange}
            autoCapitalize="none"
          />
        )}
      />

      <View style={styles.actions}>
        <Button title="Cancel" onPress={onCancel} variant="outline" style={styles.cancelBtn} />
        <Button
          title={initialValues ? 'Update Project' : 'Add Project'}
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
    gap: 4,
  },
  statusIcon: { fontSize: 18 },
  statusOptionText: {
    fontSize: 12,
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
