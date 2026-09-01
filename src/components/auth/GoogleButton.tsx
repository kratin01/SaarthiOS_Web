/**
 * The "Continue with Google" button.
 *
 * Google's script is loaded on demand — only visitors who reach the sign-in
 * page ever download it, and nothing loads at all when Google sign-in is off.
 *
 * The button itself is rendered by Google. Their branding rules require it, and
 * it keeps us out of the business of handling passwords or popups.
 */
import { useEffect, useRef, useState } from 'react';

const SCRIPT_ID = 'google-identity-services';
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

/** Loads the script once, even if several components ask for it. */
let scriptPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing ?? document.createElement('script');

    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Could not load Google sign-in.'));
    };

    if (!existing) document.head.appendChild(script);
  });

  return scriptPromise;
}

interface GoogleButtonProps {
  clientId: string;
  onCredential: (credential: string) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

export function GoogleButton({ clientId, onCredential, onError, disabled }: GoogleButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  // Keeps the latest callbacks without re-rendering Google's button.
  const handlers = useRef({ onCredential, onError });
  handlers.current = { onCredential, onError };

  useEffect(() => {
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: ({ credential }) => handlers.current.onCredential(credential)
        });

        containerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          /**
           * `outline` in both themes. Google's dark variants paint a white chip
           * behind the logo on a cool grey (#202124) body, which against this
           * app's warm charcoal card reads as a flat slab with a bright block
           * stuck to it — and the only way to soften it is overriding Google's
           * obfuscated class names, which breaks the moment they change.
           */
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'center',
          width: containerRef.current.offsetWidth || 320
        });

        setReady(true);
      })
      .catch((error: Error) => {
        if (!cancelled) handlers.current.onError(error.message);
      });

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  return (
    <div className="relative">
      {/* Google draws into this node. Height is reserved so the form does not jump. */}
      <div ref={containerRef} className="flex h-10 justify-center" />

      {/* Matches Google's own 4px corner, so nothing changes shape as it loads. */}
      {!ready && (
        <div className="absolute inset-0 animate-pulse rounded border border-line bg-canvas" />
      )}

      {disabled && <div className="absolute inset-0 cursor-not-allowed rounded bg-canvas/60" />}
    </div>
  );
}
