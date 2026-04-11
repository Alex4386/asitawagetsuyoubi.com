'use client';

import { useEffect, useState } from 'react';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  COUNTRY_OPTIONS,
  getAsitaWaGetsuyoubi,
  getReferenceDateForCountry,
  type HolidayEntry,
} from '@/lib/asitawagetsuyoubi';
import { getTomorrowInTimeZone } from '@/lib/timezone';

type GlobalCountryStatus = 'teasing' | 'not-monday' | 'holiday' | 'error';
type GlobalPreset = 'tomorrow' | 'next-sunday' | 'custom';

interface GlobalCountryTeasability {
  canTeaseOmaera: boolean;
  code: string;
  errorMessage: string | null;
  holiday: HolidayEntry | null;
  isShukujitsu: boolean;
  isTomorrowMonday: boolean;
  label: string;
  status: GlobalCountryStatus;
  timeZone: string;
  tomorrowIsoDate: string;
}

function createLocalNoon(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12,
  );
}

function addDays(date: Date, days: number) {
  const nextDate = createLocalNoon(date);
  nextDate.setDate(nextDate.getDate() + days);
  return createLocalNoon(nextDate);
}

function formatDateInputValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;
}

function getTomorrowPresetDate() {
  return addDays(new Date(), 0);
}

function getNextSundayPresetDate() {
  const today = createLocalNoon(new Date());
  const daysUntilSunday = ((7 - today.getDay()) % 7) || 7;
  return addDays(today, daysUntilSunday);
}

function getCountryStatus({
  isShukujitsu,
  isTomorrowMonday,
}: Pick<GlobalCountryTeasability, 'isShukujitsu' | 'isTomorrowMonday'>) {
  if (!isTomorrowMonday) {
    return 'not-monday' as const;
  }

  if (isShukujitsu) {
    return 'holiday' as const;
  }

  return 'teasing' as const;
}

function getStatusLabel(status: GlobalCountryStatus) {
  if (status === 'teasing') {
    return '煽りOK';
  }

  if (status === 'holiday') {
    return '祝日';
  }

  if (status === 'error') {
    return 'エラー';
  }

  return '月曜日ではない';
}

function getStatusClassName(status: GlobalCountryStatus) {
  if (status === 'teasing') {
    return 'border-emerald-400/30 bg-emerald-400/15 text-emerald-200';
  }

  if (status === 'holiday') {
    return 'border-sky-400/30 bg-sky-400/15 text-sky-200';
  }

  if (status === 'error') {
    return 'border-rose-400/30 bg-rose-400/15 text-rose-200';
  }

  return 'border-white/15 bg-white/5 text-neutral-300';
}

function getFlagEmoji(countryCode: string) {
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return '🏳️';
  }

  return String.fromCodePoint(
    ...countryCode.split('').map(character => 127397 + character.charCodeAt(0)),
  );
}

async function getGlobalCountryTeasability(
  referenceDateValue: string,
): Promise<GlobalCountryTeasability[]> {
  return Promise.all(
    COUNTRY_OPTIONS.map(async country => {
      const referenceDate =
        getReferenceDateForCountry(referenceDateValue, country.code) ??
        getTomorrowPresetDate();
      const tomorrow = getTomorrowInTimeZone(referenceDate, country.timeZone);

      try {
        const payload = await getAsitaWaGetsuyoubi({
          country: country.code,
          now: referenceDate,
        });
        const isTomorrowMonday = Boolean(payload.asita.getsuyoubi);
        const isShukujitsu = Boolean(payload.asita.shukujitsu);
        const status = getCountryStatus({
          isShukujitsu,
          isTomorrowMonday,
        });

        return {
          canTeaseOmaera: status === 'teasing',
          code: country.code,
          errorMessage: null,
          holiday: payload.asita.holiday,
          isShukujitsu,
          isTomorrowMonday,
          label: country.label,
          status,
          timeZone: country.timeZone,
          tomorrowIsoDate: tomorrow.isoDate,
        };
      } catch {
        return {
          canTeaseOmaera: false,
          code: country.code,
          errorMessage: '判定できませんでした',
          holiday: null,
          isShukujitsu: false,
          isTomorrowMonday: false,
          label: country.label,
          status: 'error',
          timeZone: country.timeZone,
          tomorrowIsoDate: tomorrow.isoDate,
        };
      }
    }),
  );
}

export default function GlobalPage() {
  const [preset, setPreset] = useState<GlobalPreset>('tomorrow');
  const [referenceDateValue, setReferenceDateValue] = useState(() =>
    formatDateInputValue(getTomorrowPresetDate()),
  );
  const [countries, setCountries] = useState<GlobalCountryTeasability[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function hydrateCountries() {
      setIsLoading(true);

      try {
        const payload = await getGlobalCountryTeasability(referenceDateValue);

        if (isCancelled) {
          return;
        }

        setCountries(payload);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void hydrateCountries();

    return () => {
      isCancelled = true;
    };
  }, [referenceDateValue]);

  function handlePresetChange(nextPreset: string) {
    if (nextPreset === 'tomorrow') {
      setPreset('tomorrow');
      setReferenceDateValue(formatDateInputValue(getTomorrowPresetDate()));
      return;
    }

    if (nextPreset === 'next-sunday') {
      setPreset('next-sunday');
      setReferenceDateValue(formatDateInputValue(getNextSundayPresetDate()));
      return;
    }

    setPreset('custom');
  }

  function handleReferenceDateChange(value: string) {
    if (!value) {
      return;
    }

    setPreset('custom');
    setReferenceDateValue(value);
  }

  const teasableCountries = countries.filter(country => country.canTeaseOmaera);

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-neutral-50 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="flex items-center">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-neutral-200 transition-colors hover:bg-white/[0.08] hover:text-white"
            onClick={() => window.history.back()}>
            <span aria-hidden="true">←</span>
            <span>戻る</span>
          </button>
        </div>

        <header className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              各国の煽り判定
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-neutral-300 sm:text-base">
              基準日を切り替えて、国ごとの判定を確認できます。
            </p>
          </div>

          <Tabs
            value={preset}
            onValueChange={handlePresetChange}
            className="flex flex-col gap-3">
            <TabsList>
              <TabsTrigger value="tomorrow">明日</TabsTrigger>
              <TabsTrigger value="next-sunday">来週の日曜</TabsTrigger>
              <TabsTrigger value="custom">カスタム</TabsTrigger>
            </TabsList>
          </Tabs>

          <dl className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <div className="flex min-w-[10rem] flex-1 flex-col gap-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <dt className="text-xs font-medium tracking-[0.18em] text-neutral-500">
                国数
              </dt>
              <dd className="text-2xl font-semibold text-white">
                {COUNTRY_OPTIONS.length}
              </dd>
            </div>
            <div className="flex min-w-[10rem] flex-1 flex-col gap-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <dt className="text-xs font-medium tracking-[0.18em] text-neutral-500">
                煽りOK
              </dt>
              <dd className="text-2xl font-semibold text-white">
                {isLoading ? '...' : teasableCountries.length}
              </dd>
            </div>
            <div className="flex min-w-[16rem] flex-[1.4] flex-col gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <dt className="text-xs font-medium tracking-[0.18em] text-neutral-500">
                基準日
              </dt>
              <dd>
                <input
                  type="date"
                  value={referenceDateValue}
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#151515] px-3 text-sm font-medium text-neutral-100 outline-none transition-colors focus:border-white/30"
                  onChange={event =>
                    handleReferenceDateChange(event.target.value)
                  }
                />
              </dd>
            </div>
          </dl>
        </header>

        <section
          className="flex flex-col gap-4"
          aria-labelledby="global-country-list-title">
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2
                id="global-country-list-title"
                className="text-lg font-semibold text-white">
                国別判定一覧
              </h2>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[78rem] border-collapse text-left text-sm">
                <thead className="bg-white/[0.04]">
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-xs font-semibold tracking-[0.18em] text-neutral-400">
                      国・地域
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-[0.18em] text-neutral-400">
                      煽りOK
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-[0.18em] text-neutral-400">
                      タイムゾーン
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-[0.18em] text-neutral-400">
                      明日
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-[0.18em] text-neutral-400">
                      月曜
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-[0.18em] text-neutral-400">
                      祝日
                    </th>
                  </tr>
                </thead>

                <tbody className={isLoading ? 'opacity-60' : ''}>
                  {countries.map(country => (
                    <tr
                      key={country.code}
                      className="border-b border-white/10 align-middle last:border-b-0"
                      data-status={country.status}
                      data-teasable={country.canTeaseOmaera}>
                      <td className="px-4 py-3">
                        <div className="flex min-w-[14rem] items-center gap-3">
                          <span className="text-lg leading-none" aria-hidden="true">
                            {getFlagEmoji(country.code)}
                          </span>
                          <div className="flex min-w-0 items-baseline gap-2">
                            <span className="truncate text-base font-semibold text-white">
                              {country.label}
                            </span>
                            <span className="shrink-0 text-xs font-medium tracking-[0.16em] text-neutral-500">
                              {country.code}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={
                            country.canTeaseOmaera
                              ? 'inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/15 px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.14em] text-emerald-200'
                              : 'inline-flex rounded-full border border-rose-400/30 bg-rose-400/15 px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.14em] text-rose-200'
                          }>
                          {country.canTeaseOmaera ? 'OK' : 'NG'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {country.timeZone}
                      </td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap text-neutral-100">
                        {country.tomorrowIsoDate}
                      </td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap text-neutral-100">
                        {country.isTomorrowMonday ? 'はい' : 'いいえ'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col font-medium whitespace-nowrap text-neutral-100">
                          <span>{country.isShukujitsu ? 'はい' : 'いいえ'}</span>
                          {country.isShukujitsu && country.holiday?.name ? (
                            <span className="text-[11px] font-medium text-neutral-500">
                              {country.holiday.name}
                            </span>
                          ) : null}
                          {country.errorMessage ? (
                            <span className="text-xs font-medium text-rose-200">
                              {country.errorMessage}
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!countries.length && isLoading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-sm text-neutral-400">
                        読み込み中...
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
