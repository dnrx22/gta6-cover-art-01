// Canvas export: draws the poster at full export size and returns a PNG blob.
// Everything is drawn locally; no fonts, images or code are fetched remotely.

import { GRADES, panelRects } from './poster.js';

const FALLBACK_HUES = [348, 24, 190];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load image: ${src}`));
    img.src = src;
  });
}

/** Draw one photo into a panel rect, cover-fit, with zoom and pan. */
function drawPanel(ctx, img, rect, slot, index) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();

  if (!img) {
    const hue = FALLBACK_HUES[index % FALLBACK_HUES.length];
    const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    grad.addColorStop(0, `hsl(${hue}, 70%, 42%)`);
    grad.addColorStop(1, `hsl(${(hue + 40) % 360}, 75%, 18%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = `700 ${Math.max(18, Math.round(rect.h * 0.06))}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`PANEL ${index + 1}`, rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.restore();
    return;
  }

  const zoom = slot.zoom / 100;
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const drawW = img.naturalWidth * scale;
  const drawH = img.naturalHeight * scale;
  const dx = rect.x + (rect.w - drawW) / 2 + (slot.panX / 100) * rect.w;
  const dy = rect.y + (rect.h - drawH) / 2 + (slot.panY / 100) * rect.h;
  ctx.drawImage(img, dx, dy, drawW, drawH);
  ctx.restore();
}

function drawCaption(ctx, state, width, height, grade) {
  const padX = Math.round(width * 0.035);
  const baseY = height - Math.round(height * 0.035);

  // Kicker line, small and letterspaced by hand.
  const kickerSize = Math.max(14, Math.round(height * 0.016));
  ctx.font = `700 ${kickerSize}px Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#19e3ff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 6;
  ctx.fillText('N E O N   V I C E  ·  C O V E R   S T U D I O', padX, baseY - Math.round(height * 0.115));

  // Title: heavy system type with a dark edge and a coloured glow.
  // Shrink the font until the longest title fits the canvas width.
  const titleText = state.title || 'VICE CITY';
  const maxTitleWidth = width - padX * 2;
  let titleSize = Math.max(40, Math.round(height * 0.075));
  const titleFont = (size) => `900 ${size}px "Arial Black", Impact, Arial, sans-serif`;
  ctx.font = titleFont(titleSize);
  while (titleSize > 24 && ctx.measureText(titleText).width > maxTitleWidth) {
    titleSize -= 2;
    ctx.font = titleFont(titleSize);
  }
  ctx.shadowColor = grade.glow;
  ctx.shadowBlur = Math.round(titleSize * 0.35);
  ctx.lineWidth = Math.max(2, Math.round(titleSize * 0.06));
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
  const titleY = baseY - Math.round(height * 0.045);
  ctx.strokeText(titleText, padX, titleY);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(titleText, padX, titleY);

  // Tagline under the title.
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 6;
  const tagSize = Math.max(15, Math.round(height * 0.02));
  ctx.font = `400 ${tagSize}px Arial, sans-serif`;
  ctx.fillStyle = '#ffe9f2';
  if (state.tag) ctx.fillText(state.tag, padX, baseY);
  ctx.shadowBlur = 0;
}

/**
 * Render the cover at `width` x `height` and resolve with a PNG blob.
 * Throws if a photo fails to load, so the caller can report it.
 */
export async function renderCover(state, width, height) {
  const images = [];
  for (const slot of state.slots) {
    images.push(slot.src ? await loadImage(slot.src) : null);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');

  ctx.fillStyle = '#241428';
  ctx.fillRect(0, 0, width, height);

  const rects = panelRects(state.layout, width, height);
  rects.forEach((rect, i) => drawPanel(ctx, images[i], rect, state.slots[i], i));

  const grade = GRADES[state.grade] || GRADES.sunset;
  const overlay = ctx.createLinearGradient(0, 0, 0, height);
  for (const [stop, colour] of grade.overlay) overlay.addColorStop(stop, colour);
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, width, height);

  drawCaption(ctx, state, width, height, grade);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('PNG export failed'));
    }, 'image/png');
  });
}

export function parseSize(value) {
  const [w, h] = value.split('x').map((n) => parseInt(n, 10));
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    return { width: 1080, height: 1080 };
  }
  return { width: w, height: h };
}
