/** The text box at the bottom of the chat. Enter sends, Shift+Enter adds a line. */
import { useEffect, useRef } from 'react';
import { SendIcon } from '@/components/ui/Icons';
import { Spinner } from '@/components/ui/States';

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

  // Grow with the content instead of scrolling inside a fixed box.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  return (
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
      <button
        type="button"
        onClick={onSend}
        disabled={disabled || sending || !value.trim()}
        aria-label="Send message"
        className="brand-solid flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        {sending ? <Spinner className="h-4 w-4" /> : <SendIcon className="h-4 w-4" />}
      </button>
    </div>
  );
}
