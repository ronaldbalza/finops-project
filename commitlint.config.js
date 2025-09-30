module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation changes
        'style',    // Code style changes (formatting, etc)
        'refactor', // Code refactoring
        'perf',     // Performance improvements
        'test',     // Adding or updating tests
        'build',    // Build system or dependencies
        'ci',       // CI/CD configuration
        'chore',    // Other changes that don't modify src or test files
        'revert',   // Revert a previous commit
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'auth',       // Authentication & authorization
        'tenant',     // Multi-tenancy
        'aws',        // AWS integration
        'azure',      // Azure integration
        'gcp',        // GCP integration
        'api',        // API endpoints
        'dashboard',  // Dashboard features
        'allocation', // Cost allocation
        'optimize',   // Optimization features
        'budget',     // Budget management
        'alerts',     // Alert system
        'reports',    // Reporting features
        'ui',         // UI components
        'db',         // Database
        'workers',    // Cloudflare Workers
        'config',     // Configuration
        'deps',       // Dependencies
        'docs',       // Documentation
        'tests',      // Testing
        'ci',         // CI/CD
      ],
    ],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
    'subject-full-stop': [2, 'never', '.'],
    'subject-min-length': [2, 'always', 3],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
    'header-max-length': [2, 'always', 100],
  },
};