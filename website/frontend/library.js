// Global slides array
let slides = [];
let currentEditId = null;

// Fetch slides from server
async function fetchSlides() {
  try {
    const res = await fetch('http://localhost:3000/slides', {
      method: 'GET',
      credentials: 'include'
    });

    if (!res.ok) throw new Error('Failed to fetch slides');

    const data = await res.json();
    return data;
  } catch (err) {
    console.error(err);
    return [];
  }
}

// Render slides in the grid
function renderSlides(slidesData) {
  const container = document.querySelector('.content-grid');
  container.innerHTML = '';

  slidesData.forEach(slide => {
    const slideEl = document.createElement('div');
    slideEl.classList.add('content-item');

    slideEl.innerHTML = `
      <h3>${slide.name}</h3>
      ${slide.type === 'img'
        ? `<img src="${slide.url}" alt="${slide.name}" />`
        : `<video src="${slide.url}" alt="${slide.name}" controls></video>`}
      <p>Id: ${slide.id}</p>
      <p>Duration: ${slide.duration}s</p>
      <p>Display: ${slide.display}</p>
      <div class="actions">
        <button class="edit-btn" data-id="${slide.id}">Edit</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;

    container.appendChild(slideEl);
  });
}

// Initialize content library
async function initContentLibrary() {
  slides = await fetchSlides(); // store globally
  renderSlides(slides);
}

initContentLibrary();

// Modal elements
const editModal = document.getElementById('editModal');
const editName = document.getElementById('editName');
const editDuration = document.getElementById('editDuration');
const editDisplay = document.getElementById('editDisplay');

// Open modal on edit button click
document.addEventListener('click', (e) => {
  if (!e.target.classList.contains('edit-btn')) return;

  const slideId = Number(e.target.dataset.id);
  currentEditId = slideId;

  const slide = slides.find(s => s.id === slideId);
  if (!slide) return;

  editName.value = slide.name;
  editDuration.value = slide.duration;
  editDisplay.value = slide.display;

  editModal.classList.add('show');
});

// Close modal
document.getElementById('closeEdit').addEventListener('click', () => {
  editModal.classList.remove('show');
});

// Close modal if clicking outside content
editModal.addEventListener('click', (e) => {
  if (e.target === editModal) {
    editModal.classList.remove('show');
  }
});

// Save edits
document.getElementById('saveEdit').addEventListener('click', async () => {
  if (currentEditId === null) return;

  const updatedSlide = {
    name: editName.value,
    duration: Number(editDuration.value),
    display: editDisplay.value
  };

  try {
    const res = await fetch(`http://localhost:3000/slides/${currentEditId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updatedSlide)
    });

    if (!res.ok) throw new Error('Failed to update slide');

    // Update local array
    const index = slides.findIndex(s => s.id === currentEditId);
    if (index !== -1) slides[index] = { ...slides[index], ...updatedSlide };

    renderSlides(slides);

    editModal.classList.remove('show');
    currentEditId = null;
  } catch (err) {
    console.error(err);
    alert('Failed to save changes.');
  }
});

document.addEventListener('click', async (e) => {
  if (!e.target.matches('.delete-btn')) return; // Delete button

  const slideEl = e.target.closest('.content-item');
  const slideId = Number(slideEl.querySelector('.edit-btn').dataset.id);

  if (!confirm('Are you sure you want to delete this slide?')) return;

  try {
    const res = await fetch(`http://localhost:3000/slides/${slideId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!res.ok) throw new Error('Failed to delete slide');

    slides = slides.filter(s => s.id !== slideId);
    renderSlides(slides);
  } catch (err) {
    console.error(err);
    alert('Failed to delete slide.');
  }
});

// Function to filter and render slides
function filterSlides() {
  const searchValue = document.getElementById('search').value.toLowerCase();
  const typeValue = document.getElementById('filter-type').value;

  const filtered = slides.filter(slide => {
    const matchesSearch = slide.name.toLowerCase().includes(searchValue);
    let matchesType = true;

    if (typeValue) {
      if (typeValue === 'image') matchesType = slide.type === 'img';
      else if (typeValue === 'video') matchesType = slide.type === 'vid';
      else if (typeValue === 'text') matchesType = slide.type === 'text';
    }

    return matchesSearch && matchesType;
  });

  renderSlides(filtered);
}

// Live search
document.getElementById('search').addEventListener('input', filterSlides);

// Type filter
document.getElementById('filter-type').addEventListener('change', filterSlides);

    async function checkAuth() {
      try {
        const res = await fetch('http://localhost:3000/auth/check', {
          credentials: 'include'
        });

        if (!res.ok) {
          window.location.href = 'index.html';
        }
      } catch {
        console.log('logged in: do nothing');
      }
    }

  checkAuth();


