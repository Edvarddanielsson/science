import {continueRender, delayRender} from 'remotion';
import '@fontsource/bricolage-grotesque/latin-600.css';
import '@fontsource/bricolage-grotesque/latin-700.css';
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-400-italic.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-sans/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';

// Same palette as the HTML brief (its dark theme): fjord-dark ground, saffron accent, signal blue.
export const C = {
  bg: '#0e151c',
  panel: '#151f29',
  panel2: '#1b2733',
  line: '#283643',
  ink: '#e6ecf2',
  ink2: '#b3c0cc',
  muted: '#8c9bab',
  accent: '#f0b429',
  blue: '#3987e5',
  removed: '#e8795a',
  cloudBg: '#1d2b3b',
  cloudInk: '#a9c8ec',
  localBg: '#17301f',
  localInk: '#9fd8b0',
  mixedBg: '#33290f',
  mixedInk: '#f0cf7d',
};

export const display = '"Bricolage Grotesque", "Avenir Next", sans-serif';
export const sans = '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif';
export const mono = '"IBM Plex Mono", "SF Mono", Menlo, monospace';

export const SAFE_X = 120;

// Bundled fonts (fontsource) load from the local bundle; hold the first frame until they are ready.
if (typeof document !== 'undefined') {
  const handle = delayRender('Loading fonts');
  const faces = [
    '600 40px "Bricolage Grotesque"',
    '700 40px "Bricolage Grotesque"',
    '400 40px "IBM Plex Sans"',
    'italic 400 40px "IBM Plex Sans"',
    '500 40px "IBM Plex Sans"',
    '600 40px "IBM Plex Sans"',
    '400 40px "IBM Plex Mono"',
    '500 40px "IBM Plex Mono"',
  ];
  Promise.all(faces.map((f) => document.fonts.load(f, 'Aa åäö ÅÄÖ 0123')))
    .then(() => continueRender(handle))
    .catch(() => continueRender(handle));
}
