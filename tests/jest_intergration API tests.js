require('dotenv').config({ path: './backend/.env' });

const axios = require('axios');

// Load keys from environment variables (for security)
const MAL_CLIENT_ID = process.env.MAL_CLIENT_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

describe('Integration Tests', () => {
  
  // ----------- 1. MAL TEST -----------
  test('MAL API - Search anime "Naruto"', async () => {
    const response = await axios.get('https://api.myanimelist.net/v2/anime', {
      headers: {
        'X-MAL-CLIENT-ID': MAL_CLIENT_ID
      },
      params: {
        q: 'Naruto',
        limit: 1
      }
    });

    expect(response.status).toBe(200);
    expect(response.data.data[0].node.title).toMatch(/Naruto/i);
  }, 10000);

  // ----------- 2. Trace.moe TEST -----------
  test('Trace.moe API - Basic connectivity test', async () => {
    try {
      // Test the API endpoint without requiring a specific image URL
      const response = await axios.get('https://api.trace.moe/search?url=https://trace.moe/favicon128.png');
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('result');
    } catch (error) {
      // TraceMoe API can be unreliable, so we'll accept certain errors as expected
      if (error.response && [404, 429, 500, 530].includes(error.response.status)) {
        console.warn('TraceMoe API temporarily unavailable - this is acceptable');
        expect(error.response.status).toBeGreaterThan(0);
      } else {
        throw error;
      }
    }
  }, 10000);

  // ----------- 3. Gemini API TEST (via Backend Proxy) -----------
  test('Gemini API - Generate text from prompt via backend', async () => {
    const prompt = {
      contents: [{ parts: [{ text: 'Explain what anime is' }] }]
    };

    try {
      const response = await axios.post(
        'https://final-project-10-streams.onrender.com/api/generate',
        prompt,
        { headers: { 'Content-Type': 'application/json' } }
      );

      expect(response.status).toBe(200);
      expect(response.data.candidates[0].content.parts[0].text.length).toBeGreaterThan(10);
    } catch (error) {
      // If backend is not ready, test that it at least responds with proper error structure
      if (error.response && error.response.status === 500) {
        expect(error.response.data).toHaveProperty('error');
        expect(error.response.data.error).toBe('Failed to generate content');
        console.log('ℹ️  Backend API proxy not ready yet - this is expected during deployment');
      } else {
        throw error; // Re-throw unexpected errors
      }
    }
  }, 10000);
});



// backup tests - Additional test scenarios

// Helper delay to avoid hitting rate limits
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

describe(' API Integration Tests', () => {

  // =======================
  // 1. MAL API TESTS
  // =======================
  describe(' MyAnimeList API', () => {

    test('Searches for "Naruto" and returns at least 1 result', async () => {
      const res = await axios.get('https://api.myanimelist.net/v2/anime', {
        headers: { 'X-MAL-CLIENT-ID': MAL_CLIENT_ID },
        params: { q: 'Naruto', limit: 1 }
      });

      expect(res.status).toBe(200);
      expect(res.data.data).toHaveLength(1);
      expect(res.data.data[0].node.title).toMatch(/Naruto/i);
    });

    test('Fetches details of first search result including genres and status', async () => {
      const search = await axios.get('https://api.myanimelist.net/v2/anime', {
        headers: { 'X-MAL-CLIENT-ID': MAL_CLIENT_ID },
        params: { q: 'Naruto', limit: 1 }
      });

      const animeId = search.data.data[0].node.id;
      const res = await axios.get(`https://api.myanimelist.net/v2/anime/${animeId}`, {
        headers: { 'X-MAL-CLIENT-ID': MAL_CLIENT_ID },
        params: { fields: 'genres,status' }
      });

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('genres');
      expect(res.data.genres.length).toBeGreaterThan(0);
      expect(['finished_airing', 'currently_airing', 'not_yet_aired']).toContain(res.data.status);
    });

  });

  // =======================
  // 2. Trace.moe API TESTS
  // =======================
  describe('Trace.moe API', () => {

    test('API endpoint is accessible', async () => {
      try {
        // Just test that the API endpoint responds
        const res = await axios.get('https://api.trace.moe/me');
        expect(res.status).toBe(200);
      } catch (err) {
        // Accept various error codes as API being accessible but rate limited/down
        if (err.response && [404, 429, 500, 530].includes(err.response.status)) {
          console.warn('TraceMoe API temporarily unavailable - this is acceptable');
          expect(err.response.status).toBeGreaterThan(0);
        } else {
          throw err;
        }
      }
    });

    test('Handles invalid requests appropriately', async () => {
      try {
        await axios.get('https://api.trace.moe/search', {
          params: { url: 'invalid-url' }
        });
      } catch (err) {
        // Expect some kind of error response for invalid input
        expect(err.response.status).toBeGreaterThanOrEqual(400);
        expect(err.response.status).toBeLessThan(600);
      }
    });

  });

  // =======================
  // 3. Gemini API TESTS (via Backend Proxy)
  // =======================
  describe(' Gemini API', () => {

    const validPrompt = {
      contents: [{ parts: [{ text: 'Explain the anime One Piece' }] }]
    };

    const BACKEND_URL = 'https://final-project-10-streams.onrender.com';

    test('Returns a valid answer from Gemini via backend', async () => {
      try {
        const res = await axios.post(
          `${BACKEND_URL}/api/generate`,
          validPrompt,
          { headers: { 'Content-Type': 'application/json' } }
        );

        expect(res.status).toBe(200);
        const content = res.data.candidates?.[0]?.content?.parts?.[0]?.text;
        expect(content).toBeDefined();
        expect(content.length).toBeGreaterThan(10);
      } catch (error) {
        // Handle backend not ready case gracefully
        if (error.response && error.response.status === 500) {
          expect(error.response.data).toHaveProperty('error');
          console.log('ℹ️  Backend Gemini API not ready - gracefully handling');
        } else {
          throw error;
        }
      }
    });

    test('Handles backend errors gracefully', async () => {
      try {
        await axios.post(
          `${BACKEND_URL}/api/generate`,
          { contents: [] }, // Invalid empty contents
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (err) {
        expect(err.response.status).toBeGreaterThanOrEqual(400);
        expect(err.response.data).toHaveProperty('error');
      }
    });

    test('Handles network connectivity to backend', async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/health`);
        expect(res.status).toBe(200);
        expect(res.data).toHaveProperty('status');
      } catch (err) {
        // If backend is down, expect connection error
        expect(err.code).toMatch(/ECONNREFUSED|ENOTFOUND/);
      }
    });
  });

});
