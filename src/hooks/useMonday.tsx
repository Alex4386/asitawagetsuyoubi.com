'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

import {
  DEFAULT_COUNTRY,
  getAsitaWaGetsuyoubi,
  getSupportedCountryCode,
  parseReferenceDate,
  type AsitaWaGetsuyoubiResponse,
  type HolidayEntry,
} from '@/lib/asitawagetsuyoubi';

const TEASING_CLASS_NAME = 'teasing';
const COUNTRY_STORAGE_KEY = 'asita-country';

type TeaseOmaeraOverride = boolean | null;
export type MondayDisplayMode =
  | 'teasing'
  | 'not-monday'
  | 'holiday'
  | 'override-off';

function getMondayDisplayMode({
  isTomorrowMonday,
  isShukujitsu,
  teaseOmaeraOverride,
}: {
  isTomorrowMonday: boolean;
  isShukujitsu: boolean;
  teaseOmaeraOverride: TeaseOmaeraOverride;
}): MondayDisplayMode {
  if (teaseOmaeraOverride === true) {
    return 'teasing';
  }

  if (!isTomorrowMonday) {
    return 'not-monday';
  }

  if (isShukujitsu) {
    return 'holiday';
  }

  if (teaseOmaeraOverride === false) {
    return 'override-off';
  }

  return 'teasing';
}

export interface MondayContextValue {
  country: string;
  isTomorrowMonday: boolean;
  isShukujitsu: boolean;
  nextHoliday: HolidayEntry | null;
  canTeaseOmaera: boolean;
  displayMode: MondayDisplayMode;
  specificDateTime: string;
  teaseOmaeraOverride: TeaseOmaeraOverride;
  isLoading: boolean;
  setCountry: Dispatch<SetStateAction<string>>;
  setSpecificDateTime: Dispatch<SetStateAction<string>>;
  setTomorrowMonday: Dispatch<SetStateAction<boolean>>;
  setShukujitsu: Dispatch<SetStateAction<boolean>>;
  setTeaseOmaeraOverride: Dispatch<SetStateAction<TeaseOmaeraOverride>>;
}

const MondayContext = createContext<MondayContextValue | null>(null);

export function MondayProvider({ children }: { children: ReactNode }) {
  const [countryState, setCountryState] = useState(DEFAULT_COUNTRY);
  const [isTomorrowMonday, setTomorrowMonday] = useState(false);
  const [isShukujitsu, setShukujitsu] = useState(false);
  const [nextHoliday, setNextHoliday] = useState<HolidayEntry | null>(null);
  const [specificDateTime, setSpecificDateTime] = useState('');
  const [teaseOmaeraOverride, setTeaseOmaeraOverride] =
    useState<TeaseOmaeraOverride>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasResolvedStoredCountry, setHasResolvedStoredCountry] =
    useState(false);
  const referenceDateIso = parseReferenceDate(specificDateTime)?.toISOString();

  const setCountry: Dispatch<SetStateAction<string>> = nextCountry => {
    setCountryState(currentCountry => {
      const resolvedCountry =
        typeof nextCountry === 'function'
          ? nextCountry(currentCountry)
          : nextCountry;

      return getSupportedCountryCode(resolvedCountry);
    });
  };

  const displayMode = getMondayDisplayMode({
    isShukujitsu,
    isTomorrowMonday,
    teaseOmaeraOverride,
  });
  const canTeaseOmaera = displayMode === 'teasing';

  useEffect(() => {
    document.documentElement.classList.toggle(
      TEASING_CLASS_NAME,
      canTeaseOmaera,
    );
  }, [canTeaseOmaera]);

  useEffect(() => {
    const storedCountry =
      typeof window === 'undefined'
        ? DEFAULT_COUNTRY
        : getSupportedCountryCode(
            window.localStorage.getItem(COUNTRY_STORAGE_KEY),
          );

    setCountryState(storedCountry);
    setHasResolvedStoredCountry(true);
  }, []);

  useEffect(() => {
    if (!hasResolvedStoredCountry || typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(COUNTRY_STORAGE_KEY, countryState);
  }, [countryState, hasResolvedStoredCountry]);

  useEffect(() => {
    if (!hasResolvedStoredCountry) {
      return;
    }

    let isCancelled = false;

    function applyMondayState(payload: AsitaWaGetsuyoubiResponse) {
      setTomorrowMonday(Boolean(payload.asita?.getsuyoubi));
      setNextHoliday(payload.asita?.holiday ?? null);
      setShukujitsu(Boolean(payload.asita?.shukujitsu));
    }

    async function hydrateMondayState() {
      setIsLoading(true);

      try {
        const referenceDate = parseReferenceDate(referenceDateIso) ?? undefined;
        const payload = await getAsitaWaGetsuyoubi({
          country: countryState,
          now: referenceDate,
        });

        if (isCancelled) {
          return;
        }

        applyMondayState(payload);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        console.error(
          'Failed to hydrate Monday state from local calendar.',
          error,
        );
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void hydrateMondayState();

    return () => {
      isCancelled = true;
    };
  }, [countryState, hasResolvedStoredCountry, referenceDateIso]);

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove(TEASING_CLASS_NAME);
    };
  }, []);

  return (
    <MondayContext.Provider
      value={{
        canTeaseOmaera,
        country: countryState,
        displayMode,
        isLoading,
        nextHoliday,
        isShukujitsu,
        isTomorrowMonday,
        setCountry,
        setSpecificDateTime,
        specificDateTime,
        teaseOmaeraOverride,
        setShukujitsu,
        setTeaseOmaeraOverride,
        setTomorrowMonday,
      }}>
      {children}
    </MondayContext.Provider>
  );
}

export function useMonday() {
  const context = useContext(MondayContext);

  if (!context) {
    throw new Error('useMonday must be used within a MondayProvider.');
  }

  return context;
}
