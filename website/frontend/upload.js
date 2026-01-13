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

  checkAuth();