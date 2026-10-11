import raw from './timeline.json';

export type Sentence = {start: number; end: number; text: string};
export type Scene = {id: string; start: number; end: number; sentences: Sentence[]};
export type Caption = {start: number; end: number; text: string};

export const timeline = raw as {
  fps: number;
  durationInFrames: number;
  seconds: number;
  scenes: Scene[];
  captions: Caption[];
};

/** Start of sentence i, in seconds relative to the scene start. */
export const sentenceAt = (scene: Scene, i: number): number => scene.sentences[i].start - scene.start;

/**
 * Estimated moment a word is spoken, in seconds relative to the scene start.
 * Looks inside the caption chunks of this scene and interpolates by character position.
 */
export const wordAt = (scene: Scene, word: string, after = 0): number => {
  const needle = word.toLowerCase();
  for (const c of timeline.captions) {
    if (c.start < scene.start + after - 0.001 || c.start >= scene.end) continue;
    const idx = c.text.toLowerCase().indexOf(needle);
    if (idx >= 0) {
      const frac = idx / Math.max(1, c.text.length);
      return c.start + frac * (c.end - c.start) - scene.start;
    }
  }
  throw new Error(`"${word}" not found in captions of scene ${scene.id}`);
};
