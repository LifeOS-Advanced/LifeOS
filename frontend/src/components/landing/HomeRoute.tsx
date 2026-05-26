import { Navigate } from 'react-router-dom';
import { getAppEntryPath, hasActiveSession } from '@/lib/session';
import Landing from '@/pages/Landing';

/**
 * Root route: signed-in users go straight to the app; everyone else sees marketing.
 */
export function HomeRoute() {
  if (hasActiveSession()) {
    return <Navigate to={getAppEntryPath()} replace />;
  }
  return <Landing />;
}
