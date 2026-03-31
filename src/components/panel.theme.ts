export interface PanelGradientStop {
  offset: number;
  position: `${number}%`;
  color: string;
}

export interface PanelPageGradientStop extends PanelGradientStop {
  cssVariable: `--panel-page-stop-${number}`;
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
