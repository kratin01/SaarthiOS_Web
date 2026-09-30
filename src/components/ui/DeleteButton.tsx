import { useState } from 'react';
import { errorMessage } from '@/api/http';
import { Modal } from './Modal';
import { TrashIcon } from './Icons';
import { Spinner } from './States';

export function DeleteButton({ label, onDelete }: { label: string; onDelete: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const remove = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await onDelete();
      setOpen(false);
    } catch (err) {
      setError(errorMessage(err, 'Could not delete this entry. Try again.'));
    } finally {
      setBusy(false);
    }
  };
  return <>
    <button type="button" className="row-action rounded-lg p-1.5 text-muted transition hover:bg-canvas hover:text-expense" aria-label={`Delete ${label}`} title={`Delete ${label}`} onClick={() => { setError(null); setOpen(true); }}>
      <TrashIcon className="h-4 w-4" />
    </button>
    <Modal open={open} title={`Delete ${label}?`} onClose={() => { if (!busy) setOpen(false); }}>
      <p className="text-sm text-muted">This cannot be undone.</p>
      {error && <p role="alert" className="mt-3 text-sm text-expense">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="btn-ghost" disabled={busy} onClick={() => setOpen(false)}>Keep entry</button>
        <button type="button" className="btn-ghost text-expense" disabled={busy} onClick={() => void remove()}>
          {busy ? <Spinner className="h-4 w-4" /> : <TrashIcon className="h-4 w-4" />} Delete
        </button>
      </div>
    </Modal>
  </>;
}