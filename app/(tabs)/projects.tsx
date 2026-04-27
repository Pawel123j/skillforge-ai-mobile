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
import { useProjectStore } from '@/stores/projectStore';
import { ProjectCard } from '@/components/cards/ProjectCard';
import { ProjectForm } from '@/components/forms/ProjectForm';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { Project, ProjectFormData, ProjectStatus } from '@/types';

type FilterOption = 'all' | ProjectStatus;

const FILTERS: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'idea', label: 'Ideas' },
  { value: 'building', label: 'Building' },
  { value: 'completed', label: 'Completed' },
];

export default function ProjectsScreen() {
  const { colors } = useThemeStore();
  const { userId, profile } = useAuthStore();
  const { projects, isLoading, loadProjects, createProject, updateProject, setProjectStatus } = useProjectStore();

  const [filter, setFilter] = useState<FilterOption>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (userId) loadProjects(userId, profile?.learning_goal ?? null);
  }, [userId, profile?.learning_goal]);

  const filteredProjects = projects.filter((p) =>
    filter === 'all' ? true : p.status === filter
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    if (userId) await loadProjects(userId, profile?.learning_goal ?? null);
    setIsRefreshing(false);
  };

  const handleCreate = async (data: ProjectFormData) => {
    if (!userId) return;
    setIsFormLoading(true);
    try {
      await createProject(userId, data);
      setShowForm(false);
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleUpdate = async (data: ProjectFormData) => {
    if (!editingProject) return;
    setIsFormLoading(true);
    try {
      await updateProject(editingProject.id, data);
      setEditingProject(null);
    } finally {
      setIsFormLoading(false);
    }
  };

  const projectCounts = {
    all: projects.length,
    idea: projects.filter((p) => p.status === 'idea').length,
    building: projects.filter((p) => p.status === 'building').length,
    completed: projects.filter((p) => p.status === 'completed').length,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.screenLabel, { color: colors.textSecondary }]}>Portfolio Projects</Text>
          <Text style={[styles.title, { color: colors.text }]}>My Projects</Text>
        </View>
        <Button
          title="+ Add"
          onPress={() => setShowForm(true)}
          size="sm"
        />
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {[
          { label: 'Total', value: projects.length, color: colors.primary },
          { label: 'Building', value: projectCounts.building, color: '#F59E0B' },
          { label: 'Done', value: projectCounts.completed, color: '#10B981' },
        ].map((stat) => (
          <View
            key={stat.label}
            style={[styles.statItem, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
          </View>
        ))}
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
                  {projectCounts[f.value]}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Project List */}
      {isLoading && !isRefreshing ? (
        <LoadingState message="Loading projects..." />
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {filteredProjects.length === 0 ? (
            <EmptyState
              icon="🚀"
              title="No projects yet"
              message="Start a portfolio project to showcase your skills to recruiters and employers."
              actionLabel="Add Your First Project"
              onAction={() => setShowForm(true)}
            />
          ) : (
            filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onPress={() => setEditingProject(project)}
                onStatusChange={(status: ProjectStatus) => setProjectStatus(project.id, status)}
              />
            ))
          )}
          <View style={styles.bottomPad} />
        </ScrollView>
      )}

      {/* Create / Edit Modal */}
      <Modal
        visible={showForm || editingProject !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowForm(false);
          setEditingProject(null);
        }}
      >
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingProject ? 'Edit Project' : 'Add Project'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowForm(false);
                setEditingProject(null);
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
            <ProjectForm
              initialValues={editingProject ? {
                title: editingProject.title,
                description: editingProject.description,
                status: editingProject.status,
                github_url: editingProject.github_url ?? undefined,
                tech_stack: editingProject.tech_stack,
              } : undefined}
              onSubmit={editingProject ? handleUpdate : handleCreate}
              onCancel={() => {
                setShowForm(false);
                setEditingProject(null);
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
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  statValue: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 12 },
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
  modal: { flex: 1, paddingTop: 16 },
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
