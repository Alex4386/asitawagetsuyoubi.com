import PanelTitle from '@/components/PanelTitle';
import {
  DEFAULT_PANEL_COPY_MODE,
  getPanelCopy,
  type PanelCopyMode,
} from '@/components/panel.constants';

export default function PanelTextOverlay({
  mode = DEFAULT_PANEL_COPY_MODE,
}: {
  mode?: PanelCopyMode;
}) {
  const copy = getPanelCopy(mode);

  return (
    <PanelTitle
      srText={copy.srText}
      stackClassName="max-w-[min(94vw,1200px)] gap-[clamp(0.4rem,1.7vh,1.25rem)]"
      tone="gold"
      lines={[
        {
          id: 'top',
          text: copy.topLine,
          className:
            'text-center text-[clamp(3.2rem,min(14vw,10.5vh),6.4rem)] tracking-[-0.024em]',
        },
        {
          id: 'middle',
          text: copy.bottomLine,
          className:
            'text-center text-[clamp(5.15rem,min(23vw,18vh),10rem)] tracking-[-0.038em]',
        },
      ]}
    />
  );
}
