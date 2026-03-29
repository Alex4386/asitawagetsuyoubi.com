import { Noto_Sans_JP } from 'next/font/google';
import type { CSSProperties } from 'react';

import { PANEL_COPY } from '@/components/panel.constants';

const notoSansJp = Noto_Sans_JP({
  weight: ['700', '900'],
  display: 'swap',
  preload: false,
});

const baseLineStyle: CSSProperties = {
  color: 'transparent',
  lineHeight: 0.94,
  fontWeight: 900,
  fontSynthesis: 'none',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  filter:
    'drop-shadow(0 0 0.07em rgba(255,255,248,0.98)) drop-shadow(0 0 0.2em rgba(255,244,168,0.58)) drop-shadow(0.028em 0.04em 0 #daa11e) drop-shadow(0.06em 0.085em 0 #925100)',
};

const topLineStyle: CSSProperties = {
  ...baseLineStyle,
  fontSize: 'clamp(3.2rem, min(14vw, 10.5vh), 6.4rem)',
  letterSpacing: '-0.024em',
  backgroundImage:
    'linear-gradient(180deg, #865000 0%, #b87806 26%, #d79d12 52%, #f3cd4c 72%, #ffde24 82%, #d7a11a 100%)',
};

const bottomLineStyle: CSSProperties = {
  ...baseLineStyle,
  fontSize: 'clamp(5.15rem, min(23vw, 18vh), 10rem)',
  letterSpacing: '-0.038em',
  backgroundImage:
    'linear-gradient(180deg, #865000 0%, #b87806 26%, #d79d12 52%, #f3cd4c 72%, #ffde24 82%, #d7a11a 100%)',
};

export default function PanelTextOverlay() {
  return (
    <div
      className={`pointer-events-none z-[4] col-start-1 row-start-1 flex h-screen w-screen items-center justify-center overflow-hidden px-4 sm:px-6 ${notoSansJp.className}`}>
      <h1 className="sr-only">
        {PANEL_COPY.topLine} {PANEL_COPY.bottomLine}
      </h1>

      <div className="flex w-full max-w-[min(94vw,1200px)] flex-col items-center justify-center gap-[clamp(0.4rem,1.7vh,1.25rem)]">
        <span
          className="whitespace-nowrap text-center"
          aria-hidden="true"
          style={topLineStyle}>
          {PANEL_COPY.topLine}
        </span>
        <span
          className="whitespace-nowrap text-center"
          aria-hidden="true"
          style={bottomLineStyle}>
          {PANEL_COPY.bottomLine}
        </span>
      </div>
    </div>
  );
}
