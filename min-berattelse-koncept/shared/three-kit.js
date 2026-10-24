// Small helpers shared by the two 3D concepts.
// The phone screen is real HTML placed in the scene with CSS3DRenderer, so an
// implementation can keep the working recording simulation instead of a picture.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

export const PHONE = { w: 0.72, h: 0.72 * 2.06, d: 0.072, cssWidth: 351 };

export function createStage({ width = 1920, height = 1080, fov = 24, alpha = true, exposure = 1, toneMapping = THREE.NeutralToneMapping, envIntensity = 0.6 } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha, preserveDrawingBuffer: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(width, height);
  renderer.toneMapping = toneMapping;
  renderer.toneMappingExposure = exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.domElement.className = 'gl';

  const css = new CSS3DRenderer();
  css.setSize(width, height);
  css.domElement.className = 'css3d';

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = envIntensity;

  const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 100);
  const render = () => { renderer.render(scene, camera); css.render(scene, camera); };
  return { renderer, css, scene, camera, render };
}

export function canvasTexture(canvas, { repeat = [1, 1], srgb = true, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = aniso;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

// Phone body + black glass; `dom` is the .phone element whose .screen is the live app.
export function buildPhone({ frame, dom }) {
  const g = new THREE.Group();
  const { w, h, d } = PHONE;
  const bevel = 0.014;
  const bodyGeo = new THREE.ExtrudeGeometry(roundedRect(w - bevel * 2, h - bevel * 2, w * 0.165 - bevel), {
    depth: d - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 6, curveSegments: 24,
  });
  bodyGeo.translate(0, 0, -(d - bevel * 2) / 2);
  const body = new THREE.Mesh(bodyGeo, frame);
  body.castShadow = true; body.receiveShadow = true;
  g.add(body);

  const glass = new THREE.Mesh(
    new THREE.ShapeGeometry(roundedRect(w - w * 0.024, h - w * 0.024, w * 0.155), 24),
    new THREE.MeshPhysicalMaterial({ color: 0x0c0a09, roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08 }));
  glass.position.z = d / 2 + 0.0008;
  g.add(glass);

  if (dom) {
    const obj = new CSS3DObject(dom);
    obj.scale.setScalar(w / PHONE.cssWidth);
    obj.position.z = d / 2 + 0.0016;
    g.add(obj);
  }
  return g;
}

// A cloth-bound book standing upright, spine facing +z.
export function buildStandingBook({ T, H, D, cloth, pages, foil }) {
  const g = new THREE.Group();
  const board = 0.018;
  for (const s of [-1, 1]) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(board, H, D - T * 0.16), cloth);
    c.position.set(s * (T / 2 - board / 2), H / 2, -T * 0.08);
    c.castShadow = c.receiveShadow = true;
    g.add(c);
  }
  // rounded spine: a flattened half cylinder
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(T / 2, T / 2, H, 32, 1, false, -Math.PI / 2, Math.PI), cloth);
  spine.scale.z = 0.42;
  spine.position.set(0, H / 2, D / 2 - T * 0.16 - 0.002);
  spine.castShadow = spine.receiveShadow = true;
  g.add(spine);
  const block = new THREE.Mesh(new THREE.BoxGeometry(T - board * 2 - 0.004, H - 0.03, D - T * 0.16 - 0.03), pages);
  block.position.set(0, H / 2 - 0.006, -T * 0.08 - 0.012);
  block.castShadow = block.receiveShadow = true;
  g.add(block);
  if (foil) {
    for (const y of [H - 0.11, H - 0.145, 0.12]) {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(T / 2 + 0.002, T / 2 + 0.002, 0.012, 32, 1, true, -Math.PI / 2, Math.PI), foil);
      band.scale.z = 0.42;
      band.position.set(0, y, D / 2 - T * 0.16 - 0.002);
      g.add(band);
    }
  }
  return g;
}

// A cloth-bound book lying flat, spine on the left (-x), fore-edge facing +x.
export function buildLyingBook({ W, T, D, cloth, pages }) {
  const g = new THREE.Group();
  const board = 0.016, over = 0.022;
  for (const s of [-1, 1]) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(W - T * 0.2, board, D), cloth);
    c.position.set(T * 0.1, T / 2 + s * (T / 2 - board / 2), 0);
    c.castShadow = c.receiveShadow = true;
    g.add(c);
  }
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(T / 2, T / 2, D, 32, 1, false, Math.PI, Math.PI), cloth);
  spine.rotation.x = Math.PI / 2;
  spine.scale.x = 0.62;
  spine.position.set(-W / 2 + T * 0.2 + 0.001, T / 2, 0);
  spine.castShadow = spine.receiveShadow = true;
  g.add(spine);
  const block = new THREE.Mesh(new THREE.BoxGeometry(W - T * 0.2 - over, T - board * 2 - 0.002, D - over * 2), pages);
  block.position.set(T * 0.1 - over / 2, T / 2, 0);
  block.castShadow = block.receiveShadow = true;
  g.add(block);
  return g;
}

// Page-edge texture: fine lines with slight tone drift.
export function pageEdges({ size = 256, base = '#f3ead8', seed = 2, horizontal = false } = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let x = 0; x < size; x += 1) {
    g.fillStyle = `rgba(120,95,60,${0.03 + r() * 0.09})`;
    if (r() > 0.45) { if (horizontal) g.fillRect(0, x, size, 1); else g.fillRect(x, 0, 1, size); }
  }
  return c;
}

export { THREE, CSS3DObject };
