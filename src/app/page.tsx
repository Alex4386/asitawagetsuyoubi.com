'use client';

import DisappointedText from '@/components/DisappointedText';
import PanelSurface from '@/components/PanelSurface';
import SettingsDialog from '@/components/SettingsDialog';
import { useMonday } from '@/hooks/useMonday';

export default function Home() {
  const { canTeaseOmaera, isLoading, isShukujitsu, isTomorrowMonday } =
    useMonday();

  if (isLoading) {
    return <SettingsDialog />;
  }

  if (!canTeaseOmaera) {
    return (
      <>
        <SettingsDialog />
        <DisappointedText
          isShukujitsu={isShukujitsu}
          isTomorrowMonday={isTomorrowMonday}
        />
      </>
    );
  }

  return (
    <>
      <SettingsDialog />
      <main className="fixed inset-0 w-full overflow-hidden">
        <PanelSurface />
        <div
          className="panel-bottom-target absolute inset-x-0 top-full z-0 h-[clamp(11rem,30svh,19rem)] pointer-events-none"
          aria-hidden="true"
        />
      </main>
    </>
  );
}
