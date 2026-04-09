import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import './global.css';

export const metadata: Metadata = {
  title: 'あしたは月曜日',
  description: 'だってあしたは月曜日だもん、やったね！ククククwww',
  openGraph: {
    type: 'article',
    title: 'あしたは月曜日',
    description: 'だってあしたは月曜日だもん、やったね！ククククwww',
    images: [
      {
        type: 'image/png',
        url: 'https://asitawagetsuyoubi.com/opengraph.png',
      },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#dba00b',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
