import React from 'react';
import {AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import {C, SAFE_X, display, mono, sans} from './theme';
import {fadeUp} from './anim';
import {Scene, timeline} from './timeline';

export const NARRATION = staticFile('narration.wav');

const CHAPTERS: Record<string, string> = {
  intro: 'AI voice keyboards',
  how: 'How it works',
  acclaimed: 'Most acclaimed',
  interesting: 'Most interesting',
  leverage: 'Leverage',
  hooked: 'Why it sticks',
  local: 'On-device',
  swedish: 'Swedish',
  plan: 'The plan',
};

export const SceneTitle: React.FC<{scene: Scene; title: string; sub?: string}> = ({scene, title, sub}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{position: 'absolute', left: SAFE_X, top: 84, right: SAFE_X}}>
      <div
        style={{
          fontFamily: mono,
          fontSize: 22,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: C.accent,
          ...fadeUp(frame, fps, 0.15, 0.5, 10),
        }}
      >
        {CHAPTERS[scene.id]}
      </div>
      <div
        style={{
          fontFamily: display,
          fontWeight: 700,
          fontSize: 74,
          lineHeight: 1.05,
          letterSpacing: '-0.015em',
          marginTop: 10,
          ...fadeUp(frame, fps, 0.25, 0.6),
        }}
      >
        {title}
      </div>
      {sub ? (
        <div style={{fontSize: 28, color: C.muted, marginTop: 12, ...fadeUp(frame, fps, 0.45, 0.6)}}>{sub}</div>
      ) : null}
    </div>
  );
};

type ChipKind = 'cloud' | 'local' | 'mixed';
export const Chip: React.FC<{kind: ChipKind; children: React.ReactNode; style?: React.CSSProperties}> = ({
  kind,
  children,
  style,
}) => {
  const colors = {
    cloud: [C.cloudBg, C.cloudInk],
    local: [C.localBg, C.localInk],
    mixed: [C.mixedBg, C.mixedInk],
  }[kind];
  return (
    <span
      style={{
        fontFamily: mono,
        fontSize: 22,
        fontWeight: 500,
        padding: '4px 14px',
        borderRadius: 999,
        background: colors[0],
        color: colors[1],
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  );
};

export const Card: React.FC<{style?: React.CSSProperties; highlight?: boolean; children: React.ReactNode}> = ({
  style,
  highlight,
  children,
}) => (
  <div
    style={{
      background: C.panel,
      border: `2px solid ${highlight ? C.accent : C.line}`,
      borderRadius: 22,
      padding: '26px 30px',
      boxSizing: 'border-box',
      ...style,
    }}
  >
    {children}
  </div>
);

export const MicIcon: React.FC<{size?: number; color?: string; crossed?: boolean}> = ({
  size = 40,
  color = C.ink,
  crossed,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <path d="M12 18v3" />
    {crossed ? <path d="M3 3l18 18" stroke={C.removed} strokeWidth={2.4} /> : null}
  </svg>
);

export const Keycap: React.FC<{children: React.ReactNode; style?: React.CSSProperties; accent?: boolean}> = ({
  children,
  style,
  accent,
}) => (
  <div
    style={{
      width: 92,
      height: 100,
      borderRadius: 16,
      background: '#26323e',
      boxShadow: '0 5px 0 #0a1016',
      display: 'grid',
      placeItems: 'center',
      fontFamily: sans,
      fontWeight: 500,
      fontSize: 50,
      color: accent ? C.accent : C.ink,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Background: a quiet glow so the dark ground isn't flat. */
export const Backdrop: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(1200px 700px at 12% 8%, #172331 0%, ${C.bg} 60%), ${C.bg}`,
    }}
  />
);

/** Fades each scene in and out at its boundaries. */
export const SceneFrame: React.FC<{scene: Scene; children: React.ReactNode}> = ({scene, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const len = (scene.end - scene.start) * fps;
  const opacity = interpolate(frame, [0, 0.35 * fps, len - 0.3 * fps, len], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return <AbsoluteFill style={{opacity}}>{children}</AbsoluteFill>;
};

/** Thin chapter progress bar along the top edge. */
export const ChapterBar: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  return (
    <div style={{position: 'absolute', top: 36, left: SAFE_X, right: SAFE_X, display: 'flex', gap: 8}}>
      {timeline.scenes.map((s) => {
        const p = Math.max(0, Math.min(1, (t - s.start) / (s.end - s.start)));
        return (
          <div key={s.id} style={{flex: s.end - s.start, height: 5, borderRadius: 3, background: C.line, overflow: 'hidden'}}>
            <div style={{width: `${p * 100}%`, height: '100%', background: C.accent, opacity: 0.85}} />
          </div>
        );
      })}
    </div>
  );
};

/** Live waveform of the narration: a small "listening" pill in the corner, or a big one for title cards. */
export const VoiceBars: React.FC<{bars?: number; height?: number; barWidth?: number; gap?: number; color?: string}> = ({
  bars = 18,
  height = 34,
  barWidth = 5,
  gap = 4,
  color = C.accent,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const audioData = useAudioData(NARRATION);
  let values: number[] = new Array(bars).fill(0);
  if (audioData) {
    const spectrum = visualizeAudio({fps, frame, audioData, numberOfSamples: 64, smoothing: true});
    // speech energy sits in the low bins; mirror it so the shape is symmetric
    const half = Math.ceil(bars / 2);
    const low = spectrum.slice(1, 1 + half).map((v) => Math.min(1, Math.sqrt(v) * 2.2));
    values = [...low.slice().reverse(), ...low].slice(0, bars);
  }
  return (
    <div style={{display: 'flex', alignItems: 'center', gap, height}}>
      {values.map((v, i) => (
        <div
          key={i}
          style={{
            width: barWidth,
            height: Math.max(barWidth, v * height),
            borderRadius: barWidth,
            background: color,
            opacity: 0.35 + 0.65 * v,
          }}
        />
      ))}
    </div>
  );
};

export const MicPill: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      top: 70,
      right: SAFE_X,
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '10px 20px 10px 16px',
      borderRadius: 999,
      background: C.panel,
      border: `1px solid ${C.line}`,
    }}
  >
    <MicIcon size={30} color={C.accent} />
    <VoiceBars />
  </div>
);

/** Burned-in captions, timed to the narration. */
export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const cap = timeline.captions.find((c) => t >= c.start && t < c.end + 0.12);
  if (!cap) return null;
  const opacity = interpolate(t, [cap.start, cap.start + 0.1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 54, display: 'flex', justifyContent: 'center'}}>
      <div
        style={{
          maxWidth: 1480,
          padding: '14px 30px',
          borderRadius: 16,
          background: 'rgba(6, 10, 14, 0.86)',
          border: `1px solid ${C.line}`,
          fontFamily: sans,
          fontWeight: 500,
          fontSize: 44,
          lineHeight: 1.28,
          color: '#ffffff',
          textAlign: 'center',
          opacity,
        }}
      >
        {cap.text}
      </div>
    </div>
  );
};
