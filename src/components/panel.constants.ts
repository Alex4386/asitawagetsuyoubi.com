export type PanelCopyMode = 'tomorrow-monday' | 'today-monday';

const PANEL_COPY = {
  'tomorrow-monday': {
    bottomLine: '月曜日',
    srText: 'あしたは 月曜日',
    topLine: 'あしたは',
  },
  'today-monday': {
    bottomLine: '月曜日',
    srText: 'きょうは 月曜日',
    topLine: 'きょうは',
  },
} as const;

export const DEFAULT_PANEL_COPY_MODE = 'tomorrow-monday' as const;

export function getPanelCopy(mode: PanelCopyMode = DEFAULT_PANEL_COPY_MODE) {
  return PANEL_COPY[mode];
}

export const PANEL_SPARKLE_CLASSES = [
  'panel-sparkle-1',
  'panel-sparkle-2',
  'panel-sparkle-3',
  'panel-sparkle-4',
  'panel-sparkle-5',
  'panel-sparkle-6',
  'panel-sparkle-7',
  'panel-sparkle-8',
] as const;
