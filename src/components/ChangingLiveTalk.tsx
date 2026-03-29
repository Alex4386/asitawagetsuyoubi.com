'use client';

import LiveTalk from '@/components/LiveTalk';
import LiveChatData from '@/data/LiveChatData';
import { useEffect, useState } from 'react';

export default function ChangingLiveTalk() {
  const [liveChatIdx, setLiveChatIdx] = useState<number>(0);

  useEffect(() => {
    const intervalId = setInterval(
      () => setLiveChatIdx(prevIdx => (prevIdx + 1) % LiveChatData.length),
      5000,
    );

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <LiveTalk
      phone={LiveChatData[liveChatIdx].phone}
      message={LiveChatData[liveChatIdx].message}
    />
  );
}
