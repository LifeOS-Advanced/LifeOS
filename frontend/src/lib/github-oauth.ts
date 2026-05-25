const GITHUB_STATE_KEY = 'github_oauth_state';

/** Start GitHub OAuth — stores CSRF state and redirects to GitHub. */
export function startGitHubOAuth(): boolean {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
  if (!clientId) return false;

  const state = crypto.randomUUID();
  sessionStorage.setItem(GITHUB_STATE_KEY, state);
  sessionStorage.removeItem('github_oauth_exchanged');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${window.location.origin}/auth/github/callback`,
    scope: 'read:user user:email',
    state,
  });
  window.location.href = `https://github.com/login/oauth/authorize?${params}`;
  return true;
}
