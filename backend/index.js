const express = require("express");
const axios = require("axios");
const cors = require("cors");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const app = express();
const PORT = 3000;

app.use(cors({
  origin: "https://yomiru.netlify.app",
  credentials: true
}));

const CLIENT_ID = process.env.MAL_CLIENT_ID;
const CLIENT_SECRET = process.env.MAL_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

console.log("Loaded CLIENT_ID from env:", CLIENT_ID);

let access_token = "";

app.use(express.json());
app.use(cookieParser());

// === 1. Login route ===
app.get("/login", (req, res) => {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  console.log("Storing code_verifier:", codeVerifier);
  // Set as cookie for use in /callback
  res.cookie("code_verifier", codeVerifier, {
    httpOnly: true,
    maxAge: 300000 // 5 minutes
  });

  const authUrl = `https://myanimelist.net/v1/oauth2/authorize` +
  `?response_type=code` +
  `&client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&code_challenge=${codeChallenge}` +
  `&code_challenge_method=S256`;

  res.redirect(authUrl);
});

// === 2. Callback handler ===
app.get("/callback", async (req, res) => {
  const code = req.query.code;
  const codeVerifier = req.cookies.code_verifier;

  console.log("Client ID:", CLIENT_ID);
  console.log("Redirect URI:", REDIRECT_URI);
  console.log("Code Verifier:", codeVerifier);
  console.log("Authorization Code:", code);
  if (!codeVerifier) {
    console.error("Missing code_verifier");
    return res.status(400).send("Missing code_verifier. Try logging in again.");
  }

  try {
    const qs = require("querystring");

    const tokenRes = await axios.post(
      "https://myanimelist.net/v1/oauth2/token",
      qs.stringify({
        grant_type: "authorization_code",
        code,
        client_id: CLIENT_ID,
        code_verifier: codeVerifier,
        redirect_uri: REDIRECT_URI
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    access_token = tokenRes.data.access_token;
    res.redirect("http://localhost:5500/index.html");
  } catch (err) {
    console.error("❌ Token exchange failed:", err.response?.data || err.message);
    res.status(500).send("Login failed" + JSON.stringify(err.response?.data || err.message));
  }
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
  try {
    const info = await axios.get(`https://api.myanimelist.net/v2/anime/ranking`, {
      params: {
        ranking_type: 'all',
        limit: 8,
        fields: "start_date,mean,synopsis"
      },
      headers: {
        "X-MAL-CLIENT-ID": CLIENT_ID
      }
    });
    res.json(info.data);
  } catch (err) {
    console.error("Trending anime error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch trending anime" });
  }
});

// === 6. Search for anime ===
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


app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

function base64URLEncode(str) {
  return str.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateCodeVerifier() {
  return base64URLEncode(crypto.randomBytes(32));
}

function generateCodeChallenge(codeVerifier) {
  return base64URLEncode(
    crypto.createHash("sha256").update(codeVerifier).digest()
  );
}

const imageUrl = "https://example.com/myanimeimage.jpg";  