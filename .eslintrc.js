/**
 * Konfiguracja ESLint.
 *
 * Skrypt `npm run lint` istniał w package.json od początku, ale nie było
 * pliku konfiguracyjnego — polecenie kończyło się komunikatem
 * "ESLint couldn't find a configuration file" i nigdy niczego nie sprawdziło.
 */
module.exports = {
  root: true,
  extends: ['expo'],
  ignorePatterns: ['node_modules/', '.expo/', 'dist/', 'coverage/'],
  rules: {
    // Zmienna nieużywana to zwykle pozostałość po refaktorze. Prefiks `_`
    // pozwala świadomie zaznaczyć argument, którego się nie używa.
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
  },
  overrides: [
    {
      files: ['tests/**/*.ts'],
      env: { jest: true },
    },
  ],
};
