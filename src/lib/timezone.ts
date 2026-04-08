interface CountryTimeZoneOption<CountryCode extends string = string> {
  code: CountryCode;
  timeZone: string;
}

export function buildCountryTimeZoneLookup<CountryCode extends string>(
  countryOptions: readonly CountryTimeZoneOption<CountryCode>[],
) {
  return countryOptions.reduce<Record<CountryCode, string>>(
    (timeZones, option) => {
      timeZones[option.code] = option.timeZone;
      return timeZones;
    },
    {} as Record<CountryCode, string>,
  );
}

export function buildSupportedCountryTimeZoneLookup<CountryCode extends string>(
  countryOptions: readonly CountryTimeZoneOption<CountryCode>[],
  timeZoneCountryAliases: Partial<Record<CountryCode, readonly string[]>>,
) {
  return countryOptions.reduce<Map<string, CountryCode>>((lookup, option) => {
    lookup.set(option.timeZone, option.code);

    for (const alias of timeZoneCountryAliases[option.code] ?? []) {
      lookup.set(alias, option.code);
    }

    return lookup;
  }, new Map<string, CountryCode>());
}

export function getSupportedCountryCodeForTimeZone<CountryCode extends string>({
  supportedCountryTimeZoneLookup,
  timeZone,
  timeZoneCountryPrefixes,
}: {
  supportedCountryTimeZoneLookup: ReadonlyMap<string, CountryCode>;
  timeZone: string | null | undefined;
  timeZoneCountryPrefixes: Readonly<Record<string, CountryCode>>;
}) {
  if (!timeZone) {
    return null;
  }

  const normalizedTimeZone = timeZone.trim();

  if (!normalizedTimeZone) {
    return null;
  }

  for (const [timeZonePrefix, countryCode] of Object.entries(
    timeZoneCountryPrefixes,
  )) {
    if (normalizedTimeZone.startsWith(timeZonePrefix)) {
      return countryCode;
    }
  }

  return supportedCountryTimeZoneLookup.get(normalizedTimeZone) ?? null;
}

function getRequiredDatePart(
  parts: Intl.DateTimeFormatPart[],
  type: 'day' | 'month' | 'year' | 'hour' | 'minute' | 'second',
) {
  const value = parts.find(part => part.type === type)?.value;

  if (!value) {
    throw new Error(`Unable to resolve ${type} for timezone-aware date.`);
  }

  return Number(value);
}

export function getDatePartsInTimeZone(date: Date, timeZone: string) {
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

export function getDateTimePartsInTimeZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    timeZone,
    year: 'numeric',
  });
  const parts = formatter.formatToParts(date);
  const year = getRequiredDatePart(parts, 'year');
  const month = getRequiredDatePart(parts, 'month');
  const day = getRequiredDatePart(parts, 'day');
  const hour = getRequiredDatePart(parts, 'hour');
  const minute = getRequiredDatePart(parts, 'minute');
  const second = getRequiredDatePart(parts, 'second');

  return { day, hour, minute, month, second, year };
}

export function createDateInTimeZone({
  day,
  hour = 12,
  minute = 0,
  month,
  second = 0,
  timeZone,
  year,
}: {
  day: number;
  hour?: number;
  minute?: number;
  month: number;
  second?: number;
  timeZone: string;
  year: number;
}) {
  const targetTimestamp = Date.UTC(year, month - 1, day, hour, minute, second);
  let candidate = new Date(targetTimestamp);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = getDateTimePartsInTimeZone(candidate, timeZone);
    const observedTimestamp = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    const offset = targetTimestamp - observedTimestamp;

    if (offset === 0) {
      return candidate;
    }

    candidate = new Date(candidate.getTime() + offset);
  }

  return candidate;
}

export function getTomorrowInTimeZone(now: Date, timeZone: string) {
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
