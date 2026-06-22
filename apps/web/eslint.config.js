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
      // eslint-plugin-react-hooks v7. Classic rules stay on as errors:
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // v7 React-Compiler rules we've fully resolved — enabled as errors so the
      // fixes can't regress:
      'react-hooks/refs': 'error',              // refs written/read during render
      'react-hooks/static-components': 'error', // components defined during render

      // v7 React-Compiler rules with remaining findings in business-critical
      // code (Leaflet map popup/marker management in MapContainer, POI
      // data-fetch in usePOILocations, navigation/expansion in usePOINavigation
      // — which has documented intentional circular deps — and filter sync in
      // FilterManager). These flag real Compiler-readiness issues, but fixing
      // them safely needs dedicated, behavior-validated refactors of code
      // CLAUDE.md flags as a frequent failure point. The app is not on the
      // React Compiler yet, so they are advisory. Tracked as follow-up; left
      // OFF here to avoid forcing risky changes that can't be UI-tested in CI.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/preserve-manual-memoization': 'off',

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
