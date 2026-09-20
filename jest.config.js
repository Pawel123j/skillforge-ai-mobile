/**
 * Konfiguracja testów.
 *
 * Celowo `ts-jest`, a nie preset `jest-expo`: testowana jest wyłącznie czysta
 * logika (silnik mentora), która nie dotyka React Native ani Expo. Preset
 * `jest-expo` ciągnie całe środowisko natywne, wydłuża start o kilkanaście
 * sekund i wymaga transformacji setek modułów — bez żadnego zysku dla testów,
 * które operują na zwykłych obiektach.
 *
 * Gdy dojdą testy komponentów, wtedy `jest-expo` będzie właściwym wyborem.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  moduleNameMapper: {
    // To samo odwzorowanie, co w tsconfig.json i w babel.config.js.
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx', esModuleInterop: true } }],
  },
};
