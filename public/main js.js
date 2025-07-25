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

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("traceButton").addEventListener("click", testTraceMoe);
  document.getElementById("malLoginButton").addEventListener("click", loginWithMAL);
  document.getElementById("animeSuggestButton").addEventListener("click", getAnimeDetailsThenSuggest);
});


function toggleSearch() {
  // You can implement search functionality here
  // For now, it will just show an alert
  const searchTerm = prompt("Enter your search term:");
  if (searchTerm) {
    alert(`Searching for: ${searchTerm}`);
    // Here you could redirect to a search page or perform a search
    // window.location.href = `search.html?q=${encodeURIComponent(searchTerm)}`;
  }
}

function toggleSearchBar() {
  const searchBar = document.querySelector('.searchbar');
  if (searchBar.style.display === 'none' || searchBar.style.display === '') {
    searchBar.style.display = 'block';
  } else {
    searchBar.style.display = 'none';
  }
  const input = document.getElementById('myInput');


}


document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("malLoginButton").addEventListener("click", loginWithMAL);
  document.getElementById("animeSuggestButton").addEventListener("click", getAnimeDetailsThenSuggest);
  document.getElementById("tracemoein").addEventListener("change", testTraceMoe); // ðŸ‘ˆ triggers when an image is selected
});

async function testTraceMoe() {
  const fileInput = document.getElementById('tracemoein');

  const file = fileInput.files[0];

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
      const title =
        bestMatch.anime ||
        bestMatch.title_english ||
        bestMatch.title_native ||
        bestMatch.filename ||
        "Unknown Title"; //gets any title available, feature 1

      const episode = bestMatch.episode; //feature 1
      const similarity = bestMatch.similarity; //lets you know how accurate traceMoe thinks it is
      const videoUrl = bestMatch.video; //shows a video of where timestamp is from
      const from = bestMatch.from; //for feature 2

      const minutes = Math.floor(from / 60);
      const seconds = Math.floor(from % 60); //for the timestamp, feature 2

      const summary = await getAnimeInfo(title); //for the summary, feature 3

      document.getElementById("tracemoeheading").innerHTML = `<strong>Title:</strong> ${title}<br>`;
      document.getElementById("tracemoepara").innerHTML =
        `<strong>Episode:</strong> ${episode}<br>` +
        `<strong>Timestamp:</strong> ${minutes}:${seconds.toString().padStart(2, '0')}<br>` +
        `<strong>Similarity:</strong> ${similarity.toFixed(2)}<br><br>` +
        `<video controls width="300" src="${videoUrl}"></video><br>` +
        `<strong>Summary:</strong> ${summary}`;
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

document.getElementById('tracemoein').addEventListener('change', testTraceMoe);