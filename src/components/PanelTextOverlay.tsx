import PanelTitle from '@/components/PanelTitle';
import { PANEL_COPY } from '@/components/panel.constants';

export default function PanelTextOverlay() {
  return (
    <PanelTitle
      srText={`${PANEL_COPY.topLine} ${PANEL_COPY.bottomLine}`}
      stackClassName="max-w-[min(94vw,1200px)] gap-[clamp(0.4rem,1.7vh,1.25rem)]"
      tone="gold"
      lines={[
        {
          id: 'top',
          text: PANEL_COPY.topLine,
          className:
            'text-center text-[clamp(3.2rem,min(14vw,10.5vh),6.4rem)] tracking-[-0.024em]',
        },
        {
          id: 'middle',
          text: PANEL_COPY.bottomLine,
          className:
            'text-center text-[clamp(5.15rem,min(23vw,18vh),10rem)] tracking-[-0.038em]',
        },
      ]}
    />
  );
}
