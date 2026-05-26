import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '@/lib/store';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

/**
 * Redirects unauthenticated users to /login, preserving the intended
 * destination so they can be sent back after a successful sign-in.
 */
export default function ProtectedRoute({ children }: Props) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
