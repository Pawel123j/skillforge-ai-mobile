import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '@/stores/themeStore';
import { Button } from '@/components/common/Button';

export default function NotFoundScreen() {
  const { colors } = useThemeStore();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={styles.emoji}>🔍</Text>
      <Text style={[styles.title, { color: colors.text }]}>Page Not Found</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        This screen doesn't exist. Navigate back to the app.
      </Text>
      <Button
        title="Go to Dashboard"
        onPress={() => router.replace('/(tabs)/dashboard')}
        style={styles.btn}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emoji: { fontSize: 64, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 10 },
  message: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  btn: { minWidth: 200 },
});
