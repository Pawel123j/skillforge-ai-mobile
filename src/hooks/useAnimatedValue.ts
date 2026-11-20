import { useState } from 'react';
import { Animated } from 'react-native';

/**
 * Stable Animated.Value for the component's lifetime.
 *
 * React Native ships `useAnimatedValue`, but react-native-web 0.21 does not
 * export it, so importing it from 'react-native' crashed the web build
 * ("useAnimatedValue is not a function"). This hook behaves the same on all
 * platforms; the lazy useState initializer creates the value exactly once.
 */
export function useAnimatedValue(initialValue: number): Animated.Value {
  const [value] = useState(() => new Animated.Value(initialValue));
  return value;
}
