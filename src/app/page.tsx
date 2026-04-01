'use client';

import DisappointedText from '@/components/DisappointedText';
import PanelSurface from '@/components/PanelSurface';
import { useMonday } from '@/hooks/useMonday';

export default function Home() {
  const {
    canTeaseOmaera,
    isLoading,
    isShukujitsu,
    isTomorrowMonday,
    teaseOmaeraOverride,
  } = useMonday();
  const shouldRenderPanel = teaseOmaeraOverride ?? canTeaseOmaera;

  if (isLoading) {
    return null;
  }

  if (!shouldRenderPanel) {
    return (
      <DisappointedText
        isShukujitsu={isShukujitsu}
        isTomorrowMonday={isTomorrowMonday}
      />
    );
  }

  return (
    <main className="fixed inset-0 w-full overflow-hidden">
      <PanelSurface />
      <div
        className="panel-bottom-target absolute inset-x-0 top-full z-0 h-[clamp(11rem,30svh,19rem)] pointer-events-none"
        aria-hidden="true"
      />
    </main>
  );
}
