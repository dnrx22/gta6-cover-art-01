// Poster model: colour grades, panel geometry and the live DOM preview.
// No network use anywhere; every value here is plain data.

export const GRADES = {
  sunset: {
    label: 'Sunset',
    filter: 'saturate(1.25) contrast(1.06) sepia(0.22)',
    overlay: [
      [0, 'rgba(255, 122, 26, 0.10)'],
      [0.55, 'rgba(255, 46, 136, 0.10)'],
      [0.82, 'rgba(18, 8, 20, 0.55)'],
      [1, 'rgba(18, 8, 20, 0.88)'],
    ],
    glow: 'rgba(255, 46, 136, 0.45)',
  },
  neon: {
    label: 'Neon',
    filter: 'saturate(1.6) contrast(1.12) hue-rotate(-12deg)',
    overlay: [
      [0, 'rgba(25, 227, 255, 0.14)'],
      [0.55, 'rgba(255, 46, 136, 0.16)'],
      [0.82, 'rgba(10, 4, 26, 0.55)'],
      [1, 'rgba(10, 4, 26, 0.90)'],
    ],
    glow: 'rgba(25, 227, 255, 0.60)',
  },
  noir: {
    label: 'Noir',
    filter: 'grayscale(0.9) contrast(1.18) brightness(0.92)',
    overlay: [
      [0, 'rgba(0, 0, 0, 0.05)'],
      [0.55, 'rgba(0, 0, 0, 0.28)'],
      [0.82, 'rgba(0, 0, 0, 0.60)'],
      [1, 'rgba(0, 0, 0, 0.92)'],
    ],
    glow: 'rgba(255, 255, 255, 0.25)',
  },
};

export const LAYOUTS = ['hero-left', 'hero-top', 'triptych'];

/**
 * Panel rectangles for an export canvas of `width` x `height`, in pixels.
 * The fractions mirror the CSS grid in styles.css: a small outer padding,
 * a small gap between panels, and the hero panel taking the larger share.
 */
export function panelRects(layout, width, height) {
  const safeLayout = LAYOUTS.includes(layout) ? layout : 'hero-left';
  const pad = 0.012;
  const gap = 0.012;
  const innerW = 1 - pad * 2;
  const innerH = 1 - pad * 2;
  const rect = (fx, fy, fw, fh) => ({
    x: Math.round(fx * width),
    y: Math.round(fy * height),
    w: Math.round(fw * width),
    h: Math.round(fh * height),
  });

  if (safeLayout === 'hero-top') {
    const heroH = (innerH - gap) * (1.9 / 2.9);
    const rowH = (innerH - gap) * (1 / 2.9);
    const colW = (innerW - gap) / 2;
    return [
      rect(pad, pad, innerW, heroH),
      rect(pad, pad + heroH + gap, colW, rowH),
      rect(pad + colW + gap, pad + heroH + gap, colW, rowH),
    ];
  }

  if (safeLayout === 'triptych') {
    const colW = (innerW - gap * 2) / 3;
    return [
      rect(pad, pad, colW, innerH),
      rect(pad + colW + gap, pad, colW, innerH),
      rect(pad + (colW + gap) * 2, pad, colW, innerH),
    ];
  }

  // hero-left (default)
  const heroW = (innerW - gap) * (1.9 / 2.9);
  const colW = (innerW - gap) * (1 / 2.9);
  const rowH = (innerH - gap) / 2;
  return [
    rect(pad, pad, heroW, innerH),
    rect(pad + heroW + gap, pad, colW, rowH),
    rect(pad + heroW + gap, pad + rowH + gap, colW, rowH),
  ];
}

/** Apply the current state to the live poster preview in the page. */
export function renderPoster(state, els) {
  const poster = els.poster;
  poster.classList.remove('grade-sunset', 'grade-neon', 'grade-noir');
  poster.classList.add(`grade-${state.grade}`);
  poster.classList.remove('layout-hero-left', 'layout-hero-top', 'layout-triptych');
  poster.classList.add(`layout-${state.layout}`);

  state.slots.forEach((slot, i) => {
    const img = els.images[i];
    if (slot.src) {
      img.src = slot.src;
      img.style.display = '';
    } else {
      img.removeAttribute('src');
      img.style.display = 'none';
    }
    const zoom = slot.zoom / 100;
    img.style.transform =
      `translate(${slot.panX}%, ${slot.panY}%) scale(${zoom})`;
  });

  els.title.textContent = state.title || 'VICE CITY';
  els.tag.textContent = state.tag || '';
}
