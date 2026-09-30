/** A centred panel that closes on Escape or on a backdrop click. */
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './Icons';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  closeLabel?: string;
}

export function Modal({ open, title, onClose, children, closeLabel = 'Close' }: ModalProps) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  const wasOpen = useRef(false);
  const previousFocus = useRef<HTMLElement | null>(null);
  close.current = onClose;
  if (open && !wasOpen.current) previousFocus.current = document.activeElement as HTMLElement;
  wasOpen.current = open;

  useEffect(() => {
    if (!open) return;
    const focusable = () => Array.from(panel.current?.querySelectorAll<HTMLElement>(
      '*'
    ) ?? []).filter((element) => element.tabIndex >= 0 && !element.matches(':disabled')
      && !element.closest('[hidden], [inert]'));
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close.current();
      }
      if (event.key !== 'Tab') return;
      const elements = focusable();
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first) {
        event.preventDefault();
        panel.current?.focus();
      } else if (!panel.current?.contains(document.activeElement)
        || (event.shiftKey && document.activeElement === first)
        || (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    if (!panel.current?.contains(document.activeElement)) (focusable()[0] ?? panel.current)?.focus();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      if (previousFocus.current?.isConnected) previousFocus.current.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-overlay/30 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-md animate-fade-up rounded-t-2xl border border-line bg-surface shadow-lift sm:rounded-2xl"
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="rounded-lg p-1 text-muted transition hover:bg-canvas hover:text-ink"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </header>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
