/** Routes. Everything inside <AppShell> requires a signed-in user. */
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AgentsProvider } from '@/context/AgentsContext';
import { StatusProvider } from '@/context/StatusContext';
import { AppShell } from '@/components/layout/AppShell';
import { Loading } from '@/components/ui/States';
import { AuthPage } from '@/pages/AuthPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ChatPage } from '@/pages/ChatPage';
import { CustomAgentPage } from '@/pages/CustomAgentPage';
import { ExpensesPage } from '@/pages/ExpensesPage';
import { HealthPage } from '@/pages/HealthPage';
import { InvestmentsPage } from '@/pages/InvestmentsPage';
import { SubscriptionsPage } from '@/pages/SubscriptionsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AdminPage } from '@/pages/AdminPage';

export default function App() {
  return (
    <StatusProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />

          <Route
            element={
              <RequireAuth>
                <AgentsProvider>
                  <AppShell />
                </AgentsProvider>
              </RequireAuth>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="health" element={<HealthPage />} />
            <Route path="investments" element={<InvestmentsPage />} />
          <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="a/:slug" element={<CustomAgentPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </StatusProvider>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading label="Opening SaarthiOS" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return <>{children}</>;
}
