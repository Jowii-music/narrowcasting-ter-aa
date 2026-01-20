const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');


// Inputs
const textInput = document.getElementById('textInput');
const fontSizeInput = document.getElementById('fontSize');
const textColorInput = document.getElementById('textColor');
const bgColorInput = document.getElementById('bgColor');
const bgImageInput = document.getElementById('bgImage');

// Buttons
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');

// State
let text = '';
let fontSize = 48;
let textColor = '#000000';
let bgColor = '#ffffff';
let bgImage = null;

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const words = text.split(' ');
  const lines = [];
  let line = '';

  for (let n = 0; n < words.length; n++) {
    let testLine = line + (line ? ' ' : '') + words[n];
    let metrics = ctx.measureText(testLine);

    // If the word itself is longer than maxWidth, break it manually
    if (metrics.width > maxWidth) {
      if (line) lines.push(line);
      // Split the long word into chunks
      let word = words[n];
      let subLine = '';
      for (let i = 0; i < word.length; i++) {
        let testSub = subLine + word[i];
        if (ctx.measureText(testSub).width > maxWidth) {
          lines.push(subLine);
          subLine = word[i];
        } else {
          subLine = testSub;
        }
      }
      if (subLine) line = subLine;
      else line = '';
    } else {
      line = testLine;
    }

    // If next word would overflow, push current line
    if (n === words.length - 1 && line) {
      lines.push(line);
    }
  }

  // Vertical centering
  const totalHeight = lines.length * lineHeight;
  let startY = y - totalHeight / 2 + lineHeight / 2;

  lines.forEach((l, i) => {
    ctx.fillText(l, x, startY + i * lineHeight);
  });
}





function draw() {
  // Clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (bgImage) {
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
  }

  // Text
  ctx.fillStyle = textColor;
  ctx.font = `${fontSize}px Arial`;

  const maxTextWidth = canvas.width * 0.8; // 80% of canvas width
  const lineHeight = fontSize * 1.2;

  drawWrappedText(ctx, text, canvas.width / 2, canvas.height / 2, maxTextWidth, lineHeight);
}


textInput.addEventListener('input', e => {
  text = e.target.value;
  draw();
});

fontSizeInput.addEventListener('input', e => {
  fontSize = Number(e.target.value);
  draw();
});

textColorInput.addEventListener('input', e => {
  textColor = e.target.value;
  draw();
});

bgColorInput.addEventListener('input', e => {
  bgColor = e.target.value;
  draw();
});

bgImageInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    bgImage = img;
    draw();
  };
  img.src = URL.createObjectURL(file);
});

downloadBtn.addEventListener('click', () => {
    const uuid = crypto.randomUUID()
    const link = document.createElement('a');
    link.download = `${uuid}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
});

resetBtn.addEventListener('click', () => {
  text = '';
  fontSize = 48;
  textColor = '#000000';
  bgColor = '#ffffff';
  bgImage = null;

  textInput.value = '';
  fontSizeInput.value = 48;
  textColorInput.value = '#000000';
  bgColorInput.value = '#ffffff';
  bgImageInput.value = '';

  draw();
});

draw();