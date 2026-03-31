import { Noto_Sans_JP } from 'next/font/google';

import GoldPlatedText from '@/components/GoldPlatedText';
import { PANEL_COPY } from '@/components/panel.constants';

const notoSansJp = Noto_Sans_JP({
  weight: ['700', '900'],
  display: 'swap',
  preload: false,
});

export default function PanelTextOverlay() {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-[4] flex items-center justify-center overflow-hidden px-4 sm:px-6 ${notoSansJp.className}`}>
      <h1 className="sr-only">
        {PANEL_COPY.topLine} {PANEL_COPY.bottomLine}
      </h1>

      <div className="flex w-full max-w-[min(94vw,1200px)] flex-col items-center justify-center gap-[clamp(0.4rem,1.7vh,1.25rem)]">
        <GoldPlatedText
          className="whitespace-nowrap text-center text-[clamp(3.2rem,min(14vw,10.5vh),6.4rem)] tracking-[-0.024em]"
          aria-hidden="true">
          {PANEL_COPY.topLine}
        </GoldPlatedText>
        <GoldPlatedText
          className="whitespace-nowrap text-center text-[clamp(5.15rem,min(23vw,18vh),10rem)] tracking-[-0.038em]"
          aria-hidden="true">
          {PANEL_COPY.bottomLine}
        </GoldPlatedText>
      </div>
    </div>
  );
}
