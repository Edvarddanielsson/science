import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {fadeUp, popIn, progress, typed} from './anim';
import {Card, Chip, Keycap, MicIcon, SceneTitle, VoiceBars} from './components';
import {C, SAFE_X, display, mono} from './theme';
import {Scene, sentenceAt, wordAt} from './timeline';

type SceneProps = {scene: Scene};

const useT = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return {frame, fps};
};

const Arrow: React.FC<{width?: number; color?: string; style?: React.CSSProperties}> = ({width = 70, color = C.ink2, style}) => (
  <svg width={width} height={28} viewBox={`0 0 ${width} 28`} style={style}>
    <path d={`M2 14 H${width - 12}`} stroke={color} strokeWidth={3} strokeLinecap="round" />
    <path d={`M${width - 20} 5 L${width - 6} 14 L${width - 20} 23`} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ------------------------------------------------------------------ intro */

const RAW: {text: string; drop: boolean}[] = [
  {text: 'um so', drop: true},
  {text: 'I was thinking we could,', drop: false},
  {text: 'uh,', drop: true},
  {text: 'meet tomorrow at', drop: false},
  {text: 'three, no wait,', drop: true},
  {text: 'four', drop: false},
];

export const IntroScene: React.FC<SceneProps> = ({scene}) => {
  const {frame, fps} = useT();
  const demo = sentenceAt(scene, 1);
  const rawText = RAW.map((r) => r.text).join(' ');
  const shown = typed(rawText, frame, fps, demo + 0.2, 26);
  const typingDone = demo + 0.2 + rawText.length / 26;
  const strike = progress(frame, fps, typingDone + 0.2, 0.5);
  const cleanAt = typingDone + 0.9;
  let cursor = 0;

  return (
    <>
      <div style={{position: 'absolute', left: SAFE_X, top: 150, width: 860}}>
        <div style={{fontFamily: mono, fontSize: 24, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.accent, ...fadeUp(frame, fps, 0.1)}}>
          Research brief · October 2026
        </div>
        <div
          style={{
            fontFamily: display,
            fontWeight: 700,
            fontSize: 150,
            lineHeight: 0.98,
            letterSpacing: '-0.025em',
            marginTop: 22,
            ...fadeUp(frame, fps, 0.3, 0.8, 40),
          }}
        >
          Talk,
          <br />
          don't type.
        </div>
        <div style={{fontSize: 40, lineHeight: 1.3, color: C.ink2, marginTop: 30, ...fadeUp(frame, fps, 0.9, 0.7)}}>
          AI voice keyboards on iPhone, and a Swedish on-device opportunity
        </div>
        <div style={{display: 'flex', gap: 18, marginTop: 46}}>
          {['å', 'ä', 'ö'].map((k, i) => (
            <Keycap key={k} style={popIn(frame, fps, 1.6 + i * 0.15)}>
              {k}
            </Keycap>
          ))}
          <Keycap accent style={{width: 120, ...popIn(frame, fps, 2.1)}}>
            <MicIcon size={46} color={C.accent} />
          </Keycap>
        </div>
      </div>

      {/* dictation demo: what you say vs what gets sent */}
      <Card style={{position: 'absolute', left: 1060, top: 190, width: 740, ...fadeUp(frame, fps, demo, 0.6)}}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <div style={{fontFamily: mono, fontSize: 22, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted}}>You say</div>
          <VoiceBars bars={14} height={30} />
        </div>
        <div style={{fontSize: 38, lineHeight: 1.4, marginTop: 16, minHeight: 160}}>
          {RAW.map((r, i) => {
            const start = cursor;
            cursor += r.text.length + 1;
            const visible = shown.slice(start, start + r.text.length);
            if (!visible) return null;
            const dropped = r.drop && strike > 0;
            return (
              <span
                key={i}
                style={{
                  color: dropped ? C.removed : C.ink,
                  textDecoration: dropped ? 'line-through' : 'none',
                  opacity: dropped ? 1 - 0.45 * strike : 1,
                }}
              >
                {visible}
                {i < RAW.length - 1 ? ' ' : ''}
              </span>
            );
          })}
        </div>
        <div style={{height: 2, background: C.line, margin: '22px 0'}} />
        <div style={{fontFamily: mono, fontSize: 22, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted}}>It sends</div>
        <div style={{fontSize: 44, fontWeight: 600, marginTop: 14, color: C.ink, ...fadeUp(frame, fps, cleanAt, 0.5)}}>
          Could we meet tomorrow at four?
        </div>
      </Card>

      <div style={{position: 'absolute', left: 1060, top: 760, display: 'flex', gap: 16}}>
        {[
          ['Who leads', 'leads'],
          ['Why it sticks', 'hooked'],
          ['Swedish, on-device', 'Swedish'],
        ].map(([label, cue]) => (
          <div
            key={label}
            style={{
              fontSize: 30,
              padding: '10px 22px',
              borderRadius: 999,
              border: `2px solid ${C.accent}`,
              color: C.ink,
              ...popIn(frame, fps, wordAt(scene, cue)),
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ how */

export const HowScene: React.FC<SceneProps> = ({scene}) => {
  const {frame, fps} = useT();
  const kb = 0.6;
  const twoParts = wordAt(scene, 'two parts');
  const mainApp = wordAt(scene, 'main app');
  const trip = wordAt(scene, 'trip');
  const swipe = wordAt(scene, 'swipe');
  const go = progress(frame, fps, trip, 1.1);
  const back = progress(frame, fps, swipe, 1.1);

  const box: React.CSSProperties = {position: 'absolute', top: 330, height: 360};
  const item: React.CSSProperties = {fontSize: 30, color: C.ink2, lineHeight: 1.45};
  const head: React.CSSProperties = {fontFamily: display, fontWeight: 600, fontSize: 40, marginBottom: 14};

  return (
    <>
      <SceneTitle scene={scene} title="How a voice keyboard works on iPhone" />

      <Card style={{...box, left: SAFE_X, width: 470, ...fadeUp(frame, fps, kb)}}>
        <div style={head}>Keyboard</div>
        <div style={item}>Mic button, styles</div>
        <div style={item}>Types into any app</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: 18, ...popIn(frame, fps, wordAt(scene, 'microphone'))}}>
          <MicIcon size={44} color={C.removed} crossed />
          <span style={{fontSize: 30, color: C.removed, fontWeight: 600}}>No microphone</span>
        </div>
        <div style={{fontFamily: mono, fontSize: 22, color: C.muted, marginTop: 22}}>Killed at ~48–77 MB</div>
      </Card>

      <div style={{position: 'absolute', left: 620, top: 470, ...fadeUp(frame, fps, twoParts)}}>
        <Arrow width={110} />
      </div>

      <Card style={{...box, left: 760, width: 400, ...fadeUp(frame, fps, twoParts + 0.2)}}>
        <div style={head}>App Group</div>
        <div style={item}>Start / stop</div>
        <div style={item}>Session status</div>
        <div style={item}>Finished text</div>
        <div style={{fontFamily: mono, fontSize: 22, color: C.muted, marginTop: 22}}>Needs Full Access</div>
      </Card>

      <div style={{position: 'absolute', left: 1190, top: 470, ...fadeUp(frame, fps, mainApp)}}>
        <Arrow width={110} />
      </div>

      <Card highlight style={{...box, left: 1330, width: 470, ...fadeUp(frame, fps, mainApp + 0.1)}}>
        <div style={head}>Main app</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <MicIcon size={40} color={C.localInk} />
          <span style={{fontSize: 30, color: C.localInk, fontWeight: 600}}>Holds the mic</span>
        </div>
        <div style={{...item, marginTop: 8}}>Speech recognition</div>
        <div style={item}>LLM cleanup</div>
        <div style={{fontFamily: mono, fontSize: 22, color: C.muted, marginTop: 22}}>Runs in the background</div>
      </Card>

      {/* the bounce: out to the app, then back by hand */}
      <div style={{position: 'absolute', left: SAFE_X, top: 730, width: 1680, height: 110}}>
        <div style={{position: 'absolute', left: 240, right: 240, top: 20, height: 4, background: C.line, borderRadius: 2, opacity: go > 0 ? 1 : 0}} />
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: `calc(${240 + (go - back) * 1200}px)`,
            width: 28,
            height: 28,
            borderRadius: 14,
            background: back > 0 ? C.accent : C.blue,
            boxShadow: `0 0 24px ${back > 0 ? C.accent : C.blue}`,
            opacity: go > 0 ? 1 : 0,
          }}
        />
        <div style={{position: 'absolute', left: 240, top: 50, fontSize: 28, color: C.ink2, ...fadeUp(frame, fps, trip, 0.5)}}>
          1. Opens the app to start recording
        </div>
        <div style={{position: 'absolute', right: 240, top: 50, fontSize: 28, color: C.accent, textAlign: 'right', ...fadeUp(frame, fps, swipe, 0.5)}}>
          2. Since iOS 26.4: swipe back by hand
        </div>
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ acclaimed */

type Row = {name: string; rating: string; count: string; kind: 'cloud' | 'mixed'; kindLabel: string; quote?: string; cue: string};
const ROWS: Row[] = [
  {name: 'Wispr Flow', rating: '4.8', count: '17K ratings', kind: 'cloud', kindLabel: 'Cloud', cue: 'Wispr'},
  {name: 'Aqua Voice', rating: '4.3', count: '62 ratings', kind: 'cloud', kindLabel: 'Cloud', quote: '“the best dictation app I’ve ever used” 9to5Mac', cue: 'Aqua'},
  {name: 'Willow', rating: '4.6', count: '1.1K ratings', kind: 'cloud', kindLabel: 'Cloud', quote: '“the most accurate dictation keyboard app I have used” Make Tech Easier', cue: 'Willow'},
  {name: 'Superwhisper', rating: '4.4', count: '841 ratings', kind: 'mixed', kindLabel: 'Mixed', cue: 'Superwhisper'},
  {name: 'Typeless', rating: '4.5', count: '743 ratings', kind: 'cloud', kindLabel: 'Cloud', cue: 'Typeless'},
  {name: 'Monologue', rating: '4.8', count: '298 ratings', kind: 'cloud', kindLabel: 'Cloud', cue: 'Monologue'},
];

export const AcclaimedScene: React.FC<SceneProps> = ({scene}) => {
  const {frame, fps} = useT();
  const cloud = wordAt(scene, 'cloud');
  const flash = interpolate(frame, [cloud * fps, (cloud + 0.3) * fps, (cloud + 1.2) * fps], [1, 1.12, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <>
      <SceneTitle scene={scene} title="The most acclaimed" sub="Independent reviews · US App Store ratings, October 2026" />
      <div style={{position: 'absolute', left: SAFE_X, right: SAFE_X, top: 300, display: 'grid', gap: 12}}>
        {ROWS.map((r, i) => (
          <div
            key={r.name}
            style={{
              display: 'grid',
              gridTemplateColumns: '360px 120px 220px 1fr 150px',
              alignItems: 'center',
              gap: 20,
              padding: '14px 26px',
              borderRadius: 18,
              background: C.panel,
              border: `2px solid ${i === 0 ? C.accent : C.line}`,
              minHeight: 74,
              ...fadeUp(frame, fps, wordAt(scene, r.cue), 0.5),
            }}
          >
            <div style={{fontFamily: display, fontWeight: 600, fontSize: 40}}>{r.name}</div>
            <div style={{fontFamily: mono, fontSize: 40, fontWeight: 500, color: C.accent}}>
              {r.rating}
              <span style={{fontSize: 26, marginLeft: 4}}>★</span>
            </div>
            <div style={{fontFamily: mono, fontSize: 24, color: C.muted}}>{r.count}</div>
            <div style={{fontSize: 25, color: C.ink2, fontStyle: 'italic', lineHeight: 1.3}}>{r.quote ?? ''}</div>
            <div style={{justifySelf: 'end', transform: `scale(${flash})`}}>
              <Chip kind={r.kind}>{r.kindLabel}</Chip>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ interesting */

export const InterestingScene: React.FC<SceneProps> = ({scene}) => {
  const {frame, fps} = useT();
  const aqua = wordAt(scene, 'Aqua');
  const typeless = wordAt(scene, 'Typeless');
  const change = wordAt(scene, 'change');
  const small = wordAt(scene, 'Outspoken');
  const card: React.CSSProperties = {position: 'absolute', top: 290, width: 540, height: 540};
  const name: React.CSSProperties = {fontFamily: display, fontWeight: 600, fontSize: 42};
  const what: React.CSSProperties = {fontSize: 30, color: C.accent, marginTop: 6, marginBottom: 26};
  const pill: React.CSSProperties = {
    fontSize: 30,
    padding: '12px 20px',
    borderRadius: 14,
    background: C.panel2,
    border: `1px solid ${C.line}`,
    marginBottom: 14,
  };
  const strike = progress(frame, fps, change, 0.5);
  const flowStep = (label: string, at: number, local = false) => (
    <div style={{display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12, ...fadeUp(frame, fps, at, 0.4)}}>
      <div style={{...pill, marginBottom: 0, flex: 1, borderColor: local ? C.localInk : C.line}}>{label}</div>
    </div>
  );
  return (
    <>
      <SceneTitle scene={scene} title="The most interesting ideas" />

      <Card style={{...card, left: SAFE_X, ...fadeUp(frame, fps, aqua)}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div style={name}>Aqua Voice</div>
          <Chip kind="cloud">Cloud</Chip>
        </div>
        <div style={what}>Edit by voice</div>
        {[
          ['“make this shorter”', 'shorter'],
          ['“translate this”', 'translate'],
          ['“spell Toni, T-O-N-I”', 'spell'],
        ].map(([label, cue]) => (
          <div key={label} style={{...pill, ...fadeUp(frame, fps, wordAt(scene, cue), 0.4)}}>
            {label}
          </div>
        ))}
      </Card>

      <Card style={{...card, left: 690, ...fadeUp(frame, fps, typeless)}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div style={name}>Typeless</div>
          <Chip kind="cloud">Cloud</Chip>
        </div>
        <div style={what}>Keeps what you meant</div>
        <div style={{fontSize: 34, lineHeight: 1.45, color: C.ink2}}>
          “Let’s meet at{' '}
          <span style={{color: strike > 0 ? C.removed : C.ink2, textDecoration: strike > 0 ? 'line-through' : 'none'}}>three, no wait,</span>{' '}
          four”
        </div>
        <div style={{margin: '24px 0', ...fadeUp(frame, fps, change + 0.3, 0.4)}}>
          <Arrow width={90} color={C.accent} />
        </div>
        <div style={{fontSize: 40, fontWeight: 600, ...fadeUp(frame, fps, change + 0.6, 0.5)}}>Let’s meet at four.</div>
      </Card>

      <Card highlight style={{...card, left: 1260, ...fadeUp(frame, fps, small)}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div style={name}>Outspoken, KeySay</div>
        </div>
        <div style={what}>Everything on the phone</div>
        {flowStep('Your voice', small + 0.4)}
        {flowStep('On-device speech recognition', wordAt(scene, 'transcription'), true)}
        {flowStep('On-device LLM cleanup', wordAt(scene, 'cleanup'), true)}
        <div style={{...fadeUp(frame, fps, wordAt(scene, 'phone'), 0.4), marginTop: 10}}>
          <Chip kind="local">Nothing leaves the phone</Chip>
        </div>
      </Card>
    </>
  );
};

/* ------------------------------------------------------------------ leverage */

export const LeverageScene: React.FC<SceneProps> = ({scene}) => {
  const {frame, fps} = useT();
  const top = wordAt(scene, 'dominates');
  const subs: [string, string][] = [
    ['Punctuation', 'Punctuation'],
    ['Filler words', 'filler'],
    ['Self-corrections', 'self-corrections'],
    ['Lists', 'lists'],
  ];
  const rest: [string, string][] = [
    ['One-tap capture anywhere', 'one-tap'],
    ['Names and jargon right', 'names'],
    ['Speed you can feel', 'speed'],
    ['Editing by voice', 'editing'],
  ];
  return (
    <>
      <SceneTitle scene={scene} title="Features ranked by leverage" />
      <Card highlight style={{position: 'absolute', left: SAFE_X, right: SAFE_X, top: 270, height: 250, ...fadeUp(frame, fps, top)}}>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 34}}>
          <div style={{fontFamily: display, fontWeight: 700, fontSize: 120, color: C.accent, lineHeight: 1}}>1</div>
          <div>
            <div style={{fontFamily: display, fontWeight: 700, fontSize: 64, lineHeight: 1.1}}>Text you don’t have to edit</div>
            <div style={{display: 'flex', gap: 14, marginTop: 22}}>
              {subs.map(([label, cue]) => (
                <div
                  key={label}
                  style={{fontSize: 30, padding: '8px 20px', borderRadius: 999, background: C.panel2, border: `1px solid ${C.line}`, ...popIn(frame, fps, wordAt(scene, cue))}}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
      <div style={{position: 'absolute', left: SAFE_X, right: SAFE_X, top: 560, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18}}>
        {rest.map(([label, cue], i) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              padding: '18px 26px',
              borderRadius: 18,
              background: C.panel,
              border: `1px solid ${C.line}`,
              ...fadeUp(frame, fps, wordAt(scene, cue), 0.45),
            }}
          >
            <div style={{fontFamily: mono, fontSize: 40, color: C.accent, width: 40}}>{i + 2}</div>
            <div style={{fontSize: 36, fontWeight: 500}}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: SAFE_X, top: 840, fontSize: 24, color: C.muted, ...fadeUp(frame, fps, wordAt(scene, 'editing') + 0.4)}}>
        My ranking, based on the evidence in the report.
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ hooked */

export const HookedScene: React.FC<SceneProps> = ({scene}) => {
  const {frame, fps} = useT();
  const tiles: {v: string; l: string; s: string; cue: string}[] = [
    {v: '3×', l: 'faster to speak than to thumb-type', s: 'Stanford, Baidu, UW study', cue: 'three'},
    {v: '89%', l: 'of messages sent with no edits', s: 'Wispr, company figure', cue: 'eighty-nine'},
    {v: '0.5 s', l: 'median time to hit send', s: 'Wispr, company figure', cue: 'half'},
    {v: '70%', l: 'still active after a year', s: 'Wispr, company figure', cue: 'seventy'},
  ];
  const trust = sentenceAt(scene, 5);
  return (
    <>
      <SceneTitle scene={scene} title="Why people get hooked" />
      <div style={{position: 'absolute', left: SAFE_X, right: SAFE_X, top: 290, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 22}}>
        {tiles.map((t) => (
          <Card key={t.v} style={{height: 330, display: 'grid', alignContent: 'start', gap: 14, ...popIn(frame, fps, wordAt(scene, t.cue))}}>
            <div style={{fontFamily: display, fontWeight: 700, fontSize: 100, lineHeight: 1, color: C.ink}}>{t.v}</div>
            <div style={{fontSize: 32, lineHeight: 1.3, color: C.ink2}}>{t.l}</div>
            <div style={{fontFamily: mono, fontSize: 21, color: C.muted}}>{t.s}</div>
          </Card>
        ))}
      </div>
      <div style={{position: 'absolute', left: SAFE_X, top: 670, display: 'flex', alignItems: 'center', gap: 26, ...fadeUp(frame, fps, sentenceAt(scene, 3))}}>
        <span style={{fontSize: 44, color: C.ink2}}>Stop proofreading</span>
        <Arrow width={90} color={C.accent} />
        <span style={{fontSize: 44, color: C.ink2}}>think out loud</span>
      </div>
      <div style={{position: 'absolute', left: SAFE_X, top: 750, display: 'flex', alignItems: 'center', gap: 26, ...fadeUp(frame, fps, trust)}}>
        <span style={{fontFamily: display, fontWeight: 700, fontSize: 72}}>Trust</span>
        <Arrow width={110} color={C.accent} />
        <span style={{fontFamily: display, fontWeight: 700, fontSize: 72, color: C.accent}}>habit</span>
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ local */

export const LocalScene: React.FC<SceneProps> = ({scene}) => {
  const {frame, fps} = useT();
  const yes = wordAt(scene, 'Yes');
  const cpu = wordAt(scene, 'CPU');
  const stream = wordAt(scene, 'Stream');
  const half = wordAt(scene, 'half');
  const scaleMax = 5;
  const plotW = 700;
  const bars: {label: string; v: number; at: number; note: string; hi?: boolean}[] = [
    {label: 'Full rewrite on CPU', v: 4.2, at: cpu + 0.3, note: 'estimate'},
    {label: 'Streamed: first words', v: 0.6, at: stream, note: 'estimate', hi: true},
    {label: 'Cloud leaders', v: 0.5, at: half, note: 'vendor claims'},
  ];
  const items: [string, string][] = [
    ['Keyboard is killed at ~48–77 MB', 'kills'],
    ['So the models run in the main app', 'models'],
    ['In the background the GPU is off limits', 'GPU'],
    ['iOS 27: the Neural Engine needs an entitlement', 'Neural'],
  ];
  return (
    <>
      <SceneTitle scene={scene} title="Can it run locally?" />
      <div style={{position: 'absolute', left: SAFE_X, top: 268, ...popIn(frame, fps, yes)}}>
        <Chip kind="local" style={{fontSize: 30, padding: '8px 22px'}}>
          Yes, but not inside the keyboard
        </Chip>
      </div>
      <div style={{position: 'absolute', left: SAFE_X, top: 360, width: 800, display: 'grid', gap: 16}}>
        {items.map(([label, cue]) => (
          <div
            key={label}
            style={{
              fontSize: 33,
              lineHeight: 1.3,
              padding: '16px 24px',
              borderRadius: 16,
              background: C.panel,
              border: `1px solid ${C.line}`,
              ...fadeUp(frame, fps, wordAt(scene, cue), 0.45),
            }}
          >
            {label}
          </div>
        ))}
      </div>

      <Card style={{position: 'absolute', left: 1000, top: 340, width: 800, height: 500, ...fadeUp(frame, fps, cpu)}}>
        <div style={{fontSize: 30, fontWeight: 600}}>Seconds until clean text appears</div>
        <div style={{fontSize: 22, color: C.muted, marginTop: 4}}>Gemma 4 E2B on an iPhone 17 Pro CPU, 50-word message</div>
        <div style={{marginTop: 30, display: 'grid', gap: 22}}>
          {bars.map((b) => {
            const p = progress(frame, fps, b.at, 0.9);
            return (
              <div key={b.label} style={{opacity: p > 0 ? 1 : 0}}>
                <div style={{fontSize: 25, color: C.ink2, marginBottom: 6}}>
                  {b.label} <span style={{color: C.muted, fontSize: 21}}>({b.note})</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                  <div
                    style={{
                      width: (b.v / scaleMax) * plotW * p,
                      height: 30,
                      background: b.hi ? C.accent : C.blue,
                      borderRadius: '0 6px 6px 0',
                    }}
                  />
                  <div style={{fontFamily: mono, fontSize: 26, opacity: p}}>{b.v.toFixed(1)} s</div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{position: 'relative', marginTop: 18, width: plotW, height: 30, borderTop: `1px solid ${C.line}`}}>
          {[0, 1, 2, 3, 4, 5].map((s) => (
            <div key={s} style={{position: 'absolute', left: (s / scaleMax) * plotW - 8, top: 4, fontFamily: mono, fontSize: 20, color: C.muted}}>
              {s}
            </div>
          ))}
        </div>
      </Card>
    </>
  );
};

/* ------------------------------------------------------------------ swedish */

export const SwedishScene: React.FC<SceneProps> = ({scene}) => {
  const {frame, fps} = useT();
  const wer: {label: string; v: number; hi?: boolean}[] = [
    {label: 'Klang Pianissimo', v: 4.5, hi: true},
    {label: 'KB-Whisper small', v: 5.8},
    {label: 'KB-Whisper medium', v: 4.9},
    {label: 'KB-Whisper large', v: 3.5},
  ];
  const chartAt = wordAt(scene, 'Pianissimo');
  const plotW = 340;
  const examples: {said: string; written: string; cue: string}[] = [
    {said: '“Öh, jag tänkte typ att vi…”', written: 'Jag tänkte att vi…', cue: 'fillers'},
    {said: '“ring kund tjänst”', written: 'Ring kundtjänst.', cue: 'compounds'},
    {said: '“tre tusen femhundra kronor”', written: '3 500 kr', cue: 'number'},
  ];
  return (
    <>
      <SceneTitle scene={scene} title="Swedish is wide open" />
      <div style={{position: 'absolute', left: SAFE_X, top: 270, width: 840, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16}}>
        {[
          ['Apple Dictation in Swedish', 'no automatic punctuation', 'punctuation'],
          ['iOS 27 Advanced Dictation', 'English only', 'English'],
        ].map(([a, b, cue]) => (
          <div
            key={a}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '18px 26px',
              borderRadius: 16,
              background: C.panel,
              border: `1px solid ${C.line}`,
              ...fadeUp(frame, fps, wordAt(scene, cue), 0.45),
            }}
          >
            <span style={{fontSize: 31}}>{a}</span>
            <span style={{fontSize: 31, color: C.removed, fontWeight: 600}}>{b}</span>
          </div>
        ))}
        <Card style={{marginTop: 8, ...fadeUp(frame, fps, chartAt)}}>
          <div style={{fontSize: 28, fontWeight: 600}}>Word error rate in Swedish</div>
          <div style={{fontSize: 21, color: C.muted, marginTop: 2}}>Mean of five test sets, Klang’s figures. Lower is better.</div>
          <div style={{display: 'grid', gap: 12, marginTop: 18}}>
            {wer.map((w, i) => {
              const p = progress(frame, fps, chartAt + 0.2 + i * 0.15, 0.8);
              return (
                <div key={w.label} style={{display: 'grid', gridTemplateColumns: '250px minmax(0, 1fr)', alignItems: 'center', gap: 14}}>
                  <div style={{fontSize: 24, color: w.hi ? C.ink : C.ink2, fontWeight: w.hi ? 600 : 400}}>{w.label}</div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                    <div style={{width: (w.v / 6) * plotW * p, height: 24, background: w.hi ? C.accent : '#4b5d70', borderRadius: '0 5px 5px 0'}} />
                    <div style={{fontFamily: mono, fontSize: 24, opacity: p}}>{w.v.toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div style={{position: 'absolute', left: 1030, top: 270, width: 770}}>
        <div style={{fontFamily: mono, fontSize: 22, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, ...fadeUp(frame, fps, sentenceAt(scene, 3))}}>
          Swedish cleanup
        </div>
        <div style={{display: 'grid', gap: 18, marginTop: 16}}>
          {examples.map((e) => (
            <Card key={e.said} style={{padding: '20px 26px', ...fadeUp(frame, fps, wordAt(scene, e.cue), 0.45)}}>
              <div style={{fontSize: 30, color: C.ink2, fontStyle: 'italic'}}>{e.said}</div>
              <div style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 10}}>
                <Arrow width={60} color={C.accent} />
                <div style={{fontSize: 36, fontWeight: 600}}>{e.written}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ plan */

export const PlanScene: React.FC<SceneProps> = ({scene}) => {
  const {frame, fps} = useT();
  const steps: [string, number][] = [
    ['Edit-free Swedish text', wordAt(scene, 'nail')],
    ['Painless sessions', wordAt(scene, 'painless')],
    ['Learn each user’s words', wordAt(scene, 'learn')],
    ['Voice editing and translation', sentenceAt(scene, 1)],
  ];
  const finalAt = sentenceAt(scene, 3) - 0.3;
  const out = progress(frame, fps, finalAt, 0.5);
  return (
    <>
      <div style={{opacity: 1 - out}}>
        <SceneTitle scene={scene} title="The plan" />
        <div style={{position: 'absolute', left: SAFE_X, top: 290, width: 860, display: 'grid', gap: 18}}>
          {steps.map(([label, at], i) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                padding: '20px 28px',
                borderRadius: 18,
                background: C.panel,
                border: `1px solid ${C.line}`,
                ...fadeUp(frame, fps, at, 0.45),
              }}
            >
              <div style={{fontFamily: mono, fontSize: 40, color: C.accent, width: 34}}>{i + 1}</div>
              <div style={{fontSize: 40, fontWeight: 500}}>{label}</div>
            </div>
          ))}
        </div>
        <Card highlight style={{position: 'absolute', left: 1060, top: 290, width: 740, ...fadeUp(frame, fps, sentenceAt(scene, 2))}}>
          <div style={{fontFamily: mono, fontSize: 22, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.accent}}>The one number</div>
          <div style={{fontFamily: display, fontWeight: 700, fontSize: 58, lineHeight: 1.1, marginTop: 14}}>Share of messages sent untouched</div>
        </Card>
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: 140,
          opacity: out,
        }}
      >
        <div style={{display: 'flex', gap: 16, marginBottom: 40}}>
          {['å', 'ä', 'ö'].map((k, i) => (
            <Keycap key={k} style={popIn(frame, fps, finalAt + 0.2 + i * 0.12)}>
              {k}
            </Keycap>
          ))}
          <Keycap accent style={{width: 120, ...popIn(frame, fps, finalAt + 0.6)}}>
            <MicIcon size={46} color={C.accent} />
          </Keycap>
        </div>
        <div style={{fontFamily: display, fontWeight: 700, fontSize: 140, letterSpacing: '-0.025em', lineHeight: 1}}>Talk, don’t type.</div>
        <div style={{fontSize: 44, color: C.ink2, marginTop: 26, ...fadeUp(frame, fps, wordAt(scene, 'In Swedish'), 0.5)}}>
          In Swedish. With nothing leaving the phone.
        </div>
        <div style={{marginTop: 40, ...fadeUp(frame, fps, wordAt(scene, 'nothing leaving') + 0.6, 0.6)}}>
          <VoiceBars bars={40} height={70} barWidth={8} gap={6} />
        </div>
      </div>
    </>
  );
};
