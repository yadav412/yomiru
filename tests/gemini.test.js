const axios = require('axios');

// Mock axios
jest.mock('axios');

// Mock Gemini API response function
const generateGeminiResponse = async (prompt) => {
  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    throw new Error('Invalid prompt');
  }

  const response = await axios.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent', {
    contents: [{
      parts: [{
        text: prompt
      }]
    }]
  }, {
    headers: {
      'Content-Type': 'application/json',
    },
    params: {
      key: process.env.GEMINI_API_KEY
    }
  });

  return response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
};

// Helper functions
const isValidPrompt = (prompt) => {
  return typeof prompt === 'string' && prompt.trim().length > 0;
};

const buildPrompt = (text) => {
  return {
    contents: [{
      parts: [{ text }]
    }]
  };
};

describe('Gemini Unit Test', () => {

  it('returns valid text when given a prompt', async () => {
    const fakeResponse = {
      data: {
        candidates: [{
          content: {
            parts: [{
              text: 'Anime is a form of Japanese animation...'
            }]
          }
        }]
      }
    };

    axios.post.mockResolvedValue(fakeResponse);

    const result = await generateGeminiResponse('What is anime?');
    expect(result).toContain('Japanese animation');
  });

  it('returns empty string if response is missing', async () => {
    axios.post.mockResolvedValue({ data: {} });

    const result = await generateGeminiResponse('What is anime?');
    expect(result).toBe('');
  });

  it('throws error for invalid prompt', async () => {
    await expect(generateGeminiResponse('')).rejects.toThrow('Invalid prompt');
    await expect(generateGeminiResponse(null)).rejects.toThrow('Invalid prompt');
  });

  it('validates prompts correctly', () => {
    expect(isValidPrompt('Valid prompt')).toBe(true);
    expect(isValidPrompt('')).toBe(false);
    expect(isValidPrompt('   ')).toBe(false);
    expect(isValidPrompt(null)).toBe(false);
  });

  it('builds correct prompt format', () => {
    const result = buildPrompt('Test prompt');
    expect(result).toEqual({
      contents: [{
        parts: [{ text: 'Test prompt' }]
      }]
    });
  });
});
