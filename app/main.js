// Neon Vice Cover Studio — wiring: state, controls, export button.
// Runs entirely in the browser; no network calls, no uploads.

import { renderPoster } from './poster.js';
import { parseSize, renderCover } from './exporter.js';

const state = {
  slots: [
    { src: 'samples/boulevard.jpg', zoom: 100, panX: 0, panY: 0 },
    { src: 'samples/pier.jpg', zoom: 100, panX: 0, panY: 0 },
    { src: 'samples/boulevard.jpg', zoom: 110, panX: 0, panY: 0 },
  ],
  title: 'VICE CITY',
  tag: 'Two stories. One sunset.',
  grade: 'sunset',
  layout: 'hero-left',
  size: '1080x1080',
};

const els = {
  poster: document.getElementById('poster'),
  images: [0, 1, 2].map((i) => document.getElementById(`panelImg${i}`)),
  title: document.getElementById('captionTitle'),
  tag: document.getElementById('captionTag'),
};

function refresh() {
  renderPoster(state, els);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('could not read that file'));
    reader.readAsDataURL(file);
  });
}

function wirePhotos() {
  document.querySelectorAll('input[data-photo]').forEach((input) => {
    input.addEventListener('change', async () => {
      const slot = Number(input.dataset.photo);
      const file = input.files && input.files[0];
      if (!file) return;
      try {
        state.slots[slot].src = await readFileAsDataUrl(file);
        refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'could not read that file');
      }
      input.value = '';
    });
  });

  document.querySelectorAll('button[data-sample]').forEach((button) => {
    button.addEventListener('click', () => {
      const slot = Number(button.dataset.sample);
      state.slots[slot].src = button.dataset.file || '';
      refresh();
    });
  });
}

function wireSliders() {
  document.querySelectorAll('input[data-zoom]').forEach((input) => {
    input.addEventListener('input', () => {
      state.slots[Number(input.dataset.zoom)].zoom = Number(input.value);
      refresh();
    });
  });
  document.querySelectorAll('input[data-panx]').forEach((input) => {
    input.addEventListener('input', () => {
      state.slots[Number(input.dataset.panx)].panX = Number(input.value);
      refresh();
    });
  });
  document.querySelectorAll('input[data-pany]').forEach((input) => {
    input.addEventListener('input', () => {
      state.slots[Number(input.dataset.pany)].panY = Number(input.value);
      refresh();
    });
  });
}

function wireText() {
  document.getElementById('titleInput').addEventListener('input', (event) => {
    state.title = event.target.value.toUpperCase();
    refresh();
  });
  document.getElementById('tagInput').addEventListener('input', (event) => {
    state.tag = event.target.value;
    refresh();
  });
}

function wireChoices() {
  document.getElementById('gradeRow').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-grade]');
    if (!button) return;
    state.grade = button.dataset.grade;
    document.querySelectorAll('#gradeRow button').forEach((b) =>
      b.classList.toggle('active', b === button),
    );
    refresh();
  });

  document.getElementById('layoutRow').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-layout]');
    if (!button) return;
    state.layout = button.dataset.layout;
    document.querySelectorAll('#layoutRow button').forEach((b) =>
      b.classList.toggle('active', b === button),
    );
    refresh();
  });

  document.getElementById('sizeSelect').addEventListener('change', (event) => {
    state.size = event.target.value;
  });
}

function wireExport() {
  const button = document.getElementById('exportBtn');
  let lastUrl = '';
  button.addEventListener('click', async () => {
    button.disabled = true;
    button.textContent = 'Rendering…';
    try {
      const { width, height } = parseSize(state.size);
      const blob = await renderCover(state, width, height);
      if (lastUrl) URL.revokeObjectURL(lastUrl);
      const url = URL.createObjectURL(blob);
      lastUrl = url;
      const result = document.getElementById('result');
      const img = document.getElementById('resultImg');
      const link = document.getElementById('downloadLink');
      img.src = url;
      link.href = url;
      link.download = `neon-vice-cover-${width}x${height}.png`;
      result.hidden = false;
      result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'export failed');
    } finally {
      button.disabled = false;
      button.textContent = 'Export PNG';
    }
  });
}

wirePhotos();
wireSliders();
wireText();
wireChoices();
wireExport();
refresh();
