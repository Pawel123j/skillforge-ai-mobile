import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeStore } from '@/stores/themeStore';
import { Project, ProjectStatus } from '@/types';
import { Badge } from '@/components/common/Badge';
import { getProjectStatusColor, getProjectStatusLabel } from '@/utils';

interface ProjectCardProps {
  project: Project;
  onPress: () => void;
  onStatusChange: (status: ProjectStatus) => void;
}

const STATUS_OPTIONS: ProjectStatus[] = ['idea', 'building', 'completed'];

export function ProjectCard({ project, onPress, onStatusChange }: ProjectCardProps) {
  const { colors } = useThemeStore();
  const statusColor = getProjectStatusColor(project.status);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {project.title}
          </Text>
          {project.is_suggested && (
            <Badge label="Suggested" backgroundColor={`${colors.primary}22`} color={colors.primary} size="sm" />
          )}
        </View>
        <Badge
          label={getProjectStatusLabel(project.status)}
          backgroundColor={`${statusColor}22`}
          color={statusColor}
          size="sm"
        />
      </View>

      <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={3}>
        {project.description}
      </Text>

      {project.tech_stack.length > 0 && (
        <View style={styles.stack}>
          {project.tech_stack.map((tech) => (
            <View key={tech} style={[styles.techBadge, { backgroundColor: colors.surfaceSecondary }]}>
              <Text style={[styles.techText, { color: colors.textSecondary }]}>{tech}</Text>
            </View>
          ))}
        </View>
      )}

      {project.github_url && (
        <Text style={[styles.github, { color: colors.primary }]} numberOfLines={1}>
          🔗 {project.github_url}
        </Text>
      )}

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.footerLabel, { color: colors.textMuted }]}>Change status:</Text>
        <View style={styles.statusButtons}>
          {STATUS_OPTIONS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.statusBtn,
                {
                  backgroundColor: project.status === s ? `${getProjectStatusColor(s)}22` : colors.surfaceSecondary,
                  borderColor: project.status === s ? getProjectStatusColor(s) : 'transparent',
                },
              ]}
              onPress={() => onStatusChange(s)}
            >
              <Text
                style={[
                  styles.statusBtnText,
                  { color: project.status === s ? getProjectStatusColor(s) : colors.textSecondary },
                ]}
              >
                {getProjectStatusLabel(s)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleRow: { flex: 1, marginRight: 12, gap: 4 },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  stack: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  techBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  techText: { fontSize: 12, fontWeight: '500' },
  github: {
    fontSize: 13,
    marginBottom: 12,
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBtnText: { fontSize: 12, fontWeight: '600' },
});
