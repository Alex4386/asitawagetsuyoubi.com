import PanelBeamCanvas from '@/components/PanelBeamCanvas';
import PanelDecorations from '@/components/PanelDecorations';
import PanelTextOverlay from '@/components/PanelTextOverlay';

export default function PanelSurface() {
  return (
    <section className="relative h-full w-full isolate">
      <PanelBeamCanvas className="absolute inset-0 z-[1] pointer-events-none" />
      <PanelDecorations />
      <PanelTextOverlay />
    </section>
  );
}
