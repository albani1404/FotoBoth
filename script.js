// ===== DOM ELEMENTS =====
const video = document.getElementById('video');
const countdownEl = document.getElementById('countdown');
const result = document.getElementById('result');
const flashOverlay = document.getElementById('flashOverlay');
const captureBtn = document.getElementById('captureBtn');
const downloadBtn = document.getElementById('downloadBtn');
const progressBar = document.getElementById('progressBar');
const progressWrap = document.getElementById('progressWrap');
const statusMsg = document.getElementById('statusMsg');
const dotsEl = document.getElementById('photoDots');

// ===== STATE =====
let timer = 3;
let photos = [];
let currentFilter = 'none';
let numShots = 4;

// ===== CAMERA (HD) =====
navigator.mediaDevices
  .getUserMedia({
    video: {
      width: { ideal: 1920, max: 3840 },
      height: { ideal: 1080, max: 2160 },
      facingMode: 'user',
      frameRate: { ideal: 60, max: 60 },
    },
  })
  .then((stream) => {
    video.srcObject = stream;
    const track = stream.getVideoTracks()[0];
    const settings = track.getSettings();
    statusMsg.textContent = `📡 Kamera aktif: ${settings.width}×${settings.height}`;
    setTimeout(() => {
      if (!statusMsg.textContent.includes('foto')) statusMsg.textContent = '';
    }, 3000);
  })
  .catch(() => {
    // Fallback ke resolusi default
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => (video.srcObject = stream))
      .catch(() => alert('Kamera tidak diizinkan!'));
  });

// ===== ACTIVE BUTTON HELPER =====
function setActive(groupId, clickedBtn) {
  document.querySelectorAll(`#${groupId} button`).forEach((b) => b.classList.remove('active'));
  clickedBtn.classList.add('active');
}

// ===== TIMER =====
function setTimer(t, btn) {
  timer = t;
  setActive('timerBtns', btn);
}

// ===== FILTER =====
function setFilter(f, btn) {
  currentFilter = f;
  video.style.filter = f;
  setActive('filterBtns', btn);
}

// ===== SHOTS =====
function setShots(n, btn) {
  numShots = n;
  setActive('shotBtns', btn);
  renderDots();
}

// ===== DOTS =====
function renderDots(taken = 0) {
  dotsEl.innerHTML = '';
  for (let i = 0; i < numShots; i++) {
    const d = document.createElement('div');
    d.className = 'dot' + (i < taken ? ' taken' : '');
    dotsEl.appendChild(d);
  }
}
renderDots();

// ===== FLASH EFFECT =====
function flash() {
  flashOverlay.classList.add('flash');
  setTimeout(() => flashOverlay.classList.remove('flash'), 120);
}

// ===== COUNTDOWN =====
function showCountdown(seconds) {
  return new Promise((resolve) => {
    let count = seconds;
    countdownEl.innerText = count;

    const interval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(interval);
        countdownEl.innerText = '';
        resolve();
      } else {
        countdownEl.innerText = count;
      }
    }, 1000);
  });
}

// ===== CAPTURE FRAME =====
function captureFrame() {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  ctx.filter = currentFilter;
  ctx.drawImage(video, 0, 0);

  return canvas.toDataURL('image/jpeg', 0.95);
}

// ===== START CAPTURE =====
async function startCapture() {
  photos = [];
  result.innerHTML = '';
  downloadBtn.style.display = 'none';
  captureBtn.disabled = true;
  progressWrap.style.display = 'block';
  progressBar.style.width = '0%';
  renderDots(0);

  for (let i = 0; i < numShots; i++) {
    statusMsg.textContent = `Foto ${i + 1} dari ${numShots}...`;
    await showCountdown(timer);
    flash();
    photos.push(captureFrame());
    renderDots(i + 1);
    progressBar.style.width = `${((i + 1) / numShots) * 100}%`;
    await new Promise((r) => setTimeout(r, 300));
  }

  statusMsg.textContent = '✅ Selesai! Strip siap.';
  captureBtn.disabled = false;
  renderStrip();
  downloadBtn.style.display = 'block';
}

// ===== RENDER FILM STRIP (preview) =====
function renderStrip() {
  result.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'film-strip-wrap';

  const outer = document.createElement('div');
  outer.className = 'film-strip-outer';

  const holeCount = numShots * 3 + 2;
  const leftSprocket = makeSprocket(holeCount);

  const body = document.createElement('div');
  body.className = 'film-body';

  photos.forEach((p) => {
    const img = document.createElement('img');
    img.src = p;
    img.className = 'film-photo';
    body.appendChild(img);
  });

  const brand = document.createElement('div');
  brand.className = 'strip-brand';
  brand.textContent = '✦ ELEVATOR PHOTO BOOTH ✦';
  body.appendChild(brand);

  const rightSprocket = makeSprocket(holeCount);

  outer.appendChild(leftSprocket);
  outer.appendChild(body);
  outer.appendChild(rightSprocket);
  wrap.appendChild(outer);
  result.appendChild(wrap);
}

// ===== MAKE SPROCKET =====
function makeSprocket(count) {
  const s = document.createElement('div');
  s.className = 'sprocket';
  for (let i = 0; i < count; i++) {
    const h = document.createElement('div');
    h.className = 'sprocket-hole';
    s.appendChild(h);
  }
  return s;
}

// ===== DOWNLOAD =====
function downloadStrip() {
  const SCALE = 3; // 🔥 kunci utama biar tajam (2-4 rekomendasi)

  const STRIP_W = 280 * SCALE;
  const PHOTO_W = 220 * SCALE;
  const PHOTO_H = 160 * SCALE;
  const GAP = 10 * SCALE;
  const SIDE = 30 * SCALE;
  const HEADER = 50 * SCALE;
  const FOOTER = 36 * SCALE;
  const TOTAL_H = HEADER + (PHOTO_H + GAP) * photos.length + GAP + FOOTER;

  const canvas = document.createElement('canvas');
  canvas.width = STRIP_W;
  canvas.height = TOTAL_H;

  const ctx = canvas.getContext('2d');

  // 🔥 biar super halus
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // background
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, STRIP_W, TOTAL_H);

  // Background hitam
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, STRIP_W, TOTAL_H);

  // Sprocket holes kiri & kanan
  const holeW = 13;
  const holeH = 10;
  const holeR = 3;
  const numHoles = Math.floor(TOTAL_H / 22);
  ctx.fillStyle = '#f5f0e8';

  for (let i = 0; i < numHoles; i++) {
    const y = 12 + i * 22;
    roundRect(ctx, 6, y, holeW, holeH, holeR); // kiri
    roundRect(ctx, STRIP_W - 6 - holeW, y, holeW, holeH, holeR); // kanan
  }

  // Brand header
  ctx.fillStyle = '#ffb6c1';
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('ELEVATOR PHOTO BOOTH', STRIP_W / 2, 28);

  // Gambar foto
  const promises = photos.map(
    (p, i) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const y = HEADER + i * (PHOTO_H + GAP);
          ctx.drawImage(img, SIDE, y, PHOTO_W, PHOTO_H);
          resolve();
        };
        img.src = p;
      }),
  );

  Promise.all(promises).then(() => {
    // Footer
    ctx.fillStyle = '#ffb6c1';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('✦ photobooth memories ✦', STRIP_W / 2, TOTAL_H - 12);

    const link = document.createElement('a');
    link.download = 'elevator-photobooth-strip.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
}

// ===== HELPER: ROUNDED RECT =====
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}
