'use client';

import DisappointedText from '@/components/DisappointedText';
import PanelSurface from '@/components/PanelSurface';
import SettingsDialog from '@/components/SettingsDialog';
import { useMonday } from '@/hooks/useMonday';

export default function HomePageContent() {
  const { displayMode, isLoading } = useMonday();

  if (isLoading) {
    return <SettingsDialog />;
  }

  if (displayMode !== 'teasing' && displayMode !== 'today-monday') {
    return (
      <>
        <SettingsDialog />
        <DisappointedText mode={displayMode} />
      </>
    );
  }

  const panelMode =
    displayMode === 'today-monday' ? 'today-monday' : 'tomorrow-monday';

  return (
    <>
      <SettingsDialog />
      <main className="fixed inset-0 w-full">
        <PanelSurface mode={panelMode} />
        <div
          className="panel-bottom-target absolute inset-x-0 top-full z-0 h-[clamp(11rem,30svh,19rem)] pointer-events-none"
          aria-hidden="true"
        />
      </main>
    </>
  );
}
