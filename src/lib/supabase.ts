import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createNativeSessionStorage } from './sessionStorage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const IS_MOCK_MODE = !supabaseUrl || !supabaseAnonKey;

export const supabase = IS_MOCK_MODE
  ? null
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: Platform.OS === 'web' ? AsyncStorage : createNativeSessionStorage({
          getItem: SecureStore.getItemAsync,
          setItem: (key, value) => SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }),
          removeItem: SecureStore.deleteItemAsync,
        }, AsyncStorage),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
