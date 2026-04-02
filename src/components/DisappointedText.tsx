import PanelTitle from '@/components/PanelTitle';
import type { MondayDisplayMode } from '@/hooks/useMonday';

interface DisappointedTextProps {
  mode: Exclude<MondayDisplayMode, 'teasing'>;
}

function getDisappointedCopy({ mode }: DisappointedTextProps) {
  if (mode === 'holiday') {
    return {
      bottomLine: '祝日',
      finalLine: 'なんだって...',
      srText: 'あしたは祝日...',
      topLine: 'あしたは',
    };
  }

  if (mode === 'override-off') {
    return {
      bottomLine: '月曜日',
      finalLine: 'だけど...',
      srText: 'あしたは月曜日だけど...',
      topLine: 'あしたは',
    };
  }

  return {
    bottomLine: '月曜日',
    finalLine: 'じゃない...',
    srText: 'あしたは月曜日じゃない...',
    topLine: 'あしたは',
  };
}

export default function DisappointedText({ mode }: DisappointedTextProps) {
  const copy = getDisappointedCopy({ mode });

  return (
    <main className="fixed inset-0 overflow-hidden">
      <PanelTitle
        frameClassName="px-2 sm:px-3"
        srText={copy.srText}
        stackClassName="w-fit max-w-[92vw] gap-[clamp(0.4rem,1.7vh,1.25rem)] italic"
        tone="gray"
        lines={[
          {
            id: 'top',
            text: copy.topLine,
            className:
              'text-[clamp(2.9rem,min(11.5vw,8.8vh),5.4rem)] leading-[0.9] tracking-[-0.04em]',
          },
          {
            id: 'middle',
            text: copy.bottomLine,
            className:
              'text-[clamp(3.95rem,min(15.8vw,12vh),7.45rem)] leading-[0.82] tracking-[-0.06em]',
          },
          {
            id: 'bottom',
            text: copy.finalLine,
            className:
              'text-[clamp(1.55rem,min(6.4vw,4.8vh),3.05rem)] leading-[0.84] tracking-[-0.032em]',
          },
        ]}
      />
    </main>
  );
}
