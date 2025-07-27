const express = require("express");
const axios = require("axios");
const cors = require("cors");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 3000; // Use Render's PORT or fallback to 3000

// Update CORS to allow both Netlify and Render domains
app.use(cors({
  origin: [
    "https://yomiru.netlify.app",
    "https://final-project-10-streams.onrender.com",
    "http://localhost:3000",
    "http://localhost:8080"
  ],
  credentials: true
}));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json()); // Add this to parse JSON requests


// Health check endpoint for deployment
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    malConfigured: !!CLIENT_ID,
    corsOrigin: [
      "https://yomiru.netlify.app",
      "https://final-project-10-streams-q2e3.onrender.com",
      "https://final-project-10-streams.onrender.com"
    ]
  });
});

app.use(express.json());
app.use(cookieParser());

// === ROOT ROUTE - Serve the main index.html ===
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});



// === 3. Get anime info ===
app.get("/mal/anime-info", async (req, res) => {
  const title = req.query.title;
  try {
    const info = await axios.get(`https://api.myanimelist.net/v2/anime`, {
      params: {
        q: title,
        limit: 10,
        fields: "start_date,end_date,synopsis"
      },
      headers: {
        "X-MAL-CLIENT-ID": CLIENT_ID
      }
    });

    res.json(info.data);
  } catch (err) {
    console.error("Anime info error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch anime info" });
  }
});

// === NEW: Get anime info by ID ===
app.get("/mal/anime-by-id/:id", async (req, res) => {
  const animeId = req.params.id;
  try {
        const info = await axios.get(`https://api.myanimelist.net/v2/anime/${animeId}`, {
      params: {
        fields: "title,start_date,end_date,synopsis"
      },
      headers: {
        "X-MAL-CLIENT-ID": CLIENT_ID
      }
    });

    res.json(info.data);
  } catch (err) {
    console.error("Anime info by ID error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch anime info by ID" });
  }
});

// === 4. Recommend based on genre ===
app.get("/mal/recommend", async (req, res) => {
  const title = req.query.title;
  try {
    const searchRes = await axios.get(`https://api.myanimelist.net/v2/anime`, {
      params: {
        q: title,
        limit: 10,
        fields: "genres,mean,rank,popularity"
      },
      headers: {
        "X-MAL-CLIENT-ID": CLIENT_ID
      }
    });

    const anime = searchRes.data.data?.[0]?.node;
    if (!anime || !anime.genres || anime.genres.length === 0) {
      return res.json({ anime, recommendations: [] });
    }

    const genre = anime.genres[0].name;
    const recRes = await axios.get(`https://api.myanimelist.net/v2/anime`, {
      params: {
        q: genre,
        limit: 10,
        fields: "mean"
      },
      headers: {
        "X-MAL-CLIENT-ID": CLIENT_ID
      }
    });

    const recommendations = recRes.data.data
      .map(a => a.node)
      .filter(a => a.mean && a.mean > 7 && a.title !== anime.title)
      .slice(0, 5);

    res.json({
      anime: {
        title: anime.title,
        genres: anime.genres.map(g => g.name),
        mean: anime.mean,
        popularity: anime.popularity
      },
      recommendations
    });
  } catch (err) {
    console.error("Recommendation error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});

// === 5. Get trending anime ===
app.get("/mal/trending", async (req, res) => {
  const limit = req.query.limit || 50;
  const offset = req.query.offset || 0;

  try {
    const info = await axios.get(`https://api.myanimelist.net/v2/anime/ranking`, {
      params: {
        ranking_type: 'bypopularity',
        limit: limit,
        offset: offset,
        fields: "id,title,main_picture,synopsis,start_date,mean"
      },
      headers: {
        "X-MAL-CLIENT-ID": CLIENT_ID
      }
    });
    
    // Transform the response to match frontend expectations
    const anime = info.data.data.map(item => ({
      id: item.node.id,
      title: item.node.title,
      main_picture: item.node.main_picture,
      synopsis: item.node.synopsis,
      start_date: item.node.start_date,
      mean: item.node.mean
    }));
    
    res.json({ anime });
  } catch (err) {
    console.error("Trending anime error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch trending anime" });
  }
});

// === 6. Get similar anime based on anime ID ===
app.get("/mal/similar/:id", async (req, res) => {
  const animeId = req.params.id;
  const limit = req.query.limit || 10;

  try {
    // First get the anime details to find its genres
    const animeInfo = await axios.get(`https://api.myanimelist.net/v2/anime/${animeId}`, {
      params: {
        fields: 'genres'
      },
      headers: {
        "X-MAL-CLIENT-ID": CLIENT_ID
      }
    });

    const genres = animeInfo.data.genres;
    if (!genres || genres.length === 0) {
      return res.json({ similar: [] });
    }

    // Get anime by the same genres
    const similarAnime = await axios.get('https://api.myanimelist.net/v2/anime/ranking', {
      params: {
        ranking_type: 'bypopularity',
        limit: limit * 2, // Get more to filter out the original
        fields: 'id,title,main_picture,synopsis,genres'
      },
      headers: {
        "X-MAL-CLIENT-ID": CLIENT_ID
      }
    });

    // Filter anime that share genres and exclude the original anime
    const similar = similarAnime.data.data
      .map(item => item.node)
      .filter(anime => 
        anime.id !== parseInt(animeId) && 
        anime.genres && 
        anime.genres.some(genre => genres.some(originalGenre => originalGenre.id === genre.id))
      )
      .slice(0, limit)
      .map(anime => ({
        id: anime.id,
        title: anime.title,
        main_picture: anime.main_picture,
        synopsis: anime.synopsis
      }));

    res.json({ similar });
  } catch (err) {
    console.error('Similar anime error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch similar anime' });
  }
});

// === 7. Search for anime ===
app.get('/mal/search', async (req, res) => {
  const q = req.query.title;
  try {
    const apiRes = await axios.get('https://api.myanimelist.net/v2/anime', {
      params: { q, limit: 5, fields: 'title,main_picture,synopsis,mean,start_date' },
      headers: { 'X-MAL-CLIENT-ID': process.env.MAL_CLIENT_ID }
    });
    res.json(apiRes.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ data: [] });
  }
});

// Simple Gemini API proxy for document formatting
app.post('/api/generate', async (req, res) => {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      console.warn('⚠️ GEMINI_API_KEY not found, using fallback formatting');
      return res.status(500).json({ error: 'Gemini API not configured' });
    }

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Gemini API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

const imageUrl = "https://example.com/myanimeimage.jpg";  
