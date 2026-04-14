import PanelBeamCanvas from '@/components/PanelBeamCanvas';
import PanelDecorations from '@/components/PanelDecorations';
import PanelTextOverlay from '@/components/PanelTextOverlay';
import {
  DEFAULT_PANEL_COPY_MODE,
  type PanelCopyMode,
} from '@/components/panel.constants';

export default function PanelSurface({
  mode = DEFAULT_PANEL_COPY_MODE,
}: {
  mode?: PanelCopyMode;
}) {
  return (
    <section className="relative h-full w-full isolate">
      <PanelBeamCanvas className="absolute inset-0 z-[1] pointer-events-none" />
      <PanelDecorations />
      <PanelTextOverlay mode={mode} />
    </section>
  );
}
