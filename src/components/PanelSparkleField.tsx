import type { CSSProperties } from 'react';

import {
  PANEL_SPARKLE_SEEDS,
  type PanelSparkleSeed,
} from '@/components/panel.theme';

type SparkleFieldStyle = CSSProperties & {
  '--sparkle-top'?: string;
  '--sparkle-left'?: string;
  '--sparkle-size'?: string;
  '--sparkle-delay'?: string;
};

interface PanelSparkleFieldProps {
  className: string;
  sparkles?: readonly PanelSparkleSeed[];
}

export default function PanelSparkleField({
  className,
  sparkles = PANEL_SPARKLE_SEEDS,
}: PanelSparkleFieldProps) {
  return (
    <>
      {sparkles.map(({ top, left, size, delay }) => (
        <span
          key={`${top}-${left}`}
          className={className}
          aria-hidden="true"
          style={
            {
              '--sparkle-top': top,
              '--sparkle-left': left,
              '--sparkle-size': size,
              '--sparkle-delay': delay,
            } as SparkleFieldStyle
          }
        />
      ))}
    </>
  );
}
