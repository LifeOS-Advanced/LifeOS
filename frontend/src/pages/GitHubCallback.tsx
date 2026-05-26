import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';

const GITHUB_STATE_KEY = 'github_oauth_state';
const GITHUB_EXCHANGE_KEY = 'github_oauth_exchanged';

export default function GitHubCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithGitHub } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const code = searchParams.get('code');
    const oauthError = searchParams.get('error');
    const state = searchParams.get('state');
    const savedState = sessionStorage.getItem(GITHUB_STATE_KEY);

    if (oauthError) {
      setError('GitHub sign-in was cancelled or denied.');
      return;
    }
    if (!code) {
      setError('Missing authorization code from GitHub.');
      return;
    }
    if (!savedState || state !== savedState) {
      setError('Invalid OAuth state. Please try signing in again.');
      return;
    }
    if (sessionStorage.getItem(GITHUB_EXCHANGE_KEY) === code) {
      return;
    }

    sessionStorage.removeItem(GITHUB_STATE_KEY);

    (async () => {
      try {
        await loginWithGitHub(code);
        sessionStorage.setItem(GITHUB_EXCHANGE_KEY, code);
      } catch (err) {
        let msg = err instanceof ApiError ? err.message : 'GitHub sign-in failed';
        if (err instanceof ApiError && err.statusCode === 503) {
          msg = 'GitHub sign-in is not configured on the server. Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to backend/.env (restart the API), and use the same Client ID as VITE_GITHUB_CLIENT_ID.';
        } else if (err instanceof ApiError && err.statusCode === 404) {
          msg = 'Auth API not found. Check VITE_API_URL points to your backend (e.g. http://localhost:5000) and that the API is running.';
        }
        setError(msg);
      }
    })();
    // Intentionally run once on mount — do not depend on loginWithGitHub (unstable reference).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-sm text-destructive text-center max-w-md">{error}</p>
        <Button onClick={() => navigate('/login', { replace: true })}>Back to login</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Completing GitHub sign-in…</p>
      <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground">Cancel</Link>
    </div>
  );
}
