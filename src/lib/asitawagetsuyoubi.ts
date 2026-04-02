import holidayCalendarData from '@/generated/holidays.json';
import holidayConfigData from '@/lib/holiday-config.json';

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

export type SupportedCountryCode = (typeof COUNTRY_OPTIONS)[number]['code'];

const COUNTRY_TIME_ZONES = COUNTRY_OPTIONS.reduce<Record<string, string>>(
  (timeZones, option) => {
    timeZones[option.code] = option.timeZone;
    return timeZones;
  },
  {},
);

interface HolidayLookupState {
  __ASITA_HOLIDAY_LOOKUPS__?: Map<string, Map<string, HolidayEntry>>;
}

export interface AsitaWaGetsuyoubiResponse {
  asita: {
    getsuyoubi: boolean;
    holiday: HolidayEntry | null;
    shukujitsu: boolean;
  };
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

export function parseReferenceDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const referenceDate = new Date(value);

  if (Number.isNaN(referenceDate.getTime())) {
    return null;
  }

  return referenceDate;
}

function getCountryTimeZone(country: string) {
  return COUNTRY_TIME_ZONES[getSupportedCountryCode(country)];
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

export async function getAsitaWaGetsuyoubi({
  country,
  now = new Date(),
}: GetAsitaWaGetsuyoubiOptions): Promise<AsitaWaGetsuyoubiResponse> {
  const normalizedCountry = getSupportedCountryCode(country);
  const timeZone = getCountryTimeZone(normalizedCountry);
  const tomorrow = getTomorrowInTimeZone(now, timeZone);
  const holidayEntries = getHolidayEntriesForYear(
    normalizedCountry,
    tomorrow.year,
  );
  const holiday = holidayEntries.get(tomorrow.isoDate) ?? null;

  return {
    asita: {
      getsuyoubi: tomorrow.weekday === 1,
      holiday,
      shukujitsu: Boolean(holiday),
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
