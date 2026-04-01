import { ReactNode } from 'react';

import { MondayProvider } from '@/hooks/useMonday';

export interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return <MondayProvider>{children}</MondayProvider>;
}
