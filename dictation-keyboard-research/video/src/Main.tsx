import React from 'react';
import {AbsoluteFill, Audio, Sequence, useVideoConfig} from 'remotion';
import {Backdrop, Captions, ChapterBar, MicPill, NARRATION, SceneFrame} from './components';
import {
  AcclaimedScene,
  HookedScene,
  HowScene,
  InterestingScene,
  IntroScene,
  LeverageScene,
  LocalScene,
  PlanScene,
  SwedishScene,
} from './scenes';
import {C, sans} from './theme';
import {Scene, timeline} from './timeline';

const SCENES: Record<string, React.FC<{scene: Scene}>> = {
  intro: IntroScene,
  how: HowScene,
  acclaimed: AcclaimedScene,
  interesting: InterestingScene,
  leverage: LeverageScene,
  hooked: HookedScene,
  local: LocalScene,
  swedish: SwedishScene,
  plan: PlanScene,
};

export const Main: React.FC = () => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: C.bg, color: C.ink, fontFamily: sans}}>
      <Backdrop />
      {timeline.scenes.map((scene) => {
        const Comp = SCENES[scene.id];
        const from = Math.round(scene.start * fps);
        const to = Math.round(scene.end * fps);
        return (
          <Sequence key={scene.id} from={from} durationInFrames={to - from} name={scene.id}>
            <SceneFrame scene={scene}>
              <Comp scene={scene} />
            </SceneFrame>
          </Sequence>
        );
      })}
      <ChapterBar />
      <MicPill />
      <Captions />
      <Audio src={NARRATION} />
    </AbsoluteFill>
  );
};
