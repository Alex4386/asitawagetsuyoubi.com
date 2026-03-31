import PanelBeamCanvas from '@/components/PanelBeamCanvas';
import PanelSparkleField from '@/components/PanelSparkleField';
import styles from '@/components/PanelSurface.module.css';
import PanelTextOverlay from '@/components/PanelTextOverlay';

export default function PanelSurface() {
  return (
    <section className={styles.surface}>
      <PanelBeamCanvas className={styles.beamLayer} />
      <div className={styles.bottomTarget} />
      <div className={styles.texture} />
      <div className={styles.vignette} />
      <PanelSparkleField className={styles.sparkle} />
      <PanelTextOverlay />
    </section>
  );
}
