import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '@/stores/themeStore';

interface DayActivity {
  date: string;   // YYYY-MM-DD
  xp: number;
}

interface WeeklyActivityChartProps {
  completedLessons: string[];
  xp: number;
  lastActivityDate: string | null;
  streakDays: number;
}

// Generates mock per-day XP buckets for the last 14 days based on available data
function buildActivityGrid(
  completedCount: number,
  xp: number,
  lastActivity: string | null,
  streak: number
): DayActivity[] {
  const today = new Date();
  const days: DayActivity[] = [];

  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    let dayXP = 0;
    // Approximate activity: spread XP across active streak days
    if (lastActivity) {
      const daysAgo = i;
      if (daysAgo < streak) {
        // Vary XP per day for visual interest
        const base = Math.floor(xp / Math.max(streak, 1));
        dayXP = base + (daysAgo % 3 === 0 ? 25 : daysAgo % 2 === 0 ? 15 : 0);
      }
    }

    days.push({ date: dateStr, xp: dayXP });
  }

  return days;
}

function getIntensity(xp: number): number {
  if (xp === 0) return 0;
  if (xp < 30) return 1;
  if (xp < 70) return 2;
  if (xp < 120) return 3;
  return 4;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function WeeklyActivityChart({
  completedLessons,
  xp,
  lastActivityDate,
  streakDays,
}: WeeklyActivityChartProps) {
  const { colors } = useThemeStore();
  const days = buildActivityGrid(completedLessons.length, xp, lastActivityDate, streakDays);

  const INTENSITY_COLORS = [
    colors.surfaceSecondary,
    `${colors.primary}40`,
    `${colors.primary}70`,
    `${colors.primary}99`,
    colors.primary,
  ];

  // Split into 2 rows × 7 cols
  const week1 = days.slice(0, 7);
  const week2 = days.slice(7, 14);

  const renderRow = (row: DayActivity[]) =>
    row.map((day, i) => {
      const intensity = getIntensity(day.xp);
      const isToday = day.date === new Date().toISOString().split('T')[0];
      return (
        <View
          key={day.date}
          style={[
            styles.cell,
            { backgroundColor: INTENSITY_COLORS[intensity] },
            isToday && { borderWidth: 2, borderColor: colors.primary },
          ]}
        />
      );
    });

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>Activity (14 days)</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {streakDays > 0 ? `🔥 ${streakDays}-day streak` : 'Start your streak today'}
        </Text>
      </View>

      <View style={styles.grid}>
        {/* Day labels */}
        <View style={styles.dayLabels}>
          {DAY_LABELS.map((l, i) => (
            <Text key={i} style={[styles.dayLabel, { color: colors.textMuted }]}>{l}</Text>
          ))}
        </View>
        {/* Week 1 */}
        <View style={styles.row}>{renderRow(week1)}</View>
        {/* Week 2 */}
        <View style={styles.row}>{renderRow(week2)}</View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={[styles.legendLabel, { color: colors.textMuted }]}>Less</Text>
        {INTENSITY_COLORS.map((c, i) => (
          <View key={i} style={[styles.legendCell, { backgroundColor: c }]} />
        ))}
        <Text style={[styles.legendLabel, { color: colors.textMuted }]}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 15, fontWeight: '700' },
  subtitle: { fontSize: 12 },
  grid: { gap: 6 },
  dayLabels: {
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 1,
  },
  dayLabel: {
    width: 28,
    fontSize: 11,
    textAlign: 'center',
  },
  row: { flexDirection: 'row', gap: 5 },
  cell: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 4,
    justifyContent: 'flex-end',
  },
  legendCell: { width: 14, height: 14, borderRadius: 3 },
  legendLabel: { fontSize: 11 },
});
