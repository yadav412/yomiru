import { searchAnime } from './jikan';

global.fetch = jest.fn(); // mock fetch

describe('Jikan API - searchAnime', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('calls Jikan API with the correct URL', async () => {
    const mockData = { data: [{ title: 'Fullmetal Alchemist' }] };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await searchAnime('Fullmetal Alchemist');

    expect(fetch).toHaveBeenCalledWith(
      'https://api.jikan.moe/v4/anime?q=Fullmetal%20Alchemist&limit=5'
    );
    expect(result).toEqual(mockData.data);
  });

  it('throws an error when API returns non-ok response', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(searchAnime('Bleach')).rejects.toThrow(
      'Jikan API request failed with status 500'
    );
  });

  it('handles empty search results', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const result = await searchAnime('nonexistenttitle');
    expect(result).toEqual([]);
  });

  it('supports custom limit parameter', async () => {
    const mockData = { data: Array(2).fill({ title: 'Test Anime' }) };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await searchAnime('Naruto', 2);

    expect(fetch).toHaveBeenCalledWith(
      'https://api.jikan.moe/v4/anime?q=Naruto&limit=2'
    );
    expect(result.length).toBe(2);
  });
});
