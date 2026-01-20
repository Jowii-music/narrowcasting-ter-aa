    const form = document.getElementById('uploadForm');
    const resultDiv = document.getElementById('result');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(form);

      try {
        const response = await fetch('http://localhost:3000/upload', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (response.ok) {
          resultDiv.innerHTML = `<p style="color:green;">Upload successful! ID: ${data.file.id}</p>`;
        } else {
          resultDiv.innerHTML = `<p style="color:red;">Error: ${data.message||'unauthorized'}</p>`;
        }
      } catch (err) {
        resultDiv.innerHTML = `<p style="color:red;">Server error: ${err.message}</p>`;
      }
    });

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

    const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');

fileInput.addEventListener('change', () => {
  preview.innerHTML = ''; // clear old preview

  const file = fileInput.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);

  if (file.type.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = url;
    img.style.maxWidth = '100%';
    img.style.maxHeight = '200px';
    preview.appendChild(img);
  }

  if (file.type.startsWith('video/')) {
    const video = document.createElement('video');
    video.src = url;
    video.controls = true;
    video.style.maxWidth = '100%';
    video.style.maxHeight = '200px';
    preview.appendChild(video);
  }
});


  checkAuth();