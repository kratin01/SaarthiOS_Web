import { connectionsApi } from '@/api';

/**
 * Sends the browser to an app's own sign-in page. Only an HTTPS address is
 * followed, so a bad response can never navigate to a script URL.
 */
export async function startAppSignIn(app: string, returnTo: 'settings' | 'chat') {
  const url = await connectionsApi.start(app, returnTo);
  if (new URL(url).protocol !== 'https:') throw new Error('Unsafe sign-in address');
  window.location.assign(url);
}
