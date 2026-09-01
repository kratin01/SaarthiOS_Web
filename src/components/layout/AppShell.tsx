/**
 * The app frame: a fixed sidebar on desktop, a slide-in drawer on mobile,
 * and the routed page in the middle.
 */
import { useState } from 'react';
import type { ComponentType } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useAgents } from '@/context/AgentsContext';
import { NoticeBanner } from '@/components/ui/Notices';
import {
  ChatIcon,
  HomeIcon,
  LeafIcon,
  LogoutIcon,
  MenuIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon,
  TrendIcon,
  WalletIcon,
  CloseIcon,
  agentIcon
} from '@/components/ui/Icons';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Overview', icon: HomeIcon, end: true },
  { to: '/chat', label: 'Assistant', icon: ChatIcon },
  { to: '/expenses', label: 'Expenses', icon: WalletIcon },
  { to: '/health', label: 'Health', icon: LeafIcon },
  { to: '/investments', label: 'Investments', icon: TrendIcon }
];

const SETTINGS_NAV: NavItem = { to: '/settings', label: 'Settings', icon: SettingsIcon };

export function AppShell() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { agents } = useAgents();
  const location = useLocation();

  const custom: NavItem[] = agents
    .filter((agent) => agent.active)
    .map((agent) => ({
      to: `/a/${agent.slug}`,
      label: agent.name,
      icon: agentIcon(agent.icon)
    }));

  const allNav = [...NAV, ...custom, SETTINGS_NAV];

  const current = allNav.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-overlay/30 backdrop-blur-[2px] lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-line bg-surface
                    transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0
                    ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Brand />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="rounded-lg p-1 text-muted lg:hidden"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {allNav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-muted hover:bg-canvas hover:text-ink'
                }`
              }
            >
              <Icon className="h-[18px] w-[18px]" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="h-9 w-9 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                {user?.name?.charAt(0).toUpperCase() ?? '?'}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{user?.name}</p>
              <p className="truncate text-xs text-muted">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              className="rounded-lg p-1.5 text-muted transition hover:bg-canvas hover:text-ink"
            >
              {theme === 'dark' ? (
                <SunIcon className="h-4 w-4" />
              ) : (
                <MoonIcon className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={logout}
              aria-label="Sign out"
              className="rounded-lg p-1.5 text-muted transition hover:bg-canvas hover:text-ink"
            >
              <LogoutIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <NoticeBanner />

        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-canvas/85 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-1.5 text-muted transition hover:bg-surface hover:text-ink"
          >
            <MenuIcon />
          </button>
          <span className="text-sm font-semibold text-ink">{current?.label ?? 'SaarthiOS'}</span>
        </header>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500">
        <span className="h-2.5 w-2.5 rounded-full bg-canvas" />
      </span>
      <div className="leading-tight">
        <p className="text-sm font-semibold tracking-tight text-ink">SaarthiOS</p>
        <p className="text-[11px] text-muted">Your personal layer</p>
      </div>
    </div>
  );
}
