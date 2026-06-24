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
      // MapContainer's "use before declare" findings were fixed by reordering
      // the popup/notification callbacks above the effects that use them. The
      // only remaining immutability finding is the intentional navigateFarther
      // ⇄ expandDistanceSlice mutual reference in usePOINavigation, suppressed
      // inline with justification.
      'react-hooks/immutability': 'error',
      'react-hooks/preserve-manual-memoization': 'error',

      // Still OFF — remaining findings are idiomatic patterns the strict
      // Compiler rules over-flag, in code CLAUDE.md marks as a frequent failure
      // point, and the app is not on the React Compiler yet (advisory):
      //  - set-state-in-effect: data-fetch effects (usePOILocations,
      //    usePOINavigation) + prop→state sync (FilterManager). A real fix means
      //    migrating to react-query / restructuring — needs sign-off.
      //  - purity: usePOILocations computes `isStale` from Date.now() during
      //    render (a time-derived boolean); a pure fix needs timer-based state.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',

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
