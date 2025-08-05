#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Starting Automated Test Suite for Anime Streaming Platform');
console.log('=' .repeat(60));

// Check if required files exist
const requiredFiles = [
  'tests/gemini.test.js',
  'tests/tracemoe-test.js', 
  'tests/jest_intergration API tests.js',
  'tests/mal_unit_jesttests.js',
  'tests/jis_unit_jest_test.js'
];

console.log('📁 Checking test files...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - Found`);
  } else {
    console.log(`❌ ${file} - Missing`);
  }
});

console.log('\n🧪 Running Test Suites...');
console.log('=' .repeat(60));

const testSuites = [
  {
    name: 'Unit Tests (Gemini, MAL, Jikan APIs)',
    command: 'npm run test:unit',
    description: 'Testing individual API components'
  },
  {
    name: 'Integration Tests', 
    command: 'npm run test:integration',
    description: 'Testing API integrations end-to-end'
  },
  {
    name: 'API Tests (Trace.moe)',
    command: 'npm run test:api', 
    description: 'Testing external API functionality'
  }
];

let passedSuites = 0;
let totalSuites = testSuites.length;

testSuites.forEach((suite, index) => {
  console.log(`\n${index + 1}. ${suite.name}`);
  console.log(`   ${suite.description}`);
  console.log(`   Running: ${suite.command}`);
  
  try {
    execSync(suite.command, { stdio: 'inherit' });
    console.log(`   ✅ PASSED`);
    passedSuites++;
  } catch (error) {
    console.log(`   ❌ FAILED`);
    console.log(`   Error: ${error.message}`);
  }
});

console.log('\n📊 Test Summary');
console.log('=' .repeat(60));
console.log(`Total Test Suites: ${totalSuites}`);
console.log(`Passed: ${passedSuites}`);
console.log(`Failed: ${totalSuites - passedSuites}`);
console.log(`Success Rate: ${Math.round((passedSuites / totalSuites) * 100)}%`);

if (passedSuites === totalSuites) {
  console.log('\n🎉 All tests passed! Your anime streaming platform is ready to go!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please check the output above for details.');
  process.exit(1);
}
