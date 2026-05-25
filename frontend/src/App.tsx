import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ConfirmProvider } from '@/components/app/patterns';
import { RouteErrorBoundary } from '@/components/app/RouteErrorBoundary';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/app/ProtectedRoute';
import { AppLayout } from './components/app/AppLayout';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import GitHubCallback from './pages/GitHubCallback';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/app/Dashboard';
import Tasks from './pages/app/Tasks';
import Habits from './pages/app/Habits';
import Goals from './pages/app/Goals';
import Focus from './pages/app/Focus';
import Settings from './pages/app/Settings';
import DailyStartPage from './pages/app/DailyStart';
import EveningShutdownPage from './pages/app/EveningShutdown';
import ProgressPage from './pages/app/Progress';
import NotFound from './pages/NotFound';

const Notes = lazy(() => import('./pages/app/Notes'));
const CalendarPage = lazy(() => import('./pages/app/Calendar'));
const Insights = lazy(() => import('./pages/app/Insights'));
const Review = lazy(() => import('./pages/app/Review'));

const PageFallback = () => (
  <div className="max-w-4xl mx-auto py-12 animate-pulse space-y-4">
    <div className="h-8 w-48 bg-secondary rounded" />
    <div className="h-64 bg-secondary rounded-xl" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        const statusCode = (error as { statusCode?: number })?.statusCode;
        if (statusCode && [401, 403, 404].includes(statusCode)) return false;
        return failureCount < 2;
      },
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ConfirmProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/auth/github/callback" element={<GitHubCallback />} />
                  <Route path="/onboarding" element={<Onboarding />} />

                  <Route
                    path="/app"
                    element={
                      <ProtectedRoute>
                        <AppLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Dashboard />} />
                    <Route path="tasks" element={<Tasks />} />
                    <Route path="habits" element={<Habits />} />
                    <Route path="goals" element={<Goals />} />
                    <Route path="focus" element={<Focus />} />
                    <Route
                      path="notes"
                      element={
                        <RouteErrorBoundary>
                          <Suspense fallback={<PageFallback />}>
                            <Notes />
                          </Suspense>
                        </RouteErrorBoundary>
                      }
                    />
                    <Route
                      path="review"
                      element={
                        <RouteErrorBoundary>
                          <Suspense fallback={<PageFallback />}>
                            <Review />
                          </Suspense>
                        </RouteErrorBoundary>
                      }
                    />
                    <Route
                      path="calendar"
                      element={
                        <RouteErrorBoundary>
                          <Suspense fallback={<PageFallback />}>
                            <CalendarPage />
                          </Suspense>
                        </RouteErrorBoundary>
                      }
                    />
                    <Route
                      path="insights"
                      element={
                        <RouteErrorBoundary>
                          <Suspense fallback={<PageFallback />}>
                            <Insights />
                          </Suspense>
                        </RouteErrorBoundary>
                      }
                    />
                    <Route path="progress" element={<ProgressPage />} />
                    <Route path="daily-start" element={<DailyStartPage />} />
                    <Route path="evening-shutdown" element={<EveningShutdownPage />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AuthProvider>
            </BrowserRouter>
          </ConfirmProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
