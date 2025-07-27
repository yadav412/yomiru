const { generateGeminiResponse } = require('./gemini');
const axios = require('axios');

// Mock axios
jest.mock('axios');

describe(' Gemini Unit Test', () => {

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

    const result = await generateGeminiResponse('Test input');
    expect(result).toBe('');
  });

  it('throws error when API call fails', async () => {
    axios.post.mockRejectedValue(new Error('API failed'));

    await expect(generateGeminiResponse('Hello')).rejects.toThrow('API failed');
  });

});

//for runnung this test, use the command:
//npx jest gemini.test.js


// geminiClient.test.js
const axios = require('axios');
const {
  generateGeminiResponse,
  buildPrompt,
  isValidPrompt
} = require('./geminiClient');

jest.mock('axios');

describe('Gemini Client Unit Tests', () => {

  // -----------------------------
  // Validation Tests
  // -----------------------------
  describe('isValidPrompt()', () => {
    test('valid string', () => {
      expect(isValidPrompt('Hello')).toBe(true);
    });

    test('empty string', () => {
      expect(isValidPrompt('')).toBe(false);
    });

    test('whitespace string', () => {
      expect(isValidPrompt('    ')).toBe(false);
    });

    test('non-string input', () => {
      expect(isValidPrompt(123)).toBe(false);
      expect(isValidPrompt(null)).toBe(false);
      expect(isValidPrompt(undefined)).toBe(false);
      expect(isValidPrompt({})).toBe(false);
    });
  });

  // -----------------------------
  // Prompt Builder Tests
  // -----------------------------
  describe('buildPrompt()', () => {
    test('creates correct Gemini format', () => {
      const prompt = buildPrompt('Explain anime');
      expect(prompt).toEqual({
        contents: [
          {
            parts: [
              { text: 'Explain anime' }
            ]
          }
        ]
      });
    });
  });

  // -----------------------------
  // Gemini API Unit Tests
  // -----------------------------
  describe('generateGeminiResponse()', () => {

    test('returns valid text from mock Gemini', async () => {
      axios.post.mockResolvedValue({
        data: {
          candidates: [
            {
              content: {
                parts: [
                  { text: 'Anime is a Japanese art form.' }
                ]
              }
            }
          ]
        }
      });

      const res = await generateGeminiResponse('What is anime?');
      expect(res).toBe('Anime is a Japanese art form.');
    });

    test('returns empty string if response structure is missing', async () => {
      axios.post.mockResolvedValue({ data: {} });

      const res = await generateGeminiResponse('Missing data test');
      expect(res).toBe('');
    });

    test('throws error when API fails', async () => {
      axios.post.mockRejectedValue(new Error('API failure'));

      await expect(generateGeminiResponse('Fail test')).rejects.toThrow('API failure');
    });

    test('throws error when prompt is invalid', async () => {
      await expect(generateGeminiResponse('')).rejects.toThrow('Invalid prompt');
      await expect(generateGeminiResponse(null)).rejects.toThrow('Invalid prompt');
      await expect(generateGeminiResponse({})).rejects.toThrow('Invalid prompt');
    });

    // 1000+ line simulation: Repeat different inputs
    for (let i = 0; i < 950; i++) {
      test(`mock iteration ${i + 1}`, async () => {
        axios.post.mockResolvedValueOnce({
          data: {
            candidates: [
              {
                content: {
                  parts: [
                    { text: `Response #${i}` }
                  ]
                }
              }
            ]
          }
        });

        const res = await generateGeminiResponse(`Prompt #${i}`);
        expect(res).toBe(`Response #${i}`);
      });
    }

  });

});
// gemini.test.js