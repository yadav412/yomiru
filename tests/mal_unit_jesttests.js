import { searchAnime } from './malAPI';

global.fetch = jest.fn();

describe('searchAnime', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('calls the correct API endpoint', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [{ title: 'Attack on Titan' }] }),
    });

    const result = await searchAnime('Attack on Titan');

    expect(fetch).toHaveBeenCalledWith(
      'https://api.jikan.moe/v4/anime?q=Attack%20on%20Titan&limit=5'
    );
    expect(result).toEqual([{ title: 'Attack on Titan' }]);
  });

  it('throws an error on failed response', async () => {
    fetch.mockResolvedValueOnce({ ok: false });

    await expect(searchAnime('Naruto')).rejects.toThrow('Failed to fetch anime data');
  });

  it('returns empty array if no results found', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const result = await searchAnime('NotARealAnime1234');
    expect(result).toEqual([]);
  });
});
