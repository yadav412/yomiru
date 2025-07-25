const carousel = document.getElementById("carousel");
const items = document.querySelectorAll(".carousel-item");
const title = document.getElementById("anime-title");
const desc = document.getElementById("anime-desc");

function updateCenterItem() {
  let centerIndex = 0;
  let minDiff = Infinity;

  items.forEach((item, index) => {
    const rect = item.getBoundingClientRect();
    const centerY = window.innerHeight / 2;
    const itemCenterY = rect.top + rect.height / 2;
    const diff = Math.abs(centerY - itemCenterY);

    if (diff < minDiff) {
      minDiff = diff;
      centerIndex = index;
    }
  });

  items.forEach((item, idx) => {
    item.classList.toggle("active", idx === centerIndex);
  });

  const activeItem = items[centerIndex];
  title.textContent = activeItem.dataset.title;
  desc.textContent = activeItem.dataset.desc;
}

carousel.addEventListener("scroll", () => {
  requestAnimationFrame(updateCenterItem);
});

updateCenterItem();

async function fetchAnimeByTitle(title) {
  const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`);
  const data = await response.json();
  return data.data[0]; 
}

async function fetchAnimeData(title) {
  const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`);
  const data = await res.json();
  return data.data?.[0]; 
}

async function updateCarouselItems() {
  const items = document.querySelectorAll('.carousel-item');

  for (const item of items) {
    const title = item.dataset.title;

    try {
      const anime = await fetchAnimeData(title);

      if (anime) {
    
        item.dataset.desc = anime.synopsis;

       
        const descEl = document.createElement('p');
        descEl.textContent = anime.synopsis;
        descEl.style.fontSize = "0.9em";
        descEl.style.padding = "8px";
        descEl.style.background = "#f4f4f4";
        item.appendChild(descEl);
      }
    } catch (err) {
      console.error(`Failed to load data for ${title}:`, err);
    }
  }
}

document.addEventListener('DOMContentLoaded', updateCarouselItems);

 async function fetchAnimeData(title) {
    const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`);
    const data = await res.json();
    return data.data?.[0]; // First result
  }

  async function updateDataDescAttributes() {
    const items = document.querySelectorAll('.carousel-item');

    for (const item of items) {
      const title = item.dataset.title;

      try {
        const anime = await fetchAnimeData(title);

        if (anime && anime.synopsis) {
          // Update ONLY the data-desc attribute
          item.dataset.desc = anime.synopsis;
        }
      } catch (err) {
        console.error(`Error fetching anime "${title}":`, err);
      }
    }
  }

  document.addEventListener('DOMContentLoaded', updateDataDescAttributes);

  function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchAnimeData(title) {
  const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`);
  const data = await res.json();
  return data.data?.[0]; // First result
}

async function updateDataDescAttributes() {
  const items = document.querySelectorAll('.carousel-item');

  for (const item of items) {
    const title = item.dataset.title;

    try {
      const anime = await fetchAnimeData(title);

      if (anime && anime.synopsis) {
        item.dataset.desc = anime.synopsis;
      }
    } catch (err) {
      console.error(`Error fetching ${title}:`, err);
    }

    // Wait 500ms before next request to avoid rate limit
    await sleep(500);
  }
}

document.addEventListener('DOMContentLoaded', updateDataDescAttributes);