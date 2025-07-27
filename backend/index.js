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


// === OAuth Configuration ===

const CLIENT_ID = process.env.MAL_CLIENT_ID;
const CLIENT_SECRET = process.env.MAL_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

console.log("🔍 Environment Variables Check:");
console.log("CLIENT_ID:", CLIENT_ID ? "✓ Loaded" : "❌ Missing");
console.log("CLIENT_SECRET:", CLIENT_SECRET ? "✓ Loaded" : "❌ Missing");
console.log("REDIRECT_URI:", REDIRECT_URI || "❌ Missing - will use auto-detect");

let access_token = "";

// Hardcoded redirect URI to ensure absolute consistency
const OAUTH_REDIRECT_URI = "https://final-project-10-streams.onrender.com/callback";

// Store code verifiers temporarily (in production, use Redis or database)
const codeVerifierStore = new Map();

// Cleanup expired code verifiers every 5 minutes
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [state, data] of codeVerifierStore.entries()) {
    if (now > data.expires) {
      codeVerifierStore.delete(state);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} expired code verifiers`);
  }
}, 5 * 60 * 1000); // Every 5 minutes

// Helper function to get redirect URI - always use the same hardcoded value
function getRedirectUri(req) {
  console.log("🔧 Using hardcoded REDIRECT_URI:", OAUTH_REDIRECT_URI);
  return OAUTH_REDIRECT_URI;
}


// === 1. Login route (WITH PKCE + STATE) ===
app.get("/login", async (req, res) => {
  console.log("🚀 LOGIN - Using OAuth flow WITH PKCE + STATE");

  try {
    // Generate PKCE parameters
    const codeVerifier = await generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // Generate unique state parameter to correlate this request
    const state = crypto.randomBytes(16).toString('hex');
    
    console.log("🔐 Generated PKCE parameters:");
    console.log("  Code verifier:", codeVerifier.substring(0, 20) + "...");
    console.log("  Code challenge:", codeChallenge.substring(0, 20) + "...");
    console.log("  State:", state);

    // Store code verifier with state as key (expires in 10 minutes)
    codeVerifierStore.set(state, {
      codeVerifier,
      timestamp: Date.now(),
      expires: Date.now() + (10 * 60 * 1000)
    });

    // Use environment variable redirect URI
    const redirectUri = getRedirectUri(req);
    console.log("🚀 LOGIN - Using redirect URI:", redirectUri);

    // OAuth authorization URL with PKCE and state
    const authUrl = `https://myanimelist.net/v1/oauth2/authorize` +
    `?response_type=code` +
    `&client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&code_challenge=${codeChallenge}` +
    `&code_challenge_method=S256` +
    `&state=${state}`;

    console.log("🚀 Complete authorization URL (WITH PKCE + STATE):", authUrl);

    res.redirect(authUrl);
  } catch (error) {
    console.error("❌ Error generating PKCE parameters:", error);
    res.status(500).send("Failed to generate login parameters");
  }
});

// === 2. Callback handler (WITH PKCE + STATE) ===
app.get("/callback", async (req, res) => {
  console.log("🔄 Callback endpoint hit (WITH PKCE + STATE)");
  console.log("Query params:", req.query);
  
  const code = req.query.code;
  const state = req.query.state;

  console.log("🔍 OAuth Callback Debug (WITH PKCE + STATE):");
  console.log("CLIENT_ID:", CLIENT_ID ? "✓ Present" : "❌ Missing");
  console.log("CLIENT_SECRET:", CLIENT_SECRET ? "✓ Present" : "❌ Missing");
  console.log("REDIRECT_URI:", REDIRECT_URI || "❌ Missing");
  console.log("Authorization Code:", code ? "✓ Present" : "❌ Missing");
  console.log("State:", state ? "✓ Present" : "❌ Missing");
  
  // Check for OAuth error parameters
  if (req.query.error) {
    console.log("❌ MyAnimeList returned an error:");
    console.log("  error:", req.query.error);
    console.log("  error_description:", req.query.error_description);
    console.log("  error_uri:", req.query.error_uri);
    return res.status(400).send(`MyAnimeList authorization failed: ${req.query.error} - ${req.query.error_description || 'No description provided'}`);
  }
  
  if (!code) {
    console.error("❌ Missing authorization code");
    return res.status(400).send("Missing authorization code from MyAnimeList.");
  }

  if (!state) {
    console.error("❌ Missing state parameter");
    return res.status(400).send("Missing state parameter. Please try logging in again.");
  }

  // Retrieve code verifier using state
  const storedData = codeVerifierStore.get(state);
  if (!storedData) {
    console.error("❌ No code verifier found for state:", state);
    return res.status(400).send("Invalid or expired state. Please try logging in again.");
  }

  // Check if expired
  if (Date.now() > storedData.expires) {
    console.error("❌ Code verifier expired for state:", state);
    codeVerifierStore.delete(state); // Clean up
    return res.status(400).send("Authorization expired. Please try logging in again.");
  }

  const codeVerifier = storedData.codeVerifier;
  console.log("✅ Retrieved code verifier for state:", state);
  console.log("  Code verifier:", codeVerifier ? "✓ Present" : "❌ Missing");

  // Clean up - remove used code verifier
  codeVerifierStore.delete(state);

  // Use same redirect URI as login route
  const redirectUri = getRedirectUri(req);
  console.log("🔄 CALLBACK - Using redirect URI:", redirectUri);
  
  try {
    console.log("🚀 About to exchange code for token with IMPROVED PKCE + STATE:");
    console.log("Token endpoint:", "https://myanimelist.net/v1/oauth2/token");

    const tokenRequestData = {
      grant_type: "authorization_code",
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier
    };
    
    console.log("🚀 Token request data being sent (IMPROVED PKCE + STATE):");
    console.log("  grant_type:", tokenRequestData.grant_type);
    console.log("  code:", tokenRequestData.code ? `${tokenRequestData.code.substring(0, 20)}...` : "❌ Missing");
    console.log("  client_id:", tokenRequestData.client_id ? "✓ Present" : "❌ Missing");
    console.log("  client_secret:", tokenRequestData.client_secret ? "✓ Present" : "❌ Missing");
    console.log("  redirect_uri:", tokenRequestData.redirect_uri);
    console.log("  code_verifier:", tokenRequestData.code_verifier ? `${tokenRequestData.code_verifier.substring(0, 20)}...` : "❌ Missing");

    const tokenRes = await axios.post(
      "https://myanimelist.net/v1/oauth2/token",
      new URLSearchParams(tokenRequestData).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    access_token = tokenRes.data.access_token;
    console.log("✅ Token exchange successful!");
    console.log("Access token received:", access_token ? "✓ Yes" : "❌ No");
    
    // Redirect to the appropriate domain based on environment
    const frontendUrl = process.env.FRONTEND_URL || req.get('host');
    const redirectProtocol = req.secure || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const finalRedirectUrl = `${redirectProtocol}://${frontendUrl}/index.html`;
    
    console.log("🔄 Redirecting to:", finalRedirectUrl);
    res.redirect(finalRedirectUrl);
  } catch (err) {
    console.error("❌ Token exchange failed (IMPROVED PKCE + STATE):", {
      error: err.response?.data || err.message,
      status: err.response?.status,
      statusText: err.response?.statusText,
      clientId: CLIENT_ID ? "✓ Set" : "✗ Missing",
      clientSecret: CLIENT_SECRET ? "✓ Set" : "✗ Missing",
      codeVerifier: codeVerifier ? `${codeVerifier.substring(0, 20)}...` : "✗ Missing",
      redirectUri: redirectUri,
      state: state
    });
    res.status(500).send("Login failed: " + JSON.stringify(err.response?.data || err.message));
  }
});


function base64URLEncode(buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, ''); // Remove all padding from the end
}

async function generateCodeVerifier() {
  // RFC 7636: Generate between 43-128 characters using specific charset
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  
  // Generate exactly 128 characters for maximum entropy
  for (let i = 0; i < 128; i++) {
    const randomByte = crypto.randomBytes(1)[0];
    result += charset[randomByte % charset.length];
  }
  
  console.log("🔐 Generated RFC 7636 compliant code verifier");
  console.log("🔐 Code verifier length:", result.length);
  return result;
}

async function generateCodeChallenge(codeVerifier) {
  console.log("🔐 Creating challenge for verifier using SHA256+Base64URL");
  
  // Use Node.js crypto directly for consistent results
  const hash = crypto.createHash('sha256').update(codeVerifier, 'ascii').digest();
  const challenge = base64URLEncode(hash);
  
  console.log("🔐 Generated code challenge:", challenge);
  console.log("🔐 Code challenge length:", challenge.length);
  return challenge;
}

const imageUrl = "https://example.com/myanimeimage.jpg";  