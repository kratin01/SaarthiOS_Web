import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from './LandingPage';

const toggle = vi.fn();
vi.mock('@/context/ThemeContext', () => ({ useTheme: () => ({ theme: 'light', toggle }) }));

afterEach(cleanup);

it('explains the app to signed-out visitors and points to sign up and sign in', () => {
  const { container } = render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  );

  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
    'Just type what happened. SaarthiOS keeps track.'
  );
  expect(screen.getAllByRole('link', { name: 'Get started' })[0].getAttribute('href')).toBe('/register');
  expect(screen.getByRole('link', { name: 'I already have an account' }).getAttribute('href')).toBe('/login');
  expect(screen.getByRole('heading', { name: 'How it works' })).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Everything in one place' })).toBeTruthy();
  expect(container.textContent).not.toMatch(/[\u2013\u2014]/);

  fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
  expect(toggle).toHaveBeenCalledOnce();
});
