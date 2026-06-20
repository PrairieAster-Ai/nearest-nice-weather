import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [
  {
    ignores: [
      'dist',
      'build',
      'coverage',
      '**/*.config.js',
      '**/*.config.ts',
      // Ignore test files and problematic config files
      '**/*.test.{ts,tsx}',
      '**/__tests__/**/*.{ts,tsx}',
      '**/test/**/*.{ts,tsx}',
      'src/config/performanceRequirements.ts'
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tsParser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Classic rules-of-hooks set (matches eslint-plugin-react-hooks v5 recommended).
      // v7's recommended adds new compiler-based rules (react-hooks/refs,
      // set-state-in-effect, etc.) that flag 3 real issues in App.tsx,
      // FilterManager.tsx, and MapContainer.tsx. Those need a focused
      // code-quality pass on core UI (with sign-off), so they're deferred here
      // rather than enabled wholesale in a dependency bump.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // More forgiving unused vars for development workflow
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }],
    },
  },
]
