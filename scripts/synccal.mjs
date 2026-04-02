import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const NAGER_DATE_BASE_URL = 'https://date.nager.at/api/v3/PublicHolidays';
const CONFIG_PATH = path.join(process.cwd(), 'src/lib/holiday-config.json');
const OUTPUT_PATH = path.join(process.cwd(), 'src/generated/holidays.json');

function parseArgs(argv) {
  const options = {
    countries: [],
    fromYear: null,
    refresh: false,
    toYear: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--refresh') {
      options.refresh = true;
      continue;
    }

    if (argument === '--from-year') {
      options.fromYear = Number(argv[index + 1]);
      index += 1;
      continue;
    }

    if (argument === '--country') {
      options.countries.push(
        String(argv[index + 1])
          .trim()
          .toUpperCase(),
      );
      index += 1;
      continue;
    }

    if (argument === '--to-year') {
      options.toYear = Number(argv[index + 1]);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  if (
    (options.fromYear !== null && !Number.isInteger(options.fromYear)) ||
    (options.toYear !== null && !Number.isInteger(options.toYear))
  ) {
    throw new Error('--from-year and --to-year must be integers.');
  }

  if (
    options.fromYear !== null &&
    options.toYear !== null &&
    options.fromYear > options.toYear
  ) {
    throw new Error('--from-year must be less than or equal to --to-year.');
  }

  return options;
}

async function readJsonFile(filePath) {
  try {
    const source = await readFile(filePath, 'utf8');
    return JSON.parse(source);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

function getTargetYears(config, options) {
  if (options.fromYear !== null || options.toYear !== null) {
    const currentYear = new Date().getUTCFullYear();
    const fromYear = options.fromYear ?? currentYear;
    const toYear = options.toYear ?? fromYear;

    return Array.from(
      { length: toYear - fromYear + 1 },
      (_, index) => fromYear + index,
    );
  }

  const currentYear = new Date().getUTCFullYear();
  const years = config.syncYearOffsets.map(offset => currentYear + offset);

  return [...new Set(years)].sort((left, right) => left - right);
}

function getExistingDates(existingCalendar, countryCode, year) {
  const yearKey = String(year);
  const dates = existingCalendar?.countries?.[countryCode]?.[yearKey];

  if (!Array.isArray(dates) || dates.length === 0) {
    return null;
  }

  const isHolidayEntryList = dates.every(
    entry =>
      typeof entry === 'object' &&
      entry !== null &&
      'date' in entry &&
      typeof entry.date === 'string' &&
      'name' in entry &&
      typeof entry.name === 'string',
  );

  return isHolidayEntryList ? dates : null;
}

function cloneCountries(existingCountries) {
  if (!existingCountries || typeof existingCountries !== 'object') {
    return {};
  }

  return JSON.parse(JSON.stringify(existingCountries));
}

function getCoveredYears(countries) {
  return [
    ...new Set(
      Object.values(countries).flatMap(countryYears =>
        Object.keys(countryYears).map(year => Number(year)),
      ),
    ),
  ]
    .filter(year => Number.isInteger(year))
    .sort((left, right) => left - right);
}

function sleep(milliseconds) {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}

async function fetchHolidayDates(countryCode, year) {
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(
        `${NAGER_DATE_BASE_URL}/${year}/${countryCode}`,
        {
          headers: {
            accept: 'application/json',
          },
        },
      );
      const source = await response.text();

      if (!response.ok) {
        throw new Error(
          `Failed to fetch public holidays for ${countryCode} in ${year}: ${
            response.status
          } ${source.slice(0, 120)}`,
        );
      }

      let payload;

      try {
        payload = JSON.parse(source);
      } catch {
        throw new Error(
          `Holiday response for ${countryCode} in ${year} could not be parsed as JSON. Received: ${
            source.trim().slice(0, 200) || '<empty response>'
          }`,
        );
      }

      if (!Array.isArray(payload)) {
        throw new Error(
          `Holiday response for ${countryCode} in ${year} was invalid.`,
        );
      }

      return payload
        .filter(
          holiday =>
            typeof holiday === 'object' &&
            holiday !== null &&
            'date' in holiday &&
            typeof holiday.date === 'string' &&
            (('localName' in holiday &&
              typeof holiday.localName === 'string') ||
              ('name' in holiday && typeof holiday.name === 'string')),
        )
        .map(holiday => ({
          date: holiday.date,
          name:
            ('localName' in holiday && typeof holiday.localName === 'string'
              ? holiday.localName
              : null) ??
            ('name' in holiday && typeof holiday.name === 'string'
              ? holiday.name
              : holiday.date),
        }))
        .sort((left, right) => left.date.localeCompare(right.date));
    } catch (error) {
      lastError = error;

      if (attempt < 3) {
        await sleep(attempt * 400);
      }
    }
  }

  throw lastError;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const config = await readJsonFile(CONFIG_PATH);

  if (!config) {
    throw new Error('Holiday config file is missing.');
  }

  const existingCalendar = await readJsonFile(OUTPUT_PATH);
  const targetYears = getTargetYears(config, options);
  const configuredCountries = options.countries.length
    ? config.countries.filter(country =>
        options.countries.includes(country.code),
      )
    : config.countries;
  const countries = cloneCountries(existingCalendar?.countries);
  const pendingFetches = [];

  if (configuredCountries.length === 0) {
    throw new Error(
      'No configured countries matched the requested --country values.',
    );
  }

  for (const country of configuredCountries) {
    countries[country.code] ??= {};

    for (const year of targetYears) {
      const existingDates = !options.refresh
        ? getExistingDates(existingCalendar, country.code, year)
        : null;

      if (existingDates) {
        countries[country.code][String(year)] = existingDates;
        continue;
      }

      pendingFetches.push({ countryCode: country.code, year });
    }
  }

  if (pendingFetches.length === 0) {
    console.log(
      `Holiday calendar already synced for ${targetYears.join(', ')}.`,
    );
  } else {
    console.log(
      `Syncing ${
        pendingFetches.length
      } holiday calendar entries for ${targetYears.join(', ')}...`,
    );

    const fetchedEntries = [];

    for (const entry of pendingFetches) {
      console.log(`Fetching ${entry.countryCode} ${entry.year}...`);
      fetchedEntries.push({
        ...entry,
        dates: await fetchHolidayDates(entry.countryCode, entry.year),
      });
    }

    for (const entry of fetchedEntries) {
      countries[entry.countryCode][String(entry.year)] = entry.dates;
    }
  }

  const output = {
    metadata: {
      generatedAt: new Date().toISOString(),
      schemaVersion: 3,
      years: getCoveredYears(countries),
    },
    countries,
  };

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(`${OUTPUT_PATH}`, `${JSON.stringify(output, null, 2)}\n`);

  console.log(`Wrote holiday calendar to ${OUTPUT_PATH}.`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
