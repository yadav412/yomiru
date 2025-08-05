module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/backend/node_modules/'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json'],
  
  // Transform configuration
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Module paths
  modulePaths: ['<rootDir>', '<rootDir>/tests'],
  
  // Timeout for tests (especially for API calls)
  testTimeout: 15000,
  
  // Verbose output
  verbose: true
};
