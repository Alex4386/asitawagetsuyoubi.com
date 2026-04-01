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
  createMemoryHolidayCacheStore,
  getAsitaWaGetsuyoubi,
  type AsitaWaGetsuyoubiResponse,
} from '@/lib/asitawagetsuyoubi';

const MONDAY_CLASS_NAME = 'monday';
const DEFAULT_COUNTRY = 'JP';
const browserHolidayCache = createMemoryHolidayCacheStore();

type TeaseOmaeraOverride = boolean | null;

export interface MondayContextValue {
  isTomorrowMonday: boolean;
  isShukujitsu: boolean;
  canTeaseOmaera: boolean;
  teaseOmaeraOverride: TeaseOmaeraOverride;
  isLoading: boolean;
  setTomorrowMonday: Dispatch<SetStateAction<boolean>>;
  setShukujitsu: Dispatch<SetStateAction<boolean>>;
  setTeaseOmaeraOverride: Dispatch<SetStateAction<TeaseOmaeraOverride>>;
}

const MondayContext = createContext<MondayContextValue | null>(null);

function getInitialMondayState() {
  if (typeof document === 'undefined') {
    return false;
  }

  return document.documentElement.classList.contains(MONDAY_CLASS_NAME);
}

function getFetchWithSignal(signal: AbortSignal): typeof fetch {
  return (input, init) => fetch(input, { ...init, signal });
}

export function MondayProvider({ children }: { children: ReactNode }) {
  const [isTomorrowMonday, setTomorrowMonday] = useState(getInitialMondayState);
  const [isShukujitsu, setShukujitsu] = useState(false);
  const [teaseOmaeraOverride, setTeaseOmaeraOverride] =
    useState<TeaseOmaeraOverride>(null);
  const [isLoading, setIsLoading] = useState(true);

  const canTeaseOmaera = isTomorrowMonday && !isShukujitsu;

  useEffect(() => {
    document.documentElement.classList.toggle(
      MONDAY_CLASS_NAME,
      isTomorrowMonday,
    );
  }, [isTomorrowMonday]);

  useEffect(() => {
    const abortController = new AbortController();

    function applyMondayState(payload: AsitaWaGetsuyoubiResponse) {
      setTomorrowMonday(Boolean(payload.asita?.getsuyoubi));
      setShukujitsu(Boolean(payload.asita?.shukujitsu));
    }

    async function hydrateMondayState() {
      try {
        const response = await fetch(
          `/api/asitawagetsuyoubi?country=${DEFAULT_COUNTRY}`,
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
          const payload = await getAsitaWaGetsuyoubi({
            cache: browserHolidayCache,
            country: DEFAULT_COUNTRY,
            fetchImpl: getFetchWithSignal(abortController.signal),
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
  }, []);

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove(MONDAY_CLASS_NAME);
    };
  }, []);

  return (
    <MondayContext.Provider
      value={{
        canTeaseOmaera,
        isLoading,
        isShukujitsu,
        isTomorrowMonday,
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
