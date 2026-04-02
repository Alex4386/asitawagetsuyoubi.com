'use client';

import Script from 'next/script';

import { useMonday } from '@/hooks/useMonday';
import './global.css';

const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

const clarityBootstrap = clarityProjectId
  ? `
      (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", ${JSON.stringify(
        clarityProjectId,
      )});
    `
  : null;

export default function RootWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const monday = useMonday();

  return (
    <html
      lang="ja"
      style={{
        backgroundColor: monday.canTeaseOmaera
          ? 'var(--panel-background)'
          : 'var(--panel-background-not-monday)',
      }}>
      <body>
        {children}
        {clarityBootstrap ? (
          <Script id="microsoft-clarity" strategy="afterInteractive">
            {clarityBootstrap}
          </Script>
        ) : null}
      </body>
    </html>
  );
}
