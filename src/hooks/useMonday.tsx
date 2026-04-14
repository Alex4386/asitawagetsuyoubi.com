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
  AUTO_COUNTRY_SELECTION,
  DEFAULT_COUNTRY,
  getAsitaWaGetsuyoubi,
  getReferenceDateForCountry,
  getSupportedCountryCode,
  getSupportedCountryCodeForTimeZone,
  type SupportedCountryCode,
  type AsitaWaGetsuyoubiResponse,
  type HolidayEntry,
} from '@/lib/asitawagetsuyoubi';

const TEASING_CLASS_NAME = 'teasing';
const COUNTRY_STORAGE_KEY = 'asita-country';

type TeaseOmaeraOverride = boolean | null;
type CountrySelection = SupportedCountryCode | typeof AUTO_COUNTRY_SELECTION;
export type MondayDisplayMode =
  | 'teasing'
  | 'today-monday'
  | 'today-holiday'
  | 'today-override-off'
  | 'not-monday'
  | 'holiday'
  | 'override-off';

function getMondayDisplayMode({
  isTodayMonday,
  isTodayShukujitsu,
  isTomorrowMonday,
  isTomorrowShukujitsu,
  teaseOmaeraOverride,
}: {
  isTodayMonday: boolean;
  isTodayShukujitsu: boolean;
  isTomorrowMonday: boolean;
  isTomorrowShukujitsu: boolean;
  teaseOmaeraOverride: TeaseOmaeraOverride;
}): MondayDisplayMode {
  if (teaseOmaeraOverride === true) {
    return 'teasing';
  }

  if (isTodayMonday) {
    if (isTodayShukujitsu) {
      return 'today-holiday';
    }

    if (teaseOmaeraOverride === false) {
      return 'today-override-off';
    }

    return 'today-monday';
  }

  if (!isTomorrowMonday) {
    return 'not-monday';
  }

  if (isTomorrowShukujitsu) {
    return 'holiday';
  }

  if (teaseOmaeraOverride === false) {
    return 'override-off';
  }

  return 'teasing';
}

export interface MondayContextValue {
  country: string;
  countrySelection: string;
  autoDetectedCountry: SupportedCountryCode;
  isTodayMonday: boolean;
  isTodayShukujitsu: boolean;
  isTomorrowMonday: boolean;
  isShukujitsu: boolean;
  todayHoliday: HolidayEntry | null;
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

interface MondayProviderProps {
  children: ReactNode;
  initialTeaseOmaeraOverride?: TeaseOmaeraOverride;
}

function getInitialCountryState() {
  let autoDetectedCountry = DEFAULT_COUNTRY as SupportedCountryCode;

  if (typeof window === 'undefined') {
    return {
      autoDetectedCountry,
      countrySelection: AUTO_COUNTRY_SELECTION as CountrySelection,
    };
  }

  try {
    autoDetectedCountry =
      getSupportedCountryCodeForTimeZone(
        Intl.DateTimeFormat().resolvedOptions().timeZone,
      ) ?? DEFAULT_COUNTRY;
  } catch {
    autoDetectedCountry = DEFAULT_COUNTRY as SupportedCountryCode;
  }

  const storedCountry = window.localStorage.getItem(COUNTRY_STORAGE_KEY);

  if (storedCountry === AUTO_COUNTRY_SELECTION || storedCountry === null) {
    return {
      autoDetectedCountry,
      countrySelection: AUTO_COUNTRY_SELECTION as CountrySelection,
    };
  }

  return {
    autoDetectedCountry,
    countrySelection: getSupportedCountryCode(storedCountry),
  };
}

function resolveCountrySelection(countrySelection: string): CountrySelection {
  if (countrySelection === AUTO_COUNTRY_SELECTION) {
    return AUTO_COUNTRY_SELECTION;
  }

  return getSupportedCountryCode(countrySelection);
}

export function MondayProvider({
  children,
  initialTeaseOmaeraOverride = null,
}: MondayProviderProps) {
  const [countrySelectionState, setCountrySelectionState] =
    useState<CountrySelection>(AUTO_COUNTRY_SELECTION);
  const [autoDetectedCountry, setAutoDetectedCountry] =
    useState<SupportedCountryCode>(DEFAULT_COUNTRY);
  const [isTodayMonday, setTodayMonday] = useState(false);
  const [isTodayShukujitsu, setTodayShukujitsu] = useState(false);
  const [isTomorrowMonday, setTomorrowMonday] = useState(false);
  const [isShukujitsu, setShukujitsu] = useState(false);
  const [todayHoliday, setTodayHoliday] = useState<HolidayEntry | null>(null);
  const [nextHoliday, setNextHoliday] = useState<HolidayEntry | null>(null);
  const [specificDateTime, setSpecificDateTime] = useState('');
  const [teaseOmaeraOverride, setTeaseOmaeraOverride] =
    useState<TeaseOmaeraOverride>(initialTeaseOmaeraOverride);
  const [isLoading, setIsLoading] = useState(true);
  const [hasResolvedStoredCountry, setHasResolvedStoredCountry] =
    useState(false);
  const countryState =
    countrySelectionState === AUTO_COUNTRY_SELECTION
      ? autoDetectedCountry
      : countrySelectionState;

  const setCountry: Dispatch<SetStateAction<string>> = nextCountry => {
    setCountrySelectionState(currentCountry => {
      const resolvedCountry =
        typeof nextCountry === 'function'
          ? nextCountry(currentCountry)
          : nextCountry;

      return resolveCountrySelection(resolvedCountry);
    });
  };

  const displayMode = getMondayDisplayMode({
    isTodayMonday,
    isTodayShukujitsu,
    isTomorrowMonday,
    isTomorrowShukujitsu: isShukujitsu,
    teaseOmaeraOverride,
  });
  const canTeaseOmaera =
    displayMode === 'teasing' || displayMode === 'today-monday';

  useEffect(() => {
    document.documentElement.classList.toggle(
      TEASING_CLASS_NAME,
      canTeaseOmaera,
    );
  }, [canTeaseOmaera]);

  useEffect(() => {
    const initialCountryState = getInitialCountryState();
    setAutoDetectedCountry(initialCountryState.autoDetectedCountry);
    setCountrySelectionState(initialCountryState.countrySelection);
    setHasResolvedStoredCountry(true);
  }, []);

  useEffect(() => {
    if (!hasResolvedStoredCountry || typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(COUNTRY_STORAGE_KEY, countrySelectionState);
  }, [countrySelectionState, hasResolvedStoredCountry]);

  useEffect(() => {
    if (!hasResolvedStoredCountry) {
      return;
    }

    let isCancelled = false;

    function applyMondayState(payload: AsitaWaGetsuyoubiResponse) {
      setTodayMonday(Boolean(payload.today?.getsuyoubi));
      setTodayHoliday(payload.today?.holiday ?? null);
      setTodayShukujitsu(Boolean(payload.today?.shukujitsu));
      setTomorrowMonday(Boolean(payload.asita?.getsuyoubi));
      setNextHoliday(payload.asita?.holiday ?? null);
      setShukujitsu(Boolean(payload.asita?.shukujitsu));
    }

    async function hydrateMondayState() {
      setIsLoading(true);

      try {
        const referenceDate =
          getReferenceDateForCountry(specificDateTime, countryState) ??
          undefined;
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
  }, [countryState, hasResolvedStoredCountry, specificDateTime]);

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove(TEASING_CLASS_NAME);
    };
  }, []);

  return (
    <MondayContext.Provider
      value={{
        autoDetectedCountry,
        canTeaseOmaera,
        country: countryState,
        countrySelection: countrySelectionState,
        displayMode,
        isLoading,
        isTodayMonday,
        isTodayShukujitsu,
        nextHoliday,
        isShukujitsu,
        isTomorrowMonday,
        setCountry,
        setSpecificDateTime,
        specificDateTime,
        teaseOmaeraOverride,
        todayHoliday,
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
