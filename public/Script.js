// ========== Vertical Anime Carousel Logic ==========

// Get references to carousel container and its items
const carousel = document.getElementById("carousel");
const items = document.querySelectorAll(".carousel-item");

// Get elements where the active anime's title and description will be displayed
const title = document.getElementById("anime-title");
const desc = document.getElementById("anime-desc");

/**
 * Finds the carousel item closest to the center of the screen
 * and highlights it as the active item.
 * Also updates the displayed title and description.
 */
function updateCenterItem() {
  if (!carousel || items.length === 0 || !desc) {
    return; // Exit if essential elements don't exist
  }

  let centerIndex = 0;
  let minDiff = Infinity;

  // Loop through all items to find the one closest to screen center
  items.forEach((item, index) => {
    const rect = item.getBoundingClientRect();
    const centerY = window.innerHeight / 2;
    const itemCenterY = rect.top + rect.height / 2;
    const diff = Math.abs(centerY - itemCenterY);

    // Keep track of the item with the smallest distance from screen center
    if (diff < minDiff) {
      minDiff = diff;
      centerIndex = index;
    }
  });

  // Add "active" class to the centered item, remove from others
  items.forEach((item, idx) => {
    item.classList.toggle("active", idx === centerIndex);
  });

  // Update the anime title and description shown on the page
  const activeItem = items[centerIndex];
  
  // Update title if element exists
  if (title && activeItem.dataset.title) {
    title.textContent = activeItem.dataset.title;
  }
  
  // Update description with line breaks for steps
  if (desc && activeItem.dataset.desc) {
    desc.innerHTML = (activeItem.dataset.desc || '').replace(/\\n/g, '<br>');
  }
}

// Initialize the carousel when page loads
document.addEventListener("DOMContentLoaded", () => {
  // Set initial state
  updateCenterItem();
  
  // Run update logic when the carousel is scrolled
  if (carousel) {
    carousel.addEventListener("scroll", () => {
      requestAnimationFrame(updateCenterItem);
    });
  }
});

descEl.innerHTML = (item.dataset.desc || '').replaceAll('\n', '<br>');

