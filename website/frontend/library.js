async function fetchSlides() {
  try {
    const res = await fetch('http://localhost:3000/slides', {
      method: 'GET',
      credentials: 'include' // important for session
    });

    if (!res.ok) throw new Error('Failed to fetch slides');

    const slides = await res.json();
    return slides;
  } catch (err) {
    console.error(err);
    return [];
  }
}

function renderSlides(slides) {
  const container = document.querySelector('.content-grid');
  container.innerHTML = ''; // clear previous items

  slides.forEach(slide => {
    const slideEl = document.createElement('div');
    slideEl.classList.add('content-item');

    slideEl.innerHTML = `
      <h3>${slide.name}</h3>
        ${slide.type === 'img'
        ? `<img src="${slide.url}" alt="${slide.name}" />`
        : `<video src="${slide.url}" controls></video>`}

      <p>Duration: ${slide.duration}s</p>
      <p>Display: ${slide.display}</p>
      <div class="actions">
            <button>Edit</button>
            <button>Delete</button>
        </div>
    `;

    container.appendChild(slideEl);
  });
}

async function initContentLibrary() {
  const slides = await fetchSlides();
  renderSlides(slides);
}

initContentLibrary();

