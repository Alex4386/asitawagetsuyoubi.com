import type { CSSProperties } from 'react';

type PanelRootCssVariableName =
  | '--panel-page-background-color'
  | '--panel-page-background-gradient'
  | '--panel-text-gradient'
  | '--panel-text-shadow';

type PanelRootCssVariables = CSSProperties &
  Record<PanelRootCssVariableName, string> &
  Record<`--panel-page-stop-${number}`, string>;

export interface PanelGradientStop {
  offset: number;
  position: `${number}%`;
  color: string;
}

export interface PanelPageGradientStop extends PanelGradientStop {
  cssVariable: `--panel-page-stop-${number}`;
}

export interface PanelSparkleSeed {
  top: string;
  left: string;
  size: string;
  delay: string;
}

export const PANEL_PAGE_GRADIENT_STOPS: readonly PanelPageGradientStop[] = [
  {
    offset: 0,
    position: '0%',
    color: '#ffe66a',
    cssVariable: '--panel-page-stop-0',
  },
  {
    offset: 0.18,
    position: '18%',
    color: '#ffdd28',
    cssVariable: '--panel-page-stop-1',
  },
  {
    offset: 0.48,
    position: '48%',
    color: '#ffd000',
    cssVariable: '--panel-page-stop-2',
  },
  {
    offset: 0.78,
    position: '78%',
    color: '#efb100',
    cssVariable: '--panel-page-stop-3',
  },
  {
    offset: 1,
    position: '100%',
    color: '#d88b00',
    cssVariable: '--panel-page-stop-4',
  },
] as const;

export const PANEL_TEXT_GRADIENT_STOPS: readonly PanelGradientStop[] = [
  { offset: 0, position: '0%', color: '#865000' },
  { offset: 0.26, position: '26%', color: '#b87806' },
  { offset: 0.52, position: '52%', color: '#d79d12' },
  { offset: 0.72, position: '72%', color: '#f3cd4c' },
  { offset: 0.82, position: '82%', color: '#ffde24' },
  { offset: 1, position: '100%', color: '#d7a11a' },
] as const;

export const PANEL_TEXT_SHADOW =
  'drop-shadow(0 0 0.07em rgba(255, 255, 248, 0.98)) drop-shadow(0 0 0.2em rgba(255, 244, 168, 0.58)) drop-shadow(0.028em 0.04em 0 #daa11e) drop-shadow(0.06em 0.085em 0 #925100)';

export const PANEL_SPARKLE_SEEDS: readonly PanelSparkleSeed[] = [
  { top: '11%', left: '13%', size: '1.2rem', delay: '0.1s' },
  { top: '22%', left: '26%', size: '1rem', delay: '1.4s' },
  { top: '14%', left: '72%', size: '0.95rem', delay: '0.6s' },
  { top: '27%', left: '86%', size: '1.4rem', delay: '2.2s' },
  { top: '48%', left: '12%', size: '1.1rem', delay: '1.7s' },
  { top: '42%', left: '82%', size: '1rem', delay: '0.2s' },
  { top: '71%', left: '22%', size: '1.2rem', delay: '2.7s' },
  { top: '78%', left: '74%', size: '0.95rem', delay: '1.2s' },
] as const;

function buildLinearGradient<T extends PanelGradientStop>(
  direction: string,
  stops: readonly T[],
  resolveColor: (stop: T) => string,
) {
  return `linear-gradient(${direction}, ${stops
    .map(stop => `${resolveColor(stop)} ${stop.position}`)
    .join(', ')})`;
}

function buildPageGradientCssValue(stops: readonly PanelPageGradientStop[]) {
  return buildLinearGradient(
    'to bottom',
    stops,
    stop => `var(${stop.cssVariable})`,
  );
}

export const PANEL_ROOT_CSS_VARIABLES = {
  ...Object.fromEntries(
    PANEL_PAGE_GRADIENT_STOPS.map(stop => [stop.cssVariable, stop.color]),
  ),
  '--panel-page-background-color': PANEL_PAGE_GRADIENT_STOPS[0].color,
  '--panel-page-background-gradient': buildPageGradientCssValue(
    PANEL_PAGE_GRADIENT_STOPS,
  ),
  '--panel-text-gradient': buildLinearGradient(
    '180deg',
    PANEL_TEXT_GRADIENT_STOPS,
    stop => stop.color,
  ),
  '--panel-text-shadow': PANEL_TEXT_SHADOW,
} satisfies PanelRootCssVariables;
