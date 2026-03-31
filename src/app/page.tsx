import PanelSurface from '@/components/PanelSurface';

export default function Home() {
  return (
    <main className="relative min-h-dvh w-full overflow-hidden">
      <PanelSurface />
      <div
        className="panel-bottom-target absolute inset-x-0 top-[100dvh] z-0 h-[clamp(11rem,30svh,19rem)] pointer-events-none"
        aria-hidden="true"
      />
    </main>
  );
}
