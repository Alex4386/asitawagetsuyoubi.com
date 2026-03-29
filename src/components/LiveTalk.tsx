'use client';

interface LiveTalkProps {
  phone: string;
  message: string;
}

export default function LiveTalk({ phone, message }: LiveTalkProps) {
  return (
    <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white shadow-[0_0_1.4rem_rgba(255,255,255,0.14)] backdrop-blur-sm">
      <span className="mr-2 font-semibold text-white/80">{phone}</span>
      <span>{message}</span>
    </div>
  );
}
