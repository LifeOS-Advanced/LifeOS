import { getToken } from './api';
import { isAuthenticated, isOnboarded } from './store';

/** User has a local session that can access the API. */
export function hasActiveSession() {
  return isAuthenticated() && !!getToken();
}

/** Where signed-in users should land. */
export function getAppEntryPath() {
  return isOnboarded() ? '/app' : '/onboarding';
}
