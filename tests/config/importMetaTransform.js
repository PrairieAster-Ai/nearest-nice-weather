/**
 * Custom Jest transformer to handle import.meta
 * Replaces import.meta.env with process.env for Jest compatibility
 */
module.exports = {
  process(sourceText, sourcePath) {
    // Only transform TypeScript and JavaScript files
    if (!sourcePath.match(/\.(ts|tsx|js|jsx)$/)) {
      return { code: sourceText };
    }

    // Replace import.meta.env with process.env
    let transformedCode = sourceText
      // Handle import.meta.env.VITE_* variables
      .replace(/import\.meta\.env\.VITE_/g, 'process.env.VITE_')
      // Handle import.meta.env.NODE_ENV
      .replace(/import\.meta\.env\.NODE_ENV/g, 'process.env.NODE_ENV')
      // Handle import.meta.env.DEV
      .replace(/import\.meta\.env\.DEV/g, '(process.env.NODE_ENV === "development")')
      // Handle import.meta.env.PROD
      .replace(/import\.meta\.env\.PROD/g, '(process.env.NODE_ENV === "production")')
      // Handle import.meta.env.MODE
      .replace(/import\.meta\.env\.MODE/g, 'process.env.NODE_ENV')
      // Handle import.meta.env.SSR
      .replace(/import\.meta\.env\.SSR/g, 'false')
      // Handle generic import.meta.env access
      .replace(/import\.meta\.env/g, 'process.env');

    return {
      code: transformedCode,
    };
  },
};
