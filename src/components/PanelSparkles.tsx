import { PANEL_SPARKLE_CLASSES } from '@/components/panel.constants';

export default function PanelSparkles() {
  return (
    <>
      {PANEL_SPARKLE_CLASSES.map(className => (
        <span
          key={className}
          className={`panel-sparkle ${className}`}
          aria-hidden="true"
        />
      ))}
    </>
  );
}
