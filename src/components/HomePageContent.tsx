'use client';

import DisappointedText from '@/components/DisappointedText';
import PanelSurface from '@/components/PanelSurface';
import SettingsDialog from '@/components/SettingsDialog';
import { useMonday } from '@/hooks/useMonday';
import { getThisYearKanadeBirthday, isKanadeBirthdayRange, KANADE_CHANNEL_LINK } from '@/lib/kanade-bday';
import moment from 'moment';
import 'moment/locale/ja';

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

  const isInKanadeBdayRange = isKanadeBirthdayRange();

  return (
    <>
      <SettingsDialog />
      <main className="fixed inset-0 w-full">
        <PanelSurface mode={panelMode} />
        <div
          className="panel-bottom-target absolute inset-x-0 top-full z-0 h-[clamp(11rem,30svh,19rem)] pointer-events-none"
          aria-hidden="true"
        />
        {
          isInKanadeBdayRange && (
            <div className="absolute bottom-4 left-4 z-10">
              <button onClick={() => {
                if (typeof window !== 'undefined') {
                  window.open(KANADE_CHANNEL_LINK, '_blank');
                }
              }} className="items-center justify-center rounded-full px-4 py-2 border border-white/12 bg-black/30 text-white shadow-[0_0.8rem_2rem_rgba(0,0,0,0.35)] backdrop-blur-md transition-colors hover:bg-black/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
                音乃瀬奏の生日: {moment(getThisYearKanadeBirthday()).locale('ja').fromNow()}
              </button>
            </div>
          )
        }
      </main>
    </>
  );
}
