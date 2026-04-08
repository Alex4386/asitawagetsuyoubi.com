'use client';

import Link from 'next/link';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useMonday } from '@/hooks/useMonday';
import { COUNTRY_OPTIONS } from '@/lib/asitawagetsuyoubi';
import { cn } from '@/lib/utils';
import { GlobeIcon, SettingsIcon } from 'lucide-react';

type StatusRowMode = 'boolean' | 'ok-ng';

function StatusRow({
  active,
  label,
  mode = 'boolean',
}: {
  active: boolean;
  label: string;
  mode?: StatusRowMode;
}) {
  const activeLabel = mode === 'ok-ng' ? 'OK' : 'True';
  const inactiveLabel = mode === 'ok-ng' ? 'NG' : 'False';

  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <span className="text-sm text-neutral-200">{label}</span>
      <span
        className={cn(
          'rounded-full px-2 py-0.5 text-xs font-medium',
          active ? 'bg-active text-neutral-950' : 'bg-white/8 text-neutral-400',
        )}>
        {active ? activeLabel : inactiveLabel}
      </span>
    </div>
  );
}

function DebugInfoRow({
  label,
  value,
  subvalue,
}: {
  label: string;
  value: string;
  subvalue?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm text-neutral-200">{label}</span>
        <span className="text-right text-sm font-medium text-neutral-100">
          {value}
        </span>
      </div>
      {subvalue ? (
        <p className="mt-1 text-right text-xs leading-5 text-neutral-500">
          {subvalue}
        </p>
      ) : null}
    </div>
  );
}

function optionButtonClass(active: boolean) {
  return cn(
    'h-auto min-h-[3rem] justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold whitespace-normal transition-colors',
    active
      ? 'border-active bg-active text-neutral-950 hover:brightness-95'
      : 'border-white/16 bg-[#151515] text-neutral-100 hover:bg-[#1b1b1b]',
  );
}

function OptionButton({
  active,
  children,
  activeLabel,
  inactiveLabel,
  onClick,
}: {
  active: boolean;
  children: string;
  activeLabel: string;
  inactiveLabel: string;
  onClick: () => void;
}) {
  return (
    <Button
      aria-pressed={active}
      className={optionButtonClass(active)}
      variant="ghost"
      onClick={onClick}>
      <span>{children}</span>
      <span
        className={cn(
          'rounded-full px-2 py-1 text-[0.65rem] font-bold leading-none tracking-[0.12em]',
          active
            ? 'bg-black/10 text-neutral-950/80'
            : 'bg-white/6 text-neutral-400',
        )}>
        {active ? activeLabel : inactiveLabel}
      </span>
    </Button>
  );
}

export default function SettingsDialog() {
  const {
    canTeaseOmaera,
    country,
    isLoading,
    nextHoliday,
    isShukujitsu,
    isTomorrowMonday,
    setCountry,
    setSpecificDateTime,
    setShukujitsu,
    setTeaseOmaeraOverride,
    setTomorrowMonday,
    specificDateTime,
    teaseOmaeraOverride,
  } = useMonday();

  return (
    <div className="fixed right-4 top-4 z-[60] flex items-center gap-2 sm:right-6 sm:top-6 sm:gap-3">
      <Link
        href="/global"
        className={cn(
          'inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-black/30 text-white shadow-[0_0.8rem_2rem_rgba(0,0,0,0.35)] backdrop-blur-md transition-colors hover:bg-black/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
          isLoading && 'opacity-70',
        )}
        aria-label="グローバル判定を開く">
        <GlobeIcon className="h-5 w-5" />
      </Link>

      <Dialog>
        <DialogTrigger
          className={cn(
            'inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-black/30 text-white shadow-[0_0.8rem_2rem_rgba(0,0,0,0.35)] backdrop-blur-md transition-colors hover:bg-black/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
            isLoading && 'opacity-70',
          )}
          aria-label="設定を開く">
          <SettingsIcon className="h-5 w-5" />
        </DialogTrigger>

        <DialogContent className="max-w-xl">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>設定</DialogTitle>
            <DialogDescription>
              祝日を調べる国を選んだり、表示内容を試したりできます。
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 flex-1 space-y-5 overflow-y-auto px-6 pb-6">
            <section className="space-y-2">
              <h3 className="text-xs font-semibold tracking-[0.12em] text-neutral-500">
                国・地域
              </h3>
              <label className="sr-only" htmlFor="settings-country">
                祝日を調べる国・地域
              </label>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3">
                <select
                  id="settings-country"
                  value={country}
                  className="h-11 w-full appearance-none bg-transparent text-sm font-medium text-neutral-100 outline-none"
                  onChange={event => setCountry(event.target.value)}>
                  {COUNTRY_OPTIONS.map(option => (
                    <option
                      key={option.code}
                      value={option.code}
                      className="bg-neutral-950 text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs leading-5 text-neutral-500">
                明日と祝日の判定に使います。
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-semibold tracking-[0.12em] text-neutral-500">
                現在の表示
              </h3>
              <div className="flex flex-col gap-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  <StatusRow label="あしたは月曜日" active={isTomorrowMonday} />
                  <StatusRow label="あしたは祝日" active={isShukujitsu} />
                </div>
                <StatusRow label="煽りOK" active={canTeaseOmaera} mode="ok-ng" />
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-semibold tracking-[0.12em] text-neutral-500">
                表示オプション
              </h3>
              <div className="grid gap-2 sm:grid-cols-3">
                <OptionButton
                  active={teaseOmaeraOverride === null}
                  activeLabel="選択中"
                  inactiveLabel="未選択"
                  onClick={() => setTeaseOmaeraOverride(null)}>
                  自動
                </OptionButton>
                <OptionButton
                  active={teaseOmaeraOverride === true}
                  activeLabel="選択中"
                  inactiveLabel="未選択"
                  onClick={() => setTeaseOmaeraOverride(true)}>
                  表示する
                </OptionButton>
                <OptionButton
                  active={teaseOmaeraOverride === false}
                  activeLabel="選択中"
                  inactiveLabel="未選択"
                  onClick={() => setTeaseOmaeraOverride(false)}>
                  表示しない
                </OptionButton>
              </div>
            </section>

            <Accordion
              type="single"
              collapsible
              className="rounded-2xl border border-white/10 bg-white/[0.02] px-4">
              <AccordionItem value="debug" className="border-none">
                <AccordionTrigger className="py-4 text-sm font-semibold text-neutral-100 hover:no-underline">
                  デバッグ
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-5">
                    <section className="space-y-2">
                      <h3 className="text-xs font-semibold tracking-[0.12em] text-neutral-500">
                        基準日
                      </h3>
                      <div className="space-y-2">
                        <input
                          type="date"
                          value={specificDateTime}
                          className="h-12 w-full rounded-xl border border-white/10 bg-[#151515] px-3 text-sm font-medium text-neutral-100 outline-none transition-colors focus:border-white/30"
                          onChange={event =>
                            setSpecificDateTime(event.target.value)
                          }
                        />
                        <div className="flex justify-end">
                          <Button
                            className="border-white/12 bg-white/[0.03] text-neutral-100 hover:bg-white/[0.08]"
                            variant="outline"
                            onClick={() => setSpecificDateTime('')}>
                            今日に戻す
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs leading-5 text-neutral-500">
                        この設定は保存されず、この画面だけで使われます。
                      </p>
                    </section>

                    <section className="space-y-2">
                      <h3 className="text-xs font-semibold tracking-[0.12em] text-neutral-500">
                        翌日の祝日情報
                      </h3>
                      <DebugInfoRow
                        label="判定結果"
                        value={nextHoliday ? nextHoliday.name : '該当なし'}
                        subvalue={nextHoliday ? nextHoliday.date : undefined}
                      />
                    </section>

                    <section className="space-y-2">
                      <h3 className="text-xs font-semibold tracking-[0.12em] text-neutral-500">
                        動作確認
                      </h3>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <OptionButton
                          active={isTomorrowMonday}
                          activeLabel="有効"
                          inactiveLabel="無効"
                          onClick={() => setTomorrowMonday(prev => !prev)}>
                          月曜日として表示
                        </OptionButton>
                        <OptionButton
                          active={isShukujitsu}
                          activeLabel="有効"
                          inactiveLabel="無効"
                          onClick={() => setShukujitsu(prev => !prev)}>
                          祝日として表示
                        </OptionButton>
                      </div>
                    </section>

                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <section className="space-y-2">
              <h3 className="text-xs font-semibold tracking-[0.12em] text-neutral-500">
                謝辞
              </h3>
              <Link
                href="/credits"
                className="inline-flex text-sm text-neutral-300 underline underline-offset-4 transition-colors hover:text-white">
                クレジット
              </Link>
            </section>
          </div>

          <DialogFooter className="mt-0 shrink-0 px-6 pb-6 pt-4">
            <DialogClose className="w-full sm:w-auto">
              <Button
                className="w-full border-white/12 bg-white/8 text-white hover:bg-white/14 sm:w-auto"
                variant="outline">
                閉じる
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
