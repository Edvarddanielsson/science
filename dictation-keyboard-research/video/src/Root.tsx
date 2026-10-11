import React from 'react';
import {Composition} from 'remotion';
import {Main} from './Main';
import {timeline} from './timeline';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="DictationKeyboards"
    component={Main}
    durationInFrames={timeline.durationInFrames}
    fps={timeline.fps}
    width={1920}
    height={1080}
  />
);
