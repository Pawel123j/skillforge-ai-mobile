import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { ToastItem, ToastConfig } from './ToastItem';
import { useToastStore } from '@/stores/toastStore';

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} config={t} onDismiss={dismiss} />
      ))}
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    zIndex: 9999,
    width: width - 32,
  },
});
