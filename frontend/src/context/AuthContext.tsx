import { createContext, useContext, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, storeToken, clearToken } from '@/lib/api';
import { trackLoopEvent } from '@/lib/analytics';
import { setAuthenticated, setProfile, isOnboarded, setOnboarded } from '@/lib/store';
import { DEFAULT_PREFERENCES, type UserProfile } from '@/lib/types';

// ── Types ─────────────────────────────────────────────────────
interface AuthUser {
  name: string;
  email: string;
  lifestyleMode?: UserProfile['lifestyleMode'];
  enabledModules?: UserProfile['enabledModules'];
  theme?: UserProfile['theme'];
  preferences?: UserProfile['preferences'];
}

interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

interface AuthContextType {
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (accessToken: string) => Promise<void>;
  loginWithGitHub: (code: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ── Provider ──────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  /** Shared post-login setup: persist token + profile, then navigate. */
  function handleSuccess(data: AuthResponse) {
    storeToken(data.accessToken);
    setAuthenticated(true);

    if (data.user) {
      const preferences = {
        ...DEFAULT_PREFERENCES,
        ...(data.user.preferences ?? {}),
        notifications: {
          ...DEFAULT_PREFERENCES.notifications,
          ...(data.user.preferences?.notifications ?? {}),
        },
      };
      setProfile({
        name:            data.user.name,
        email:           data.user.email,
        lifestyleMode:   data.user.lifestyleMode  ?? 'personal-growth',
        enabledModules:  data.user.enabledModules ?? ['tasks', 'habits', 'goals', 'notes', 'focus'],
        theme:           data.user.theme          ?? 'light',
        preferences,
      });
    }

    // First-time users go through onboarding; returning users go to the app.
    navigate(isOnboarded() ? '/app' : '/onboarding', { replace: true });
  }

  async function login(email: string, password: string) {
    const data = await api.post<AuthResponse>('/api/auth/login', { email, password });
    handleSuccess(data);
  }

  async function register(name: string, email: string, password: string) {
    const data = await api.post<AuthResponse>('/api/auth/register', { name, email, password });
    setOnboarded(false);
    handleSuccess(data);
    trackLoopEvent('signup_completed', { method: 'email' });
  }

  async function loginWithGoogle(accessToken: string) {
    const data = await api.post<AuthResponse>('/api/auth/google', { accessToken });
    handleSuccess(data);
  }

  async function loginWithGitHub(code: string) {
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    const data = await api.post<AuthResponse>('/api/auth/github', { code, redirectUri });
    handleSuccess(data);
  }

  async function logout() {
    // Best-effort server-side revocation (clears the httpOnly refresh cookie).
    try {
      await api.post('/api/auth/logout');
    } catch { /* ignore – clear local state regardless */ }

    clearToken();
    setAuthenticated(false);
    navigate('/', { replace: true });
  }

  return (
    <AuthContext.Provider value={{ register, login, loginWithGoogle, loginWithGitHub, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be called inside <AuthProvider>');
  return ctx;
}
