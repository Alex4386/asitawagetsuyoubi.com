import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import Providers from '@/app/Providers';
import { cn } from "@/lib/utils";
import RootWrapper from './wrapper';

export const metadata: Metadata = {
  title: 'あしたは月曜日',
  description: 'だってあしたは月曜日だもん、やったね！ククククwww',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#dba00b',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <RootWrapper>
        {children}
      </RootWrapper>  
    </Providers>
    
  );
}
