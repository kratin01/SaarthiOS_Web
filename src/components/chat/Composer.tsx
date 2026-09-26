/** The text box at the bottom of the chat. Enter sends, Shift+Enter adds a line. */
import { useCallback, useEffect, useRef } from 'react';
import { MicIcon, SendIcon, StopIcon } from '@/components/ui/Icons';
import { Spinner } from '@/components/ui/States';
import { useVoiceInput } from '@/hooks/useVoiceInput';

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  sending?: boolean;
  placeholder?: string;
}

export function Composer({
  value,
  onChange,
  onSend,
  disabled,
  sending,
  placeholder = 'Tell me what happened…'
}: ComposerProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  // Read through a ref so appending never depends on a stale `value`, which
  // would drop words when two results arrive in the same tick.
  const latest = useRef(value);
  latest.current = value;

  const appendSpoken = useCallback(
    (text: string) => {
      const existing = latest.current.trimEnd();
      const next = existing ? `${existing} ${text}` : text;
      latest.current = next;
      onChange(next);
      ref.current?.focus();
    },
    [onChange]
  );

  const voice = useVoiceInput({ onText: appendSpoken });

  // Grow with the content instead of scrolling inside a fixed box.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value, voice.interim]);

  const busy = Boolean(disabled) || sending;

  return (
    <div className="space-y-1.5">
      {voice.error && (
        <p className="px-1 text-xs text-expense" role="status">
          {voice.error}
        </p>
      )}
      {voice.listening && (
        <p className="flex items-center gap-2 px-1 text-xs text-muted" role="status">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-expense/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-expense" />
          </span>
          {voice.interim ? voice.interim : 'Listening… speak naturally, Hindi or English.'}
        </p>
      )}
      {voice.busy && (
        <p className="px-1 text-xs text-muted" role="status">
          Writing that down…
        </p>
      )}

      <div className="flex items-end gap-2 rounded-2xl border border-line bg-surface p-2 shadow-card transition focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100">
        <textarea
          ref={ref}
          rows={1}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-ink placeholder:text-muted/70 focus:outline-none disabled:opacity-60"
        />

        {voice.supported && (
          <button
            type="button"
            onClick={voice.toggle}
            disabled={busy || voice.busy}
            aria-label={voice.listening ? 'Stop recording' : 'Speak your message'}
            aria-pressed={voice.listening}
            title={voice.listening ? 'Stop' : 'Speak instead of typing'}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-40 ${
              voice.listening
                ? 'border-expense/30 bg-expense/10 text-expense'
                : 'border-line bg-surface text-muted hover:bg-canvas hover:text-ink'
            }`}
          >
            {voice.busy ? (
              <Spinner className="h-4 w-4" />
            ) : voice.listening ? (
              <StopIcon className="h-3.5 w-3.5" />
            ) : (
              <MicIcon className="h-4 w-4" />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onSend}
          disabled={busy || !value.trim()}
          aria-label="Send message"
          className="brand-solid flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sending ? <Spinner className="h-4 w-4" /> : <SendIcon className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
