import PanelBeamCanvas from '@/components/PanelBeamCanvas';
import PanelDecorations from '@/components/PanelDecorations';
import PanelTextOverlay from '@/components/PanelTextOverlay';

export default function PanelSurface() {
  return (
    <section className="relative min-h-[100vh] min-h-[100svh] min-h-dvh w-full overflow-hidden isolate">
      <PanelBeamCanvas className="absolute inset-0 z-[1] pointer-events-none" />
      <PanelDecorations />
      <PanelTextOverlay />
    </section>
  );
}
