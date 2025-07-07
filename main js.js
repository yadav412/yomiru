
async function testTraceMoe() {
  const imgUrl = 'images/Gomu_Gomu_no_Kong_Organ.webp';

  const response = await fetch(imgUrl);
  const blob = await response.blob();

  const file = new File([blob], imgUrl, { type: blob.type });

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
      const rawTitle =
        bestMatch.anime ||
        bestMatch.title_english ||
        bestMatch.title_native ||
        bestMatch.filename ||
        "Unknown Title"; //gets any title available, feature 1
      
      const title = cleanTitle(rawTitle);

      const episode = bestMatch.episode; //feature 1
      const similarity = bestMatch.similarity; //lets you know how accurate traceMoe thinks it is
      const videoUrl = bestMatch.video; //shows a video of where timestamp is from
      const from = bestMatch.from; //for feature 2

      const minutes = Math.floor(from / 60);
      const seconds = Math.floor(from % 60); //for the timestamp, feature 2

      const summary = await getAnimeInfo(title); //for the summary, feature 3

      document.getElementById("traceResult").innerHTML =
        `<strong>Anime:</strong> ${title}<br>` +
        `<strong>Episode:</strong> ${episode}<br>` +
        `<strong>Timestamp:</strong> ${minutes}:${seconds.toString().padStart(2, '0')}<br>` +
        `<strong>Similarity:</strong> ${similarity.toFixed(2)}<br><br>` +
        `<video controls width="300" src="${videoUrl}"></video><br>` +
        `<strong>Summary:</strong> ${summary}`;
    } else {
      document.getElementById("traceResult").textContent = "No match found.";
    }
  } catch (err) {
    console.error("Trace Moe error:", err);
    document.getElementById("traceResult").textContent = "Error calling Trace Moe.";
  }
}

function cleanTitle(rawTitle) { //for getting rid of random characters or east-asian language characters or numbers, and just getting the anime title
  const match = rawTitle.match(/\[([^\]]*One_Piece[^\]]*)\]/i) || rawTitle.match(/\[([^\]]*Naruto[^\]]*)\]/i);
  if (match) return match[1].replace(/_/g, " ");

  // Fallback: remove anything in brackets and extensions
  return rawTitle.replace(/\[.*?\]/g, "").replace(/\.(mp4|mkv|avi)$/, "").trim();
}

function loginWithMAL() {
  window.location.href = "http://localhost:3000/login";
}

async function getAnimeInfo(title) {
  const response = await fetch(`http://localhost:3000/mal/anime-info?title=${encodeURIComponent(title)}`);

  const data = await response.json();
  const anime = data.data?.[0]?.node;

  if (!anime) {
    document.getElementById("malResult1").innerText = "Anime not found.";
    return;
  }

  document.getElementById("malResult1").innerHTML = `
    <h3>${anime.title}</h3>
    <p><strong>Start Date:</strong> ${anime.start_date}</p>
    <p><strong>End Date:</strong> ${anime.end_date ?? "Ongoing"}</p>
    <p><strong>Synopsis:</strong> ${anime.synopsis}</p>
  `;

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