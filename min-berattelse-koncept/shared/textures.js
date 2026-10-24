// Procedural, seeded surface textures (linen, paper, grain) drawn on canvas.
// Used as CSS backgrounds in the flat concepts and as maps in the 3D ones.

export function rng(seed = 1) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

export function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Woven cloth: alternating warp/weft threads with slubs (thick irregular yarn).
export function linen({ size = 512, base = '#d4a5a0', seed = 7, contrast = 1, pitch = 3 } = {}) {
  const c = canvas(size, size), g = c.getContext('2d');
  const r = rng(seed);
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  const tone = (v, a) => (v > 0.5 ? `rgba(255,250,240,${(v - 0.5) * a})` : `rgba(55,30,20,${(0.5 - v) * a})`);
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < size; i += pitch) {
      // each thread drifts in tone along its length instead of being one flat stripe
      const v0 = r();
      for (let p = 0; p < size;) {
        const seg = 12 + r() * 70;
        const v = Math.min(1, Math.max(0, v0 * 0.45 + r() * 0.55));
        g.fillStyle = tone(v, 0.26 * contrast);
        if (pass === 0) g.fillRect(p, i, seg, pitch - 1); else g.fillRect(i, p, pitch - 1, seg);
        p += seg;
      }
      // slubs
      const n = Math.floor(r() * 3);
      for (let k = 0; k < n; k++) {
        const start = r() * size, len = 8 + r() * 46, light = r() > 0.45;
        g.fillStyle = light ? `rgba(255,250,240,${0.07 * contrast + r() * 0.09 * contrast})` : `rgba(60,30,20,${0.05 * contrast + r() * 0.07 * contrast})`;
        for (const off of [0, -size]) {
          if (pass === 0) g.fillRect(start + off, i - 0.5, len, pitch); else g.fillRect(i - 0.5, start + off, pitch, len);
        }
      }
    }
  }
  // crossings: darken the interlace points slightly for a woven look
  g.fillStyle = `rgba(40,20,10,${0.06 * contrast})`;
  for (let y = 0; y < size; y += pitch) for (let x = (y / pitch) % 2 ? 0 : pitch; x < size; x += pitch * 2) g.fillRect(x + pitch - 1, y + pitch - 1, 1, 1);
  addNoise(g, size, size, 10 * contrast, r);
  return c;
}

// Paper: low-frequency mottling, fibres and fine tooth.
export function paper({ w = 1024, h = 1024, base = '#f4ead8', seed = 3, mottle = 0.05, fibers = 260, fiber = '120,90,60', fiberAlpha = 0.07, tooth = 9 } = {}) {
  const c = canvas(w, h), g = c.getContext('2d');
  const r = rng(seed);
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) {
    const x = r() * w, y = r() * h, rad = (0.08 + r() * 0.3) * Math.max(w, h);
    const light = r() > 0.5;
    const grd = g.createRadialGradient(x, y, 0, x, y, rad);
    grd.addColorStop(0, light ? `rgba(255,252,245,${mottle * r()})` : `rgba(120,85,50,${mottle * r() * 0.8})`);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
  }
  g.lineCap = 'round';
  for (let i = 0; i < fibers; i++) {
    const x = r() * w, y = r() * h, len = 6 + r() * 26, a = r() * Math.PI * 2;
    g.strokeStyle = `rgba(${fiber},${fiberAlpha * (0.3 + r())})`;
    g.lineWidth = 0.5 + r() * 0.8;
    g.beginPath(); g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a + 0.6) * len * 0.5, y + Math.sin(a + 0.6) * len * 0.5, x + Math.cos(a) * len, y + Math.sin(a) * len);
    g.stroke();
  }
  addNoise(g, w, h, tooth, r);
  return c;
}

// Transparent monochrome grain tile for overlays.
export function grain({ size = 512, alpha = 0.09, seed = 11 } = {}) {
  const c = canvas(size, size), g = c.getContext('2d');
  const r = rng(seed);
  const img = g.createImageData(size, size), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = r();
    const light = v > 0.5;
    d[i] = d[i + 1] = d[i + 2] = light ? 255 : 30;
    d[i + 3] = Math.abs(v - 0.5) * 2 * alpha * 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

export function addNoise(g, w, h, amount, r = Math.random) {
  const img = g.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * amount;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
}

export function url(c) { return `url(${c.toDataURL('image/png')})`; }

export { hexToRgb };
