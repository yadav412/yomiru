// Jest setup file for test environment configuration
require('dotenv').config({ path: './backend/.env' });

// Global test timeout
jest.setTimeout(15000);

// Global test utilities
global.testUtils = {
  // Helper function to check if required environment variables are set
  checkEnvVars: (vars) => {
    return vars.every(varName => process.env[varName]);
  },
  
  // Helper to skip tests if env vars are missing
  skipIfMissingEnv: (vars) => {
    if (!global.testUtils.checkEnvVars(vars)) {
      console.warn(`Skipping test - Missing environment variables: ${vars.join(', ')}`);
      return true;
    }
    return false;
  }
};

// Set up fetch polyfill for Node.js environment
if (!global.fetch) {
  global.fetch = require('node-fetch');
}
