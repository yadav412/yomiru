function loginWithMAL() {
  window.location.href = "http://localhost:3000/login";
}

async function getAnimeInfo(title) {
  const response = await fetch(`http://localhost:3000/mal/anime-info?title=${encodeURIComponent(title)}`);

  const data = await response.json();
  const anime = data.data?.[0]?.node;

  if (!anime) {
    console.error("Anime not found");
    return;
  }

  return anime.synopsis;
}

async function getAnimeDetailsThenSuggest() {
  const title = document.getElementById('animeSuggest').value;

  const response = await fetch(`http://localhost:3000/mal/recommend?title=${encodeURIComponent(title)}`);
  const data = await response.json();

  if (!data.anime) {
    document.getElementById("malResult2").innerText = "Anime not found.";
    return;
  }

  const anime = data.anime;
  const genreString = anime.genres.join(", ") || "N/A";

  document.getElementById("malResult2").innerHTML = `
    <h3>${anime.title}</h3>
    <p><strong>Genres:</strong> ${genreString}</p>
    <p><strong>Rating:</strong> ${anime.mean ?? "N/A"}</p>
    <p><strong>Popularity:</strong> ${anime.popularity ?? "N/A"}</p>
  `;

  if (data.recommendations?.length > 0) {
    document.getElementById("malSuggestions").innerHTML = `
      <h4>Recommended anime (based on genre: ${anime.genres[0]}):</h4>
      <ul>
        ${data.recommendations.map(a => `<li>${a.title} (Rating: ${a.mean})</li>`).join("")}
      </ul>
    `;
  } else {
    document.getElementById("malSuggestions").innerText = `No high-rated suggestions found for genre: ${anime.genres[0]}`;
  }
}

function cleanTitle(title) {
  // Remove bracketed and parenthesized content (e.g., [ReinForce], (BDRip))
  let cleanedTitle = title.replace(/\[.*?\]/g, "").replace(/\(.*?\)/g, "");
  // Remove common file extensions
  cleanedTitle = cleanedTitle.replace(/\.mp4|\.mkv|\.avi|\.flac/gi, "");
  // Trim whitespace from the start and end
  return cleanedTitle.trim();
}

async function getAnimeInfoById(malId) {
  const response = await fetch(`http://localhost:3000/mal/anime-by-id/${malId}`);
  const data = await response.json();
  return data.synopsis;
}

async function testTraceMoe() {
  const fileInput = document.getElementById('tracemoein');
  const file = fileInput.files[0];

  if (!file) {
    return;
  }

  const formData = new FormData();
  formData.append("image", file);

  try {
    const traceRes = await fetch("https://api.trace.moe/search", {
      method: "POST",
      body: formData,
    });

    const traceData = await traceRes.json();
    const bestMatch = traceData.result?.[0];

    if (bestMatch) {
      const malId = bestMatch.anilist.idMal; // Use MAL ID from the response
      const title =
        bestMatch.anime ||
        bestMatch.title_english ||
        bestMatch.title_native ||
        bestMatch.filename ||
        "Unknown Title";

      const episode = bestMatch.episode;
      const similarity = bestMatch.similarity;
      const videoUrl = bestMatch.video;
      const from = bestMatch.from;

      const minutes = Math.floor(from / 60);
      const seconds = Math.floor(from % 60);

      // Fetch summary using the MAL ID if available, otherwise fall back to title search
      let summary;
      if (malId) {
        summary = await getAnimeInfoById(malId);
      } else {
        const cleanedTitle = cleanTitle(title);
        summary = await getAnimeInfo(cleanedTitle);
      }

      document.getElementById("tracemoeheading").innerHTML = `<strong>Title:</strong> ${title}<br>`;
      document.getElementById("tracemoepara").innerHTML =
        `<strong>Episode:</strong> ${episode}<br>` +
        `<strong>Timestamp:</strong> ${minutes}:${seconds.toString().padStart(2, '0')}<br>` +
        `<strong>Similarity:</strong> ${similarity.toFixed(2)}<br><br>` +
        `<video controls width="300" src="${videoUrl}"></video><br>` +
        `<strong>Summary:</strong> ${summary || "Summary not available."}`;
    } else {
      console.log("TraceMoe full response:", traceData);
      document.getElementById("tracemoeheading").textContent = "No match found.";
      document.getElementById("tracemoepara").textContent = "";
    }
  } catch (err) {
    console.error("Trace Moe error:", err);
    document.getElementById("tracemoeheading").textContent = "Error calling Trace Moe.";
    document.getElementById("tracemoepara").textContent = "";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const malLoginButton = document.getElementById("malLoginButton");
  if (malLoginButton) {
    malLoginButton.addEventListener("click", loginWithMAL);
  }

  const animeSuggestButton = document.getElementById("animeSuggestButton");
  if (animeSuggestButton) {
    animeSuggestButton.addEventListener("click", getAnimeDetailsThenSuggest);
  }
  
  const tracemoein = document.getElementById("tracemoein");
  if (tracemoein) {
    tracemoein.addEventListener("change", testTraceMoe);
  }
});