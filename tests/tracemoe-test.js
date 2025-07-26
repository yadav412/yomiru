

const fetch = require('node-fetch');
const fs = require('fs');
const FormData = require('form-data');

describe('Trace Moe API', () => {
  it('should return an anime match given an image', async () => {
    const imageBuffer = fs.readFileSync('test-image.jpg'); // uses naruto scene as test
    const form = new FormData();
    form.append('image', imageBuffer, {
      filename: 'test-image.jpg',
      contentType: 'image/jpeg',
    });

    const response = await fetch('https://api.trace.moe/search', {
      method: 'POST',
      body: form,
    });

    const data = await response.json();

    expect(data.result.length).toBeGreaterThan(0);
    const bestMatch = data.result[0];

    expect(bestMatch.anime || bestMatch.title_english || bestMatch.title_native).toBeDefined();
    expect(bestMatch.similarity).toBeGreaterThan(0.8);
  });
});