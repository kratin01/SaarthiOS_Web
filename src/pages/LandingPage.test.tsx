import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
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
    'SaarthiOS'
  );
  expect(screen.getAllByRole('link', { name: 'Get started' })[0].getAttribute('href')).toBe('/register');
  expect(screen.getByRole('link', { name: 'I already have an account' }).getAttribute('href')).toBe('/login');
  expect(screen.getByRole('heading', { name: 'How it works' })).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Everything in one place' })).toBeTruthy();
  expect(container.textContent).not.toMatch(/[\u2013\u2014]/);

  fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
  expect(toggle).toHaveBeenCalledOnce();
});

it('embeds a responsive, user-controlled film with a poster, captions and transcript', () => {
  render(<MemoryRouter><LandingPage /></MemoryRouter>);

  const video = screen.getByLabelText('SaarthiOS product demo') as HTMLVideoElement;
  expect(video.controls).toBe(true);
  expect(video.autoplay).toBe(false);
  expect(video.playsInline).toBe(true);
  expect(video.preload).toBe('none');
  expect(video.poster).toContain('/demo/saarthios-demo.jpg');
  expect(video.querySelector('source')?.getAttribute('src')).toBe('/demo/saarthios-demo.mp4');
  expect(video.querySelector('track')?.getAttribute('kind')).toBe('captions');
  expect(screen.getByText('Video transcript').closest('details')?.textContent).toContain('INR 250');
  expect(screen.getByText('Product demo · Sample data')).toBeTruthy();

  fireEvent.error(video.querySelector('source')!);
  expect(screen.getByRole('status').textContent).toContain('read the transcript');
  fireEvent.loadedData(video);
  expect(screen.queryByRole('status')).toBeNull();
  expect(screen.getByRole('link', { name: 'I already have an account' })).toBeTruthy();
});

it('ships the actual movie, poster and timed captions', () => {
  const movie = readFileSync('public/demo/saarthios-demo.mp4');
  expect(movie.subarray(4, 8).toString()).toBe('ftyp');
  expect(movie.indexOf('moov')).toBeLessThan(movie.indexOf('mdat'));
  expect(movie.length).toBeLessThan(5 * 1024 * 1024);
  const poster = readFileSync('public/demo/saarthios-demo.jpg');
  expect(poster.subarray(0, 3).toString('hex')).toBe('ffd8ff');
  const captions = readFileSync('public/demo/saarthios-demo.vtt', 'utf8');
  expect(captions.startsWith('WEBVTT')).toBe(true);
  expect(captions).toContain('00:34.000');
});
