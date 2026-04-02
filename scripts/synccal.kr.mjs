import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const KR_SPCDEINFOSERVICE_SERVICE_KEY_ENV = 'KR_SPCDEINFOSERVICE_SERVICE_KEY';
const CONFIG_PATH = path.join(process.cwd(), 'src/lib/holiday-config.json');
const DOT_ENV_PATH = path.join(process.cwd(), '.env');
const OUTPUT_PATH = path.join(process.cwd(), 'src/generated/holidays.json');
const KR_SPCDE_INFO_SERVICE_URL =
  'https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService';
const KR_SPCDE_INFO_OPERATION_NAMES = ['getRestDeInfo', 'getHoliDeInfo'];

function parseArgs(argv) {
  const options = {
    fromYear: null,
    toYear: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--from-year') {
      options.fromYear = Number(argv[index + 1]);
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

async function readDotEnvFile(filePath) {
  try {
    const source = await readFile(filePath, 'utf8');
    const values = {};

    for (const rawLine of source.split(/\r?\n/u)) {
      const line = rawLine.trim();

      if (!line || line.startsWith('#')) {
        continue;
      }

      const normalizedLine = line.startsWith('export ')
        ? line.slice('export '.length)
        : line;
      const separatorIndex = normalizedLine.indexOf('=');

      if (separatorIndex === -1) {
        continue;
      }

      const name = normalizedLine.slice(0, separatorIndex).trim();
      let value = normalizedLine.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      values[name] = value;
    }

    return values;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return {};
    }

    throw error;
  }
}

function getTargetYears(config, existingCalendar, options) {
  if (options.fromYear !== null || options.toYear !== null) {
    const currentYear = new Date().getUTCFullYear();
    const fromYear = options.fromYear ?? currentYear;
    const toYear = options.toYear ?? fromYear;

    return Array.from(
      { length: toYear - fromYear + 1 },
      (_, index) => fromYear + index,
    );
  }

  const generatedYears = existingCalendar?.metadata?.years;

  if (Array.isArray(generatedYears) && generatedYears.length > 0) {
    return [...new Set(generatedYears)]
      .filter(year => Number.isInteger(year))
      .sort((left, right) => left - right);
  }

  const currentYear = new Date().getUTCFullYear();
  const years = config.syncYearOffsets.map(offset => currentYear + offset);

  return [...new Set(years)].sort((left, right) => left - right);
}

function normalizeServiceKey(serviceKey) {
  try {
    return decodeURIComponent(serviceKey);
  } catch {
    return serviceKey;
  }
}

function readXmlTag(source, tagName) {
  const match = source.match(
    new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, 'i'),
  );

  return match?.[1]?.trim() ?? null;
}

function parseKrLocdate(locdate) {
  if (!/^\d{8}$/u.test(locdate)) {
    return null;
  }

  return `${locdate.slice(0, 4)}-${locdate.slice(4, 6)}-${locdate.slice(6, 8)}`;
}

function parseKoreanHolidayXml(source, year, month, operationName) {
  const resultCode = readXmlTag(source, 'resultCode');
  const resultMessage = readXmlTag(source, 'resultMsg');

  if (resultCode && resultCode !== '00') {
    throw new Error(
      `KR special-day API returned ${resultCode} for KR ${year}-${month} via ${operationName}: ${
        resultMessage ?? 'Unknown error'
      }`,
    );
  }

  const items = [...source.matchAll(/<item>([\s\S]*?)<\/item>/giu)];

  if (items.length === 0) {
    return [];
  }

  return items
    .map(match => {
      const itemSource = match[1];
      const dateName = readXmlTag(itemSource, 'dateName');
      const isHoliday = readXmlTag(itemSource, 'isHoliday');
      const locdate = readXmlTag(itemSource, 'locdate');
      const isoDate = locdate ? parseKrLocdate(locdate) : null;

      if (!isoDate) {
        return null;
      }

      if (isHoliday && isHoliday.toUpperCase() !== 'Y') {
        return null;
      }

      return {
        date: isoDate,
        name: dateName ?? isoDate,
      };
    })
    .filter(Boolean);
}

async function fetchKoreanSupplementalHolidayDates(year, serviceKey) {
  const holidayDates = new Map();
  const normalizedServiceKey = normalizeServiceKey(serviceKey);

  for (let month = 1; month <= 12; month += 1) {
    const monthString = String(month).padStart(2, '0');
    let operationError = null;

    for (const operationName of KR_SPCDE_INFO_OPERATION_NAMES) {
      const searchParams = new URLSearchParams({
        numOfRows: '100',
        pageNo: '1',
        serviceKey: normalizedServiceKey,
        solMonth: monthString,
        solYear: String(year),
      });

      try {
        const response = await fetch(
          `${KR_SPCDE_INFO_SERVICE_URL}/${operationName}?${searchParams.toString()}`,
          {
            headers: {
              accept: 'application/xml,text/xml;q=0.9,*/*;q=0.8',
            },
          },
        );
        const source = await response.text();

        if (!response.ok) {
          throw new Error(
            `Failed to fetch KR special-day data for ${year}-${monthString} via ${operationName}: ${
              response.status
            } ${source.slice(0, 160) || '<empty response>'}`,
          );
        }

        const parsedDates = parseKoreanHolidayXml(
          source,
          year,
          monthString,
          operationName,
        );

        for (const parsedDate of parsedDates) {
          holidayDates.set(parsedDate.date, parsedDate);
        }

        operationError = null;
        break;
      } catch (error) {
        operationError = error;
      }
    }

    if (operationError) {
      throw operationError;
    }
  }

  return [...holidayDates.values()].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
}

function shouldBackfillHolidayName(existingEntry, supplementalEntry) {
  if (!existingEntry || !supplementalEntry) {
    return false;
  }

  if (
    typeof existingEntry.name !== 'string' ||
    existingEntry.name.length === 0
  ) {
    return true;
  }

  return (
    existingEntry.name === existingEntry.date &&
    supplementalEntry.name !== supplementalEntry.date
  );
}

function mergeKrSupplementalDates(existingEntries, supplementalEntries) {
  const mergedDates = new Map(
    existingEntries.map(entry => [entry.date, entry]),
  );

  for (const supplementalEntry of supplementalEntries) {
    const existingEntry = mergedDates.get(supplementalEntry.date);

    if (!existingEntry) {
      mergedDates.set(supplementalEntry.date, supplementalEntry);
      continue;
    }

    if (shouldBackfillHolidayName(existingEntry, supplementalEntry)) {
      mergedDates.set(supplementalEntry.date, {
        ...existingEntry,
        name: supplementalEntry.name,
      });
    }
  }

  return [...mergedDates.values()].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const [config, existingCalendar, dotEnv] = await Promise.all([
    readJsonFile(CONFIG_PATH),
    readJsonFile(OUTPUT_PATH),
    readDotEnvFile(DOT_ENV_PATH),
  ]);

  if (!config) {
    throw new Error('Holiday config file is missing.');
  }

  if (!existingCalendar) {
    throw new Error(
      'Generated holiday calendar is missing. Run `yarn synccal` first.',
    );
  }

  const krSupported = config.countries.some(country => country.code === 'KR');

  if (!krSupported) {
    console.log('KR is not configured in holiday-config.json. Nothing to do.');
    return;
  }

  const serviceKey = dotEnv[KR_SPCDEINFOSERVICE_SERVICE_KEY_ENV] ?? null;

  if (!serviceKey) {
    console.log(
      `${KR_SPCDEINFOSERVICE_SERVICE_KEY_ENV} is not set in .env. Skipping KR supplement.`,
    );
    return;
  }

  const targetYears = getTargetYears(config, existingCalendar, options);
  const countries =
    existingCalendar.countries && typeof existingCalendar.countries === 'object'
      ? JSON.parse(JSON.stringify(existingCalendar.countries))
      : {};

  countries.KR ??= {};

  for (const year of targetYears) {
    console.log(`Fetching KR supplement ${year}...`);

    const yearKey = String(year);
    const existingEntries = Array.isArray(countries.KR[yearKey])
      ? countries.KR[yearKey]
      : [];
    const supplementalEntries = await fetchKoreanSupplementalHolidayDates(
      year,
      serviceKey,
    );

    countries.KR[yearKey] = mergeKrSupplementalDates(
      existingEntries,
      supplementalEntries,
    );
  }

  const output = {
    ...existingCalendar,
    metadata: {
      ...existingCalendar.metadata,
      generatedAt: new Date().toISOString(),
    },
    countries,
  };

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);

  console.log(`Updated KR supplemental holidays in ${OUTPUT_PATH}.`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
