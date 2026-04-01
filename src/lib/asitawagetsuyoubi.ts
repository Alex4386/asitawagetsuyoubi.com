const HOLIDAY_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const NAGER_DATE_BASE_URL = 'https://date.nager.at/api/v3/PublicHolidays';
const COUNTRY_TIME_ZONES: Record<string, string> = {
  JP: 'Asia/Tokyo',
};

interface HolidayRecord {
  date: string;
}

interface HolidayCacheEntry {
  expiresAt: number;
  holidays: HolidayRecord[];
}

interface SharedHolidayState {
  __ASITA_HOLIDAY_CACHE__?: Map<string, HolidayCacheEntry>;
  __ASITA_HOLIDAY_REQUESTS__?: Map<string, Promise<HolidayRecord[]>>;
}

export interface HolidayCacheStore {
  get(
    key: string,
  ): Promise<HolidayCacheEntry | null> | HolidayCacheEntry | null;
  set(key: string, value: HolidayCacheEntry): Promise<void> | void;
}

export interface KvNamespaceLike {
  get(key: string, type?: 'text'): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

export interface AsitaWaGetsuyoubiResponse {
  asita: {
    getsuyoubi: boolean;
    shukujitsu: boolean;
  };
}

export interface GetAsitaWaGetsuyoubiOptions {
  cache?: HolidayCacheStore;
  country: string;
  fetchImpl?: typeof fetch;
  now?: Date;
}

class AsitaWaGetsuyoubiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AsitaWaGetsuyoubiError';
    this.status = status;
  }
}

function getSharedHolidayState() {
  return globalThis as typeof globalThis & SharedHolidayState;
}

function getSharedHolidayCache() {
  const state = getSharedHolidayState();
  state.__ASITA_HOLIDAY_CACHE__ ??= new Map<string, HolidayCacheEntry>();
  return state.__ASITA_HOLIDAY_CACHE__;
}

function getSharedHolidayRequests() {
  const state = getSharedHolidayState();
  state.__ASITA_HOLIDAY_REQUESTS__ ??= new Map<
    string,
    Promise<HolidayRecord[]>
  >();
  return state.__ASITA_HOLIDAY_REQUESTS__;
}

export function createMemoryHolidayCacheStore(): HolidayCacheStore {
  const cache = getSharedHolidayCache();

  return {
    get(key) {
      return cache.get(key) ?? null;
    },
    set(key, value) {
      cache.set(key, value);
    },
  };
}

export function createKvHolidayCacheStore(
  kv: KvNamespaceLike,
): HolidayCacheStore {
  return {
    async get(key) {
      const value = await kv.get(key, 'text');

      if (!value) {
        return null;
      }

      return JSON.parse(value) as HolidayCacheEntry;
    },
    async set(key, value) {
      await kv.put(key, JSON.stringify(value));
    },
  };
}

function normalizeCountryCode(country: string) {
  const normalizedCountry = country.trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(normalizedCountry)) {
    throw new AsitaWaGetsuyoubiError(
      'country must be a two-letter ISO country code.',
      400,
    );
  }

  return normalizedCountry;
}

function getCountryTimeZone(country: string) {
  return COUNTRY_TIME_ZONES[country] ?? 'UTC';
}

function getRequiredDatePart(
  parts: Intl.DateTimeFormatPart[],
  type: 'day' | 'month' | 'year',
) {
  const value = parts.find(part => part.type === type)?.value;

  if (!value) {
    throw new AsitaWaGetsuyoubiError(
      `Unable to resolve ${type} for timezone-aware date.`,
      500,
    );
  }

  return Number(value);
}

function getDatePartsInTimeZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: '2-digit',
    timeZone,
    year: 'numeric',
  });
  const parts = formatter.formatToParts(date);
  const year = getRequiredDatePart(parts, 'year');
  const month = getRequiredDatePart(parts, 'month');
  const day = getRequiredDatePart(parts, 'day');

  return { day, month, year };
}

function getTomorrowInTimeZone(now: Date, timeZone: string) {
  const today = getDatePartsInTimeZone(now, timeZone);
  const tomorrow = new Date(
    Date.UTC(today.year, today.month - 1, today.day + 1, 12),
  );

  const year = tomorrow.getUTCFullYear();
  const month = tomorrow.getUTCMonth() + 1;
  const day = tomorrow.getUTCDate();

  return {
    day,
    isoDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(
      2,
      '0',
    )}`,
    month,
    weekday: tomorrow.getUTCDay(),
    year,
  };
}

async function fetchPublicHolidaysForYear(
  country: string,
  year: number,
  fetchImpl: typeof fetch,
) {
  const response = await fetchImpl(
    `${NAGER_DATE_BASE_URL}/${year}/${country}`,
    {
      cache: 'no-store',
    },
  );

  if (response.status === 404) {
    throw new AsitaWaGetsuyoubiError(
      `Holiday lookup does not support country ${country}.`,
      400,
    );
  }

  if (!response.ok) {
    throw new AsitaWaGetsuyoubiError(
      `Failed to fetch holidays for ${country}.`,
      502,
    );
  }

  const payload = (await response.json()) as unknown;

  if (!Array.isArray(payload)) {
    throw new AsitaWaGetsuyoubiError(
      `Holiday response for ${country} was invalid.`,
      502,
    );
  }

  return payload
    .filter(
      (holiday): holiday is HolidayRecord =>
        typeof holiday === 'object' &&
        holiday !== null &&
        'date' in holiday &&
        typeof holiday.date === 'string',
    )
    .map(holiday => ({ date: holiday.date }));
}

async function getPublicHolidaysForYear({
  cache,
  cacheKey,
  country,
  fetchImpl,
  now,
  year,
}: {
  cache: HolidayCacheStore;
  cacheKey: string;
  country: string;
  fetchImpl: typeof fetch;
  now: Date;
  year: number;
}) {
  const cachedEntry = await cache.get(cacheKey);

  if (cachedEntry && cachedEntry.expiresAt > now.getTime()) {
    return cachedEntry.holidays;
  }

  const pendingRequests = getSharedHolidayRequests();
  const existingRequest = pendingRequests.get(cacheKey);

  if (existingRequest) {
    return existingRequest;
  }

  const request = fetchPublicHolidaysForYear(country, year, fetchImpl)
    .then(async holidays => {
      await cache.set(cacheKey, {
        expiresAt: now.getTime() + HOLIDAY_CACHE_TTL_MS,
        holidays,
      });

      return holidays;
    })
    .catch(error => {
      if (cachedEntry) {
        return cachedEntry.holidays;
      }

      throw error;
    })
    .finally(() => {
      pendingRequests.delete(cacheKey);
    });

  pendingRequests.set(cacheKey, request);

  return request;
}

export async function getAsitaWaGetsuyoubi({
  cache = createMemoryHolidayCacheStore(),
  country,
  fetchImpl = globalThis.fetch.bind(globalThis),
  now = new Date(),
}: GetAsitaWaGetsuyoubiOptions): Promise<AsitaWaGetsuyoubiResponse> {
  if (typeof fetchImpl !== 'function') {
    throw new AsitaWaGetsuyoubiError('fetch is not available.', 500);
  }

  const normalizedCountry = normalizeCountryCode(country);
  const timeZone = getCountryTimeZone(normalizedCountry);
  const tomorrow = getTomorrowInTimeZone(now, timeZone);
  const cacheKey = `nager-public-holidays:${normalizedCountry}:${tomorrow.year}`;
  const holidays = await getPublicHolidaysForYear({
    cache,
    cacheKey,
    country: normalizedCountry,
    fetchImpl,
    now,
    year: tomorrow.year,
  });

  return {
    asita: {
      getsuyoubi: tomorrow.weekday === 1,
      shukujitsu: holidays.some(holiday => holiday.date === tomorrow.isoDate),
    },
  };
}

export function isAsitaWaGetsuyoubiError(error: unknown): error is Error & {
  status: number;
} {
  return (
    error instanceof Error &&
    'status' in error &&
    typeof error.status === 'number'
  );
}
