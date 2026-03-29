import type { CSSProperties } from 'react';

import PanelBeamCanvas from '@/components/PanelBeamCanvas';
import styles from '@/components/PanelSurface.module.css';
import PanelTextOverlay from '@/components/PanelTextOverlay';

const sparkles = [
  { top: '11%', left: '13%', size: '1.2rem', delay: '0.1s' },
  { top: '22%', left: '26%', size: '1rem', delay: '1.4s' },
  { top: '14%', left: '72%', size: '0.95rem', delay: '0.6s' },
  { top: '27%', left: '86%', size: '1.4rem', delay: '2.2s' },
  { top: '48%', left: '12%', size: '1.1rem', delay: '1.7s' },
  { top: '42%', left: '82%', size: '1rem', delay: '0.2s' },
  { top: '71%', left: '22%', size: '1.2rem', delay: '2.7s' },
  { top: '78%', left: '74%', size: '0.95rem', delay: '1.2s' },
];

export default function PanelSurface() {
  return (
    <section className={styles.surface}>
      <PanelBeamCanvas className={styles.beamLayer} />
      <div className={styles.texture} />
      <div className={styles.vignette} />

      {sparkles.map(({ top, left, size, delay }) => (
        <span
          key={`${top}-${left}`}
          className={styles.sparkle}
          style={
            {
              '--sparkle-top': top,
              '--sparkle-left': left,
              '--sparkle-size': size,
              '--sparkle-delay': delay,
            } as CSSProperties
          }
        />
      ))}
      <PanelTextOverlay />
    </section>
  );
}
