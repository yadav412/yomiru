require('dotenv').config();

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
  test('Trace.moe API - Search by image URL', async () => {
    const response = await axios.get('https://api.trace.moe/search', {
      params: {
        url: 'https://media.trace.moe/image/0_0.jpg' // Replace with valid image URL
      }
    });

    expect(response.status).toBe(200);
    expect(response.data.result.length).toBeGreaterThan(0);
    expect(response.data.result[0]).toHaveProperty('anilist');
  }, 10000);

  // ----------- 3. Gemini API TEST -----------
  test('Gemini API - Generate text from prompt', async () => {
    const prompt = {
      contents: [{ parts: [{ text: 'Explain what anime is' }] }]
    };

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      prompt,
      { headers: { 'Content-Type': 'application/json' } }
    );

    expect(response.status).toBe(200);
    expect(response.data.candidates[0].content.parts[0].text.length).toBeGreaterThan(10);
  }, 10000);
});



// backup tests 


require('dotenv').config();
const axios = require('axios');

// Load keys from environment variables
//called earlier in the file

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

    test('Returns result for a valid anime image URL', async () => {
      const imageUrl = 'https://trace.moe/img/dragon.jpg'; // Replace with a real anime image

      const res = await axios.get('https://api.trace.moe/search', {
        params: { url: imageUrl }
      });

      expect(res.status).toBe(200);
      expect(res.data.result.length).toBeGreaterThan(0);
      expect(res.data.result[0]).toHaveProperty('anilist');
      expect(res.data.result[0]).toHaveProperty('episode');
    });

    test('Returns error for invalid image URL', async () => {
      try {
        await axios.get('https://api.trace.moe/search', {
          params: { url: 'https://example.com/invalid.jpg' }
        });
      } catch (err) {
        expect(err.response.status).toBe(400); // bad input
        expect(err.response.data.error).toBeDefined();
      }
    });

  });

  // =======================
  // 3. Gemini API TESTS
  // =======================
  describe(' Gemini API', () => {

    const validPrompt = {
      contents: [{ parts: [{ text: 'Explain the anime One Piece' }] }]
    };

    test('Returns a valid answer from Gemini', async () => {
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
        validPrompt,
        { headers: { 'Content-Type': 'application/json' } }
      );

      expect(res.status).toBe(200);
      const content = res.data.candidates?.[0]?.content?.parts?.[0]?.text;
      expect(content).toBeDefined();
      expect(content.length).toBeGreaterThan(10);
    });

    test('Handles bad API key gracefully', async () => {
      try {
        await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=INVALID_KEY`,
          validPrompt,
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (err) {
        expect(err.response.status).toBe(403); // forbidden
        expect(err.response.data.error.message).toMatch(/API key not valid/i);
      }
    });

    test('Handles empty prompt input', async () => {
      try {
        await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
          {},
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (err) {
        expect(err.response.status).toBe(400);
        expect(err.response.data.error.message).toMatch(/Missing required field/i);
      }
    });
  });

});
