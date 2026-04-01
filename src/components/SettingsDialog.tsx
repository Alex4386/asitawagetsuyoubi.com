'use client';

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
import { cn } from '@/lib/utils';
import { SettingsIcon } from 'lucide-react';

function StatusRow({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <span className="text-sm text-neutral-200">{label}</span>
      <span
        className={cn(
          'rounded-full px-2 py-0.5 text-xs font-medium',
          active
            ? 'bg-emerald-400/15 text-emerald-200'
            : 'bg-white/8 text-neutral-400',
        )}>
        {active ? '有効' : '無効'}
      </span>
    </div>
  );
}

function optionButtonClass(active: boolean) {
  return cn(
    'h-11 rounded-xl border text-sm font-semibold transition-colors',
    active
      ? 'border-white bg-white text-neutral-950 hover:bg-neutral-200'
      : 'border-white/16 bg-white/[0.03] text-neutral-100 hover:bg-white/[0.08]',
  );
}

export default function SettingsDialog() {
  const {
    canTeaseOmaera,
    isLoading,
    isShukujitsu,
    isTomorrowMonday,
    setShukujitsu,
    setTeaseOmaeraOverride,
    setTomorrowMonday,
    teaseOmaeraOverride,
  } = useMonday();

  return (
    <div className="fixed right-4 top-4 z-[60] sm:right-6 sm:top-6">
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
          <DialogHeader>
            <DialogTitle>設定</DialogTitle>
            <DialogDescription>
              現在の表示状態を確認したり、表示内容を試したりできます。
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-5">
            <section className="space-y-2">
              <h3 className="text-xs font-semibold tracking-[0.12em] text-neutral-500">
                現在の表示
              </h3>
              <div className="space-y-2">
                <StatusRow label="あしたは月曜日" active={isTomorrowMonday} />
                <StatusRow label="あしたは祝日" active={isShukujitsu} />
                <StatusRow label="月曜日表示" active={canTeaseOmaera} />
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-semibold tracking-[0.12em] text-neutral-500">
                表示オプション
              </h3>
              <div className="grid gap-2 sm:grid-cols-3">
                <Button
                  className={optionButtonClass(teaseOmaeraOverride === null)}
                  variant="outline"
                  onClick={() => setTeaseOmaeraOverride(null)}>
                  自動
                </Button>
                <Button
                  className={optionButtonClass(teaseOmaeraOverride === true)}
                  variant="outline"
                  onClick={() => setTeaseOmaeraOverride(true)}>
                  表示する
                </Button>
                <Button
                  className={optionButtonClass(teaseOmaeraOverride === false)}
                  variant="outline"
                  onClick={() => setTeaseOmaeraOverride(false)}>
                  表示しない
                </Button>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-semibold tracking-[0.12em] text-neutral-500">
                動作確認
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  className={optionButtonClass(isTomorrowMonday)}
                  variant="outline"
                  onClick={() => setTomorrowMonday(prev => !prev)}>
                  月曜日として表示
                </Button>
                <Button
                  className={optionButtonClass(isShukujitsu)}
                  variant="outline"
                  onClick={() => setShukujitsu(prev => !prev)}>
                  祝日として表示
                </Button>
              </div>
            </section>
          </div>

          <DialogFooter>
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
