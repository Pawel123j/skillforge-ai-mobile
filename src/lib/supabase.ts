import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createSecureSessionStorage } from './secureSessionStorage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const IS_MOCK_MODE = !supabaseUrl || !supabaseAnonKey;

export const supabase = IS_MOCK_MODE
  ? null
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // SF-04: Keychain/Keystore na urządzeniach; web nie ma SecureStore.
        storage: Platform.OS === 'web' ? AsyncStorage : createSecureSessionStorage(SecureStore, AsyncStorage),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
