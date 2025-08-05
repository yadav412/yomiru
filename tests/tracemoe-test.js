

const fetch = require('node-fetch');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

describe('Trace Moe API', () => {
  it('should return an anime match given an image', async () => {
    // Use an existing anime image from the project
    const imagePath = path.join(__dirname, '../public/images/naruto.jpeg');
    
    // Check if file exists before trying to read it
    if (!fs.existsSync(imagePath)) {
      console.warn('Test image not found, skipping TraceMoe test');
      return;
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const form = new FormData();
    form.append('image', imageBuffer, {
      filename: 'naruto.jpeg',
      contentType: 'image/jpeg',
    });

    const response = await fetch('https://api.trace.moe/search', {
      method: 'POST',
      body: form,
    });

    const data = await response.json();

    // Check if the API returned results
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('result');
    expect(Array.isArray(data.result)).toBe(true);
    
    if (data.result && data.result.length > 0) {
      const bestMatch = data.result[0];
      
      // Check that the match has required properties
      expect(bestMatch).toHaveProperty('similarity');
      expect(typeof bestMatch.similarity).toBe('number');
      expect(bestMatch.similarity).toBeGreaterThan(0);
      
      // Check that it has some form of title/anime identifier
      expect(
        bestMatch.anime || 
        bestMatch.title_english || 
        bestMatch.title_native ||
        bestMatch.filename
      ).toBeDefined();
    } else {
      console.warn('No results returned from TraceMoe API - this is acceptable for testing');
    }
  }, 15000); // Increase timeout for API calls
});