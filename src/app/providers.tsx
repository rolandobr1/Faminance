
'use client';

import { AuthProvider } from '@/context/auth-context';
import { FamilyDataProvider } from '@/context/family-data-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <FamilyDataProvider>
        {children}
      </FamilyDataProvider>
    </AuthProvider>
  );
}

    