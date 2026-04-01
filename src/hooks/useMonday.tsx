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
  createMemoryHolidayCacheStore,
  getAsitaWaGetsuyoubi,
  getSupportedCountryCode,
  parseReferenceDate,
  type AsitaWaGetsuyoubiResponse,
} from '@/lib/asitawagetsuyoubi';

const TEASING_CLASS_NAME = 'teasing';
const COUNTRY_STORAGE_KEY = 'asita-country';
const browserHolidayCache = createMemoryHolidayCacheStore();

type TeaseOmaeraOverride = boolean | null;

export interface MondayContextValue {
  country: string;
  isTomorrowMonday: boolean;
  isShukujitsu: boolean;
  canTeaseOmaera: boolean;
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

function getFetchWithSignal(signal: AbortSignal): typeof fetch {
  return (input, init) => fetch(input, { ...init, signal });
}

export function MondayProvider({ children }: { children: ReactNode }) {
  const [countryState, setCountryState] = useState(DEFAULT_COUNTRY);
  const [isTomorrowMonday, setTomorrowMonday] = useState(false);
  const [isShukujitsu, setShukujitsu] = useState(false);
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

  const canTeaseOmaera =
    !isShukujitsu && (teaseOmaeraOverride ?? isTomorrowMonday);

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

    const abortController = new AbortController();

    function applyMondayState(payload: AsitaWaGetsuyoubiResponse) {
      setTomorrowMonday(Boolean(payload.asita?.getsuyoubi));
      setShukujitsu(Boolean(payload.asita?.shukujitsu));
    }

    async function hydrateMondayState() {
      setIsLoading(true);

      try {
        const searchParams = new URLSearchParams({ country: countryState });

        if (referenceDateIso) {
          searchParams.set('at', referenceDateIso);
        }

        const response = await fetch(
          `/api/asitawagetsuyoubi?${searchParams.toString()}`,
          {
            cache: 'no-store',
            signal: abortController.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to load Monday state: ${response.status}`);
        }

        const payload = (await response.json()) as AsitaWaGetsuyoubiResponse;
        applyMondayState(payload);
      } catch (apiError) {
        if (abortController.signal.aborted) {
          return;
        }

        console.warn(
          'Failed to load Monday state from API. Falling back to browser implementation.',
          apiError,
        );

        try {
          const referenceDate =
            parseReferenceDate(referenceDateIso) ?? undefined;
          const payload = await getAsitaWaGetsuyoubi({
            cache: browserHolidayCache,
            country: countryState,
            fetchImpl: getFetchWithSignal(abortController.signal),
            now: referenceDate,
          });

          if (abortController.signal.aborted) {
            return;
          }

          applyMondayState(payload);
        } catch (browserError) {
          if (abortController.signal.aborted) {
            return;
          }

          console.error(
            'Failed to hydrate Monday state from both API and browser fallback.',
            browserError,
          );
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void hydrateMondayState();

    return () => {
      abortController.abort();
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
        isLoading,
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
