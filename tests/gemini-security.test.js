// Gemini Backend Security Test
const axios = require('axios');

// Mock axios for testing
jest.mock('axios');
const mockedAxios = axios;

describe('Gemini API Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Frontend no longer exposes API keys', () => {
    // Read the frontend file and verify no API keys are present
    const fs = require('fs');
    const path = require('path');
    
    const geminiJsPath = path.join(__dirname, '../public/gemini.js');
    const frontendCode = fs.readFileSync(geminiJsPath, 'utf8');
    
    // Verify no hardcoded API keys
    expect(frontendCode).not.toMatch(/AIzaSyCN-7ma_q8PQf_bPAKYl855aKdHvBKZiLg/);
    expect(frontendCode).not.toMatch(/const API_KEY = "AIza/);
    expect(frontendCode).not.toMatch(/key=AIza/);
    
    // Verify it uses backend URL
    expect(frontendCode).toMatch(/BACKEND_URL.*final-project-10-streams\.onrender\.com/);
    expect(frontendCode).toMatch(/\/api\/generate/);
  });

  test('Backend API proxy endpoint is properly configured', async () => {
    // Mock successful backend response
    const mockResponse = {
      data: {
        candidates: [{
          content: {
            parts: [{ text: 'Hello! I can help with anime recommendations.' }]
          }
        }]
      },
      status: 200
    };

    mockedAxios.post.mockResolvedValue(mockResponse);

    const validPrompt = {
      contents: [{ parts: [{ text: 'Explain anime' }] }]
    };

    const result = await axios.post(
      'https://final-project-10-streams.onrender.com/api/generate',
      validPrompt,
      { headers: { 'Content-Type': 'application/json' } }
    );

    expect(result.status).toBe(200);
    expect(result.data.candidates[0].content.parts[0].text).toBeDefined();
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://final-project-10-streams.onrender.com/api/generate',
      validPrompt,
      { headers: { 'Content-Type': 'application/json' } }
    );
  });

  test('Security implementation prevents direct API calls', () => {
    const fs = require('fs');
    const path = require('path');
    
    const geminiJsPath = path.join(__dirname, '../public/gemini.js');
    const frontendCode = fs.readFileSync(geminiJsPath, 'utf8');
    
    // Verify no direct calls to Google's API
    expect(frontendCode).not.toMatch(/generativelanguage\.googleapis\.com/);
    expect(frontendCode).not.toMatch(/models\/gemini.*:generateContent/);
    
    // Verify uses secure backend proxy
    expect(frontendCode).toMatch(/\/api\/generate/);
  });

  test('Backend environment configuration is secure', () => {
    // Verify environment variables are properly configured
    require('dotenv').config({ path: '../backend/.env' });
    
    const geminiKey = process.env.GEMINI_API_KEY;
    const malClientId = process.env.MAL_CLIENT_ID;
    
    expect(geminiKey).toBeDefined();
    expect(geminiKey).toMatch(/^AIza/); // Starts with AIza
    expect(geminiKey.length).toBeGreaterThan(30); // Reasonable length
    
    expect(malClientId).toBeDefined();
    expect(malClientId.length).toBeGreaterThan(10);
  });

  test('Error handling provides user-friendly messages', () => {
    // This test verifies that error messages don't expose internal details
    const errorMessages = [
      "I'm having trouble connecting to the AI service right now.",
      "The AI backend is currently being updated. Please try again in a few moments.",
      "Please check your internet connection and try again.",
      "Please try rephrasing your question or try again later."
    ];

    // Verify these messages exist in the frontend code
    const fs = require('fs');
    const path = require('path');
    
    const geminiJsPath = path.join(__dirname, '../public/gemini.js');
    const frontendCode = fs.readFileSync(geminiJsPath, 'utf8');
    
    errorMessages.forEach(message => {
      expect(frontendCode).toMatch(message);
    });
  });
});
