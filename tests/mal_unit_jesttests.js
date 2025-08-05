// Mock search function for MAL API testing
const searchAnime = async (query, clientId) => {
  const response = await fetch(`https://api.myanimelist.net/v2/anime?q=${encodeURIComponent(query)}&limit=5`, {
    headers: {
      'X-MAL-CLIENT-ID': clientId
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch anime data from MAL API');
  }
  
  const data = await response.json();
  return data.data || [];
};

global.fetch = jest.fn();

describe('MAL API - searchAnime', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('calls the correct MAL API endpoint with proper headers', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [{ node: { title: 'Attack on Titan' } }] }),
    });

    const result = await searchAnime('Attack on Titan', 'test-client-id');

    expect(fetch).toHaveBeenCalledWith(
      'https://api.myanimelist.net/v2/anime?q=Attack%20on%20Titan&limit=5',
      {
        headers: {
          'X-MAL-CLIENT-ID': 'test-client-id'
        }
      }
    );
    expect(result).toEqual([{ node: { title: 'Attack on Titan' } }]);
  });

  it('throws an error on failed response', async () => {
    fetch.mockResolvedValueOnce({ ok: false });

    await expect(searchAnime('Naruto', 'test-client-id')).rejects.toThrow('Failed to fetch anime data from MAL API');
  });

  it('returns empty array if no results found', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const result = await searchAnime('NotARealAnime1234', 'test-client-id');
    expect(result).toEqual([]);
  });
});
