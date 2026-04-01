import GoldPlatedText from '@/components/GoldPlatedText';
import GrayPlatedText from '@/components/GrayPlatedText';

type PanelTitleTone = 'gold' | 'gray';

interface PanelTitleLine {
  className?: string;
  id: string;
  text: string;
}

interface PanelTitleProps {
  frameClassName?: string;
  srText: string;
  lines: PanelTitleLine[];
  stackClassName?: string;
  tone: PanelTitleTone;
}

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

export default function PanelTitle({
  frameClassName,
  srText,
  lines,
  stackClassName,
  tone,
}: PanelTitleProps) {
  const TextComponent = tone === 'gold' ? GoldPlatedText : GrayPlatedText;

  return (
    <div
      className={joinClassNames(
        'pointer-events-none absolute inset-0 z-[4] flex items-center justify-center overflow-hidden px-4 sm:px-6',
        frameClassName,
      )}>
      <h1 className="sr-only">{srText}</h1>

      <div
        className={joinClassNames(
          'flex w-full flex-col items-center justify-center text-center',
          stackClassName,
        )}
        aria-hidden="true">
        {lines.map(line => (
          <TextComponent
            key={line.id}
            as="span"
            className={joinClassNames(
              'block whitespace-nowrap',
              line.className,
            )}>
            {line.text}
          </TextComponent>
        ))}
      </div>
    </div>
  );
}
