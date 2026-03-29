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
  backgroundImage:
    'linear-gradient(180deg, #fff9d8 0%, #ffef9d 18%, #efc23d 42%, #c9860a 70%, #8e5100 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  filter:
    'drop-shadow(0 0 0.07em rgba(255,255,248,0.98)) drop-shadow(0 0 0.2em rgba(255,247,175,0.62)) drop-shadow(0.028em 0.04em 0 #dca425) drop-shadow(0.06em 0.085em 0 #995a00)',
};

const topLineStyle: CSSProperties = {
  ...baseLineStyle,
  fontSize: 'clamp(3.2rem, min(14vw, 10.5vh), 6.4rem)',
  letterSpacing: '-0.024em',
};

const bottomLineStyle: CSSProperties = {
  ...baseLineStyle,
  fontSize: 'clamp(5.15rem, min(23vw, 18vh), 10rem)',
  letterSpacing: '-0.038em',
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
