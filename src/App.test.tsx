import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import App from './App';

const auth = vi.hoisted(() => ({ user: null as null | { _id: string }, loading: false }));

vi.mock('@/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => auth
}));
vi.mock('@/context/StatusContext', () => ({
  StatusProvider: ({ children }: { children: ReactNode }) => children
}));
vi.mock('@/context/AgentsContext', () => ({
  AgentsProvider: ({ children }: { children: ReactNode }) => children
}));
vi.mock('@/components/layout/AppShell', async () => {
  const { Outlet } = await import('react-router-dom');
  return { AppShell: () => <Outlet /> };
});
vi.mock('@/pages/LandingPage', () => ({ LandingPage: () => <p>Landing page</p> }));
vi.mock('@/pages/AuthPage', () => ({ AuthPage: ({ mode }: { mode: string }) => <p>{mode} page</p> }));
vi.mock('@/pages/DashboardPage', () => ({ DashboardPage: () => <p>Dashboard</p> }));
vi.mock('@/pages/ExpensesPage', () => ({ ExpensesPage: () => <p>Expenses</p> }));

const visit = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );

beforeEach(() => {
  auth.user = null;
  auth.loading = false;
});
afterEach(cleanup);

it('shows the landing page at the root to signed-out visitors', () => {
  visit('/');
  expect(screen.getByText('Landing page')).toBeTruthy();
});

it('still asks signed-out visitors to sign in for private pages', () => {
  visit('/expenses');
  expect(screen.getByText('login page')).toBeTruthy();
});

it('keeps the dashboard at the root for signed-in users', () => {
  auth.user = { _id: 'user' };
  visit('/');
  expect(screen.getByText('Dashboard')).toBeTruthy();
  expect(screen.queryByText('Landing page')).toBeNull();
});

it('waits for the session check before choosing a page', () => {
  auth.loading = true;
  visit('/');
  expect(screen.getByText(/Opening SaarthiOS/)).toBeTruthy();
});
