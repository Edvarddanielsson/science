import type {CSSProperties} from 'react';
import {Easing, interpolate, spring} from 'remotion';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** 0 → 1 over `dur` seconds starting at `at` seconds (scene-relative). */
export const progress = (frame: number, fps: number, at: number, dur = 0.6): number =>
  interpolate(frame, [at * fps, (at + dur) * fps], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});

/** Fade in while rising a little. */
export const fadeUp = (frame: number, fps: number, at: number, dur = 0.6, dist = 26): CSSProperties => {
  const p = progress(frame, fps, at, dur);
  return {opacity: p, transform: `translateY(${(1 - p) * dist}px)`};
};

/** Springy scale-in. */
export const popIn = (frame: number, fps: number, at: number): CSSProperties => {
  const s = spring({frame: frame - at * fps, fps, config: {damping: 14, stiffness: 140, mass: 0.7}});
  return {opacity: Math.min(1, s * 1.4), transform: `scale(${0.85 + 0.15 * s})`};
};

/** Characters of `text` revealed by a typewriter that starts at `at` and types `cps` chars per second. */
export const typed = (text: string, frame: number, fps: number, at: number, cps = 32): string => {
  const n = Math.max(0, Math.floor(((frame - at * fps) / fps) * cps));
  return text.slice(0, n);
};
