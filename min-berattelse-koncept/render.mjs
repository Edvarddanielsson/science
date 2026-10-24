// Renders each concept page to a 16:9 mockup (3840×2160 JPEG) with headless Chromium.
// Usage: node render.mjs [concept-id ...]   (default: all)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('/opt/node-tools/node_modules/playwright'); }

const root = path.dirname(fileURLToPath(import.meta.url));
const WIDTH = 1920, HEIGHT = 1080, SCALE = 2;
const CONCEPTS = ['01-hyllan', '02-eftermiddag', '03-omslaget', '04-albumet', '05-handstilen'];

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };

const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const wanted = process.argv.slice(2);
const list = wanted.length ? CONCEPTS.filter(c => wanted.some(w => c.startsWith(w))) : CONCEPTS;
const browser = await playwright.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
fs.mkdirSync(path.join(root, 'mockups'), { recursive: true });
for (const id of list) {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: SCALE });
  page.on('console', m => console.log(`[${id}] ${m.text()}`));
  page.on('pageerror', e => console.log(`[${id}] ERROR ${e.message}`));
  await page.goto(`${base}/concepts/${id}/index.html?render=1`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => window.__ready !== false, null, { timeout: 180000 });
  await page.waitForTimeout(300);
  const out = path.join(root, 'mockups', `${id}.jpg`);
  await page.screenshot({ path: out, type: 'jpeg', quality: 93 });
  console.log('wrote', path.relative(root, out));
  await page.close();
}
await browser.close();
server.close();
