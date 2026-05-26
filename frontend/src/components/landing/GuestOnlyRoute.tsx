import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { getAppEntryPath, hasActiveSession } from '@/lib/session';

/** Login/signup pages — bounce signed-in users to the app. */
export function GuestOnlyRoute({ children }: { children: ReactNode }) {
  if (hasActiveSession()) {
    return <Navigate to={getAppEntryPath()} replace />;
  }
  return <>{children}</>;
}
