import './global.css';

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import Providers from '@/app/Providers';

export const metadata: Metadata = {
  title: 'あしたは月曜日',
  description: 'だってあしたは月曜日だもん、やったね！ククククwww',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <style>{`
          /* I really didn't have choices here */
          html {
            background-color: var(--panel-background-not-monday, #494949);
          }

          html.monday {
            background-color: var(--panel-background, #dba00b);
          }
        `}</style>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
