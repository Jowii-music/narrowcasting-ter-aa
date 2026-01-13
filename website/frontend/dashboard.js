async function loadDashboard() {
  try {
    const res = await fetch('/dashboard', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch dashboard data');

    const data = await res.json();

    // Inject data into HTML
    document.getElementById('total-slides').textContent = data.totalSlides;
    document.getElementById('image-count').textContent = data.imageCount;
    document.getElementById('last-upload').textContent = new Date(data.lastUpload).toLocaleDateString();
    document.getElementById('most-used-type').textContent = data.mostUsedType;
    document.getElementById('avg-duration').textContent = data.averageDuration;
    document.getElementById('recent-slide').textContent = data.mostRecentSlide;

  } catch (err) {
    console.error('Dashboard load error:', err);
  }
}

// Run after DOM is ready
document.addEventListener('DOMContentLoaded', loadDashboard);
