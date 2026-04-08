import { ReactNode } from 'react';

import { MondayProvider } from '@/hooks/useMonday';

export interface ProvidersProps {
  children: ReactNode;
  forceTeasing?: boolean;
}

export default function Providers({
  children,
  forceTeasing = false,
}: ProvidersProps) {
  return (
    <MondayProvider forceTeasing={forceTeasing}>{children}</MondayProvider>
  );
}
