import holidayCalendarData from '@/generated/holidays.json';
import holidayConfigData from '@/lib/holiday-config.json';
import {
  buildCountryTimeZoneLookup,
  buildSupportedCountryTimeZoneLookup,
  createDateInTimeZone,
  getTodayInTimeZone,
  getTomorrowInTimeZone,
  getSupportedCountryCodeForTimeZone as resolveSupportedCountryCodeForTimeZone,
} from '@/lib/timezone';
import {
  TIME_ZONE_COUNTRY_ALIASES,
  TIME_ZONE_COUNTRY_PREFIXES,
} from '@/lib/timezone.const';

interface HolidayConfigCountryOption {
  code: string;
  label: string;
  timeZone: string;
}

interface HolidayConfig {
  countries: HolidayConfigCountryOption[];
  defaultCountry: string;
  syncYearOffsets: number[];
}

export interface HolidayEntry {
  date: string;
  name: string;
}

export interface GetsuyoubiDayStatus {
  getsuyoubi: boolean;
  holiday: HolidayEntry | null;
  isoDate: string;
  shukujitsu: boolean;
}

interface GeneratedHolidayCalendar {
  countries: Record<string, Record<string, HolidayEntry[]>>;
  metadata: {
    generatedAt: string;
    schemaVersion: number;
    years: number[];
  };
}

const holidayConfig = holidayConfigData as HolidayConfig;
const holidayCalendar = holidayCalendarData as GeneratedHolidayCalendar;

export const DEFAULT_COUNTRY = holidayConfig.defaultCountry;
export const COUNTRY_OPTIONS = holidayConfig.countries;
export const AUTO_COUNTRY_SELECTION = 'AUTO';

export type SupportedCountryCode = (typeof COUNTRY_OPTIONS)[number]['code'];

const COUNTRY_TIME_ZONES = buildCountryTimeZoneLookup(COUNTRY_OPTIONS);

const SUPPORTED_COUNTRY_TIME_ZONE_LOOKUP = buildSupportedCountryTimeZoneLookup(
  COUNTRY_OPTIONS,
  TIME_ZONE_COUNTRY_ALIASES,
);

interface HolidayLookupState {
  __ASITA_HOLIDAY_LOOKUPS__?: Map<string, Map<string, HolidayEntry>>;
}

export interface AsitaWaGetsuyoubiResponse {
  today: GetsuyoubiDayStatus;
  asita: GetsuyoubiDayStatus;
}

export interface GetAsitaWaGetsuyoubiOptions {
  country: string;
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

function getHolidayLookupState() {
  return globalThis as typeof globalThis & HolidayLookupState;
}

function getHolidayLookups() {
  const state = getHolidayLookupState();
  state.__ASITA_HOLIDAY_LOOKUPS__ ??= new Map<
    string,
    Map<string, HolidayEntry>
  >();
  return state.__ASITA_HOLIDAY_LOOKUPS__;
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

export function getSupportedCountryCode(country: string | null | undefined) {
  let normalizedCountry = DEFAULT_COUNTRY;

  try {
    normalizedCountry = normalizeCountryCode(country ?? DEFAULT_COUNTRY);
  } catch {
    return DEFAULT_COUNTRY;
  }

  if (COUNTRY_OPTIONS.some(option => option.code === normalizedCountry)) {
    return normalizedCountry as SupportedCountryCode;
  }

  return DEFAULT_COUNTRY;
}

export function getSupportedCountryCodeForTimeZone(
  timeZone: string | null | undefined,
) {
  return resolveSupportedCountryCodeForTimeZone({
    supportedCountryTimeZoneLookup: SUPPORTED_COUNTRY_TIME_ZONE_LOOKUP,
    timeZone,
    timeZoneCountryPrefixes: TIME_ZONE_COUNTRY_PREFIXES as Record<
      string,
      SupportedCountryCode
    >,
  });
}

export function parseReferenceDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const referenceDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      12,
    );

    if (Number.isNaN(referenceDate.getTime())) {
      return null;
    }

    return referenceDate;
  }

  const referenceDate = new Date(value);

  if (Number.isNaN(referenceDate.getTime())) {
    return null;
  }

  return referenceDate;
}

export function getReferenceDateForCountry(
  value: string | null | undefined,
  country: string,
) {
  if (!value) {
    return null;
  }

  const timeZone = getCountryTimeZone(country);
  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;

    return createDateInTimeZone({
      day: Number(day),
      month: Number(month),
      timeZone,
      year: Number(year),
    });
  }

  const localDateTimeMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );

  if (localDateTimeMatch) {
    const [, year, month, day, hour, minute, second] = localDateTimeMatch;

    return createDateInTimeZone({
      day: Number(day),
      hour: Number(hour),
      minute: Number(minute),
      month: Number(month),
      second: Number(second ?? '0'),
      timeZone,
      year: Number(year),
    });
  }

  return parseReferenceDate(value);
}

function getCountryTimeZone(country: string) {
  return COUNTRY_TIME_ZONES[getSupportedCountryCode(country)];
}

function getHolidayEntriesForYear(country: string, year: number) {
  const countryCode = getSupportedCountryCode(country);
  const yearKey = String(year);
  const lookupKey = `${countryCode}:${yearKey}`;
  const cachedLookup = getHolidayLookups().get(lookupKey);

  if (cachedLookup) {
    return cachedLookup;
  }

  const holidayDates = holidayCalendar.countries[countryCode]?.[yearKey];

  if (!holidayDates) {
    const syncedYears = holidayCalendar.metadata?.years ?? [];
    throw new AsitaWaGetsuyoubiError(
      `Holiday data for ${countryCode} in ${yearKey} is not synced. Available years: ${
        syncedYears.join(', ') || 'none'
      }. Run yarn synccal.`,
      503,
    );
  }

  const lookup = new Map(
    holidayDates.map(holiday => [holiday.date, holiday] as const),
  );
  getHolidayLookups().set(lookupKey, lookup);
  return lookup;
}

function getDayStatus(
  country: string,
  date: ReturnType<typeof getTodayInTimeZone>,
): GetsuyoubiDayStatus {
  const holidayEntries = getHolidayEntriesForYear(country, date.year);
  const holiday = holidayEntries.get(date.isoDate) ?? null;

  return {
    getsuyoubi: date.weekday === 1,
    holiday,
    isoDate: date.isoDate,
    shukujitsu: Boolean(holiday),
  };
}

export async function getAsitaWaGetsuyoubi({
  country,
  now = new Date(),
}: GetAsitaWaGetsuyoubiOptions): Promise<AsitaWaGetsuyoubiResponse> {
  const normalizedCountry = getSupportedCountryCode(country);
  const timeZone = getCountryTimeZone(normalizedCountry);
  let today: ReturnType<typeof getTodayInTimeZone>;
  let tomorrow: ReturnType<typeof getTomorrowInTimeZone>;

  try {
    today = getTodayInTimeZone(now, timeZone);
    tomorrow = getTomorrowInTimeZone(now, timeZone);
  } catch {
    throw new AsitaWaGetsuyoubiError(
      'Unable to resolve timezone-aware date.',
      500,
    );
  }

  return {
    today: getDayStatus(normalizedCountry, today),
    asita: getDayStatus(normalizedCountry, tomorrow),
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
