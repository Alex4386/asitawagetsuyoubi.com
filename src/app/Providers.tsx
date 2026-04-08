import { ReactNode } from 'react';

import { MondayProvider } from '@/hooks/useMonday';

export interface ProvidersProps {
  children: ReactNode;
  initialTeaseOmaeraOverride?: boolean | null;
}

export default function Providers({
  children,
  initialTeaseOmaeraOverride = null,
}: ProvidersProps) {
  return (
    <MondayProvider initialTeaseOmaeraOverride={initialTeaseOmaeraOverride}>
      {children}
    </MondayProvider>
  );
}
