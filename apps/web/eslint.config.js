import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import sonarjs from 'eslint-plugin-sonarjs'

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
      sonarjs,
    },
    rules: {
      // Complexity ratchets — set at the current max so nothing breaks today; NEW
      // code above the line fails CI. Tightened after refactoring useMapPopupNavigation
      // (was the cyclomatic-18 / cognitive-30 ceiling). Current ceilings: cyclomatic 17
      // (usePOILocations), cognitive 22 (mapPopup). Lower further as those are refactored.
      complexity: ['error', 17],
      'sonarjs/cognitive-complexity': ['error', 22],
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
      // All 6 v7 Compiler rules now enforced. The known idiomatic exceptions are
      // suppressed with justification at their call sites (data-fetch /
      // prop-sync effects in usePOILocations, usePOINavigation, FilterManager;
      // the Date.now()-derived isStale; the navigateFarther⇄expandDistanceSlice
      // mutual reference). Enabling these catches NEW violations elsewhere
      // (e.g. an impure Math.random()/Date.now() in render).
      'react-hooks/set-state-in-effect': 'error',
      'react-hooks/purity': 'error',

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
