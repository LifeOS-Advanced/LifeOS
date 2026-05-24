import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ConfirmProvider } from '@/components/app/patterns';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/app/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import { AppLayout } from './components/app/AppLayout';
import Dashboard from './pages/app/Dashboard';
import Tasks from './pages/app/Tasks';
import Habits from './pages/app/Habits';
import Goals from './pages/app/Goals';
import Notes from './pages/app/Notes';
import Focus from './pages/app/Focus';
import Settings from './pages/app/Settings';
import Review from './pages/app/Review';
import CalendarPage from './pages/app/Calendar';
import Insights from './pages/app/Insights';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        const statusCode = (error as { statusCode?: number })?.statusCode;
        if (statusCode && [401, 403, 404].includes(statusCode)) return false;
        return failureCount < 2;
      },
      staleTime: 30_000,
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
              {/* AuthProvider must be inside BrowserRouter so it can call useNavigate */}
              <AuthProvider>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/onboarding" element={<Onboarding />} />

                  {/* All /app routes require authentication */}
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
                    <Route path="notes" element={<Notes />} />
                    <Route path="focus" element={<Focus />} />
                    <Route path="review" element={<Review />} />
                    <Route path="calendar" element={<CalendarPage />} />
                    <Route path="insights" element={<Insights />} />
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