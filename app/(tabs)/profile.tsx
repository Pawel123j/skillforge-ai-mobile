import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { profileService } from '@/services/profileService';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import { LearningGoal, DailyTime } from '@/types';
import {
  GoalColors, GoalLabels, GoalIcons,
  DailyTimeLabels,
} from '@/constants';
import { getXpLevel } from '@/utils';

const GOALS: LearningGoal[] = ['frontend', 'backend', 'mobile', 'cybersecurity', 'data_analyst', 'python'];
const DAILY_TIMES: DailyTime[] = [15, 30, 60, 90];

export default function ProfileScreen() {
  const { colors, theme, toggleTheme } = useThemeStore();
  const { profile, progress, userId, updateProfile, signOut, isLoading } = useAuthStore();
  const router = useRouter();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(profile?.full_name ?? '');
  const [isSavingName, setIsSavingName] = useState(false);

  const xpInfo = getXpLevel(progress?.xp ?? 0);
  const goalColor = profile?.learning_goal ? GoalColors[profile.learning_goal] : colors.primary;

  const handleSaveName = async () => {
    if (!userId || !editName.trim()) return;
    setIsSavingName(true);
    try {
      await profileService.updateProfile(userId, { full_name: editName.trim() });
      updateProfile({ full_name: editName.trim() });
      setIsEditingName(false);
    } catch {
      Alert.alert('Error', 'Failed to update name');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleGoalChange = async (goal: LearningGoal) => {
    if (!userId) return;
    try {
      await profileService.updateProfile(userId, { learning_goal: goal });
      updateProfile({ learning_goal: goal });
    } catch {
      Alert.alert('Error', 'Failed to update goal');
    }
  };

  const handleTimeChange = async (time: DailyTime) => {
    if (!userId) return;
    try {
      await profileService.updateProfile(userId, { daily_time_minutes: time });
      updateProfile({ daily_time_minutes: time });
    } catch {
      Alert.alert('Error', 'Failed to update time');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.screenLabel, { color: colors.textSecondary }]}>Account</Text>
          <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
        </View>

        {/* Avatar Card */}
        <View style={[styles.avatarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: `${goalColor}22` }]}>
            <Text style={styles.avatarText}>
              {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
          <View style={styles.avatarInfo}>
            <Text style={[styles.avatarName, { color: colors.text }]}>
              {profile?.full_name ?? 'Developer'}
            </Text>
            <Text style={[styles.avatarEmail, { color: colors.textSecondary }]}>
              {useAuthStore.getState().email ?? 'demo@skillforge.ai'}
            </Text>
            <View style={styles.avatarBadges}>
              <Badge
                label={`Lv.${xpInfo.level} ${xpInfo.title}`}
                backgroundColor={`${goalColor}22`}
                color={goalColor}
                size="sm"
              />
              <Badge
                label={`${progress?.xp ?? 0} XP`}
                backgroundColor={`${colors.primary}18`}
                color={colors.primary}
                size="sm"
              />
            </View>
          </View>
        </View>

        {/* Edit Name */}
        <View style={[styles.section, { borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Full Name</Text>
            {!isEditingName ? (
              <TouchableOpacity onPress={() => { setIsEditingName(true); setEditName(profile?.full_name ?? ''); }}>
                <Text style={[styles.editBtn, { color: colors.primary }]}>Edit</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setIsEditingName(false)}>
                <Text style={[styles.editBtn, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
          {isEditingName ? (
            <View style={styles.editRow}>
              <Input
                value={editName}
                onChangeText={setEditName}
                placeholder="Your full name"
                style={styles.nameInput}
              />
              <Button
                title="Save"
                onPress={handleSaveName}
                loading={isSavingName}
                size="sm"
                style={styles.saveBtn}
              />
            </View>
          ) : (
            <Text style={[styles.sectionValue, { color: colors.textSecondary }]}>
              {profile?.full_name ?? '—'}
            </Text>
          )}
        </View>

        {/* Change Goal */}
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Learning Goal</Text>
          <View style={styles.goalGrid}>
            {GOALS.map((goal) => {
              const isSelected = profile?.learning_goal === goal;
              const gc = GoalColors[goal];
              return (
                <TouchableOpacity
                  key={goal}
                  style={[
                    styles.goalOption,
                    {
                      backgroundColor: isSelected ? `${gc}18` : colors.surfaceSecondary,
                      borderColor: isSelected ? gc : 'transparent',
                    },
                  ]}
                  onPress={() => handleGoalChange(goal)}
                >
                  <Text style={styles.goalOptionIcon}>{GoalIcons[goal]}</Text>
                  <Text
                    style={[styles.goalOptionLabel, { color: isSelected ? gc : colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {GoalLabels[goal]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Daily Time */}
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Learning Time</Text>
          <View style={styles.timeOptions}>
            {DAILY_TIMES.map((time) => {
              const isSelected = profile?.daily_time_minutes === time;
              return (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeOption,
                    {
                      backgroundColor: isSelected ? `${colors.primary}18` : colors.surfaceSecondary,
                      borderColor: isSelected ? colors.primary : 'transparent',
                    },
                  ]}
                  onPress={() => handleTimeChange(time)}
                >
                  <Text style={[styles.timeValue, { color: isSelected ? colors.primary : colors.text }]}>
                    {DailyTimeLabels[time]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Appearance */}
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          <View style={styles.themeRow}>
            <View>
              <Text style={[styles.themeLabel, { color: colors.text }]}>Dark Mode</Text>
              <Text style={[styles.themeDesc, { color: colors.textSecondary }]}>
                {theme === 'dark' ? 'Dark theme enabled' : 'Light theme enabled'}
              </Text>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: `${colors.primary}66` }}
              thumbColor={theme === 'dark' ? colors.primary : colors.textMuted}
            />
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Learning Stats</Text>
          <View style={styles.statsList}>
            {[
              { label: 'Total XP', value: `${progress?.xp ?? 0} XP`, icon: '⭐' },
              { label: 'Current Streak', value: `${progress?.streak_days ?? 0} days`, icon: '🔥' },
              { label: 'Lessons Completed', value: progress?.completed_lessons.length ?? 0, icon: '📚' },
              { label: 'Modules Completed', value: progress?.completed_modules.length ?? 0, icon: '📦' },
              { label: 'Level', value: `${xpInfo.level} · ${xpInfo.title}`, icon: '🏆' },
            ].map((stat) => (
              <View
                key={stat.label}
                style={[styles.statRow, { borderBottomColor: colors.border }]}
              >
                <Text style={styles.statIcon}>{stat.icon}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Logout */}
        <View style={styles.logoutSection}>
          <Button
            title="Sign Out"
            onPress={handleLogout}
            variant="danger"
            fullWidth
            loading={isLoading}
          />
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  screenLabel: { fontSize: 13, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  avatarCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: { fontSize: 28, fontWeight: '800' },
  avatarInfo: { flex: 1 },
  avatarName: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  avatarEmail: { fontSize: 13, marginBottom: 8 },
  avatarBadges: { flexDirection: 'row', gap: 6 },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  sectionValue: { fontSize: 15 },
  editBtn: { fontSize: 15, fontWeight: '600' },
  editRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  nameInput: { flex: 1, marginBottom: 0 },
  saveBtn: { marginTop: 0 },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalOption: {
    width: '30%',
    flexGrow: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  goalOptionIcon: { fontSize: 20, marginBottom: 4 },
  goalOptionLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  timeOptions: { gap: 8 },
  timeOption: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  timeValue: { fontSize: 15, fontWeight: '600' },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeLabel: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  themeDesc: { fontSize: 13 },
  statsList: { gap: 2 },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  statIcon: { fontSize: 18, marginRight: 10 },
  statLabel: { flex: 1, fontSize: 14 },
  statValue: { fontSize: 14, fontWeight: '700' },
  logoutSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  bottomPad: { height: 20 },
});
