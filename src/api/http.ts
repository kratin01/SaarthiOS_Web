/**
 * The single axios instance every request goes through.
 * It attaches the auth token, unwraps `response.data`, and turns server errors
 * into a plain readable string.
 */
import axios, { AxiosError } from 'axios';

const TOKEN_KEY = 'saarthios.token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY)
};

export const http = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ''}/api`,
  timeout: 60_000
});

http.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * A 401 from these means "wrong credentials", not "your session died", so they
 * must not bounce you to the sign-in page.
 */
const NO_REDIRECT = ['/auth/login', '/auth/register', '/auth/google'];

const isAuthPage = () => ['/login', '/register'].includes(window.location.pathname);

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: { message?: string } }>) => {
    const url = error.config?.url ?? '';
    const deadSession =
      error.response?.status === 401 && !NO_REDIRECT.some((path) => url.includes(path));

    // The `isAuthPage` guard matters: AuthContext checks `/auth/me` on every
    // load, including on /login, and redirecting to /login from /login is a
    // full reload that would loop forever.
    if (deadSession) {
      tokenStore.clear();
      if (!isAuthPage()) window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);

/** Turns any thrown error into a sentence that is safe to show a user. */
export function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string } } | undefined;
    if (data?.error?.message) return data.error.message;
    if (error.code === 'ECONNABORTED') return 'The request took too long. Try again.';
    if (!error.response) return 'Cannot reach the server. Is it running?';
  }
  return fallback;
}

/**
 * Fetches a file and hands it straight to the browser.
 *
 * A failed response also arrives as a Blob, so it is read back into JSON first:
 * without that every problem would show up as the generic fallback message.
 */
export async function downloadFile(
  url: string,
  params: Record<string, unknown> = {},
  fallbackName = 'download'
): Promise<void> {
  try {
    const response = await http.get<Blob>(url, {
      params,
      responseType: 'blob',
      timeout: 120_000
    });
    const header = String(response.headers['content-disposition'] ?? '');
    saveBlob(response.data, /filename="?([^";]+)"?/i.exec(header)?.[1] ?? fallbackName);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      try {
        error.response.data = JSON.parse(await error.response.data.text());
      } catch {
        // Not JSON, so leave it alone and let the fallback message stand.
      }
    }
    throw error;
  }
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  // Revoking immediately cancels the download in Safari.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
