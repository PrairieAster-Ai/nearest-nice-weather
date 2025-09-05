/**
 * Combined Jest transformer
 * 1. Handles import.meta transformation
 * 2. Then applies babel-jest transformation
 */
const babelJest = require('babel-jest').default;

// Create babel transformer with our config
const babelTransformer = babelJest.createTransformer({
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
    ['@babel/preset-react', { runtime: 'automatic' }]
  ],
});

module.exports = {
  process(sourceText, sourcePath, options) {
    // Step 1: Handle import.meta transformations
    let transformedCode = sourceText;

    if (sourcePath.match(/\.(ts|tsx|js|jsx)$/)) {
      transformedCode = sourceText
        .replace(/import\.meta\.env\.VITE_/g, 'process.env.VITE_')
        .replace(/import\.meta\.env\.NODE_ENV/g, 'process.env.NODE_ENV')
        .replace(/import\.meta\.env\.DEV/g, '(process.env.NODE_ENV === "development")')
        .replace(/import\.meta\.env\.PROD/g, '(process.env.NODE_ENV === "production")')
        .replace(/import\.meta\.env\.MODE/g, 'process.env.NODE_ENV')
        .replace(/import\.meta\.env\.SSR/g, 'false')
        .replace(/import\.meta\.env/g, 'process.env');
    }

    // Step 2: Apply babel transformation
    return babelTransformer.process(transformedCode, sourcePath, options);
  },

  getCacheKey(...args) {
    return babelTransformer.getCacheKey(...args);
  },
};
