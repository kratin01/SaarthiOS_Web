/**
 * Import from a bill, receipt or bank statement.
 *
 * Three steps: pick a file, review what was found, save what you ticked.
 * The review step is the point — a statement can hold fifty lines, and none of
 * them are written until you say so.
 */
import { useMemo, useRef, useState } from 'react';
import { importApi } from '@/api';
import { errorMessage } from '@/api/http';
import { useServiceNotice } from '@/context/StatusContext';
import { InlineNotice } from '@/components/ui/Notices';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/States';
import { CheckIcon, UploadIcon } from '@/components/ui/Icons';
import { formatDay, formatMoney, labelise } from '@/lib/format';
import type { ExtractedDocument } from '@/types';

const ACCEPT = '.pdf,.csv,.txt,.png,.jpg,.jpeg,.webp';

interface Props {
  open: boolean;
  currency: string;
  onClose: () => void;
  onImported: () => void;
}

type Selection = { expenses: Set<number>; meals: Set<number>; investments: Set<number> };

const allSelected = (doc: ExtractedDocument): Selection => ({
  expenses: new Set(doc.expenses.map((_, i) => i)),
  meals: new Set(doc.meals.map((_, i) => i)),
  investments: new Set(doc.investments.map((_, i) => i))
});

export function ImportModal({ open, currency, onClose, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [doc, setDoc] = useState<ExtractedDocument | null>(null);
  const [picked, setPicked] = useState<Selection | null>(null);
  const [busy, setBusy] = useState<'reading' | 'saving' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const importNotice = useServiceNotice('import');

  const money = (value: number) => formatMoney(value, currency);

  const total = useMemo(() => {
    if (!doc || !picked) return 0;
    return picked.expenses.size + picked.meals.size + picked.investments.size;
  }, [doc, picked]);

  const reset = () => {
    setFileName('');
    setDoc(null);
    setPicked(null);
    setError(null);
    setBusy(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const close = () => {
    reset();
    onClose();
  };

  const read = async (file: File) => {
    setFileName(file.name);
    setBusy('reading');
    setError(null);
    try {
      const result = await importApi.extract(file);
      setDoc(result);
      setPicked(allSelected(result));
    } catch (err) {
      setError(errorMessage(err, 'That file could not be read.'));
      setFileName('');
    } finally {
      setBusy(null);
    }
  };

  const toggle = (group: keyof Selection, index: number) => {
    setPicked((current) => {
      if (!current) return current;
      const next = new Set(current[group]);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return { ...current, [group]: next };
    });
  };

  const save = async () => {
    if (!doc || !picked) return;
    setBusy('saving');
    setError(null);
    try {
      await importApi.confirm({
        expenses: doc.expenses.filter((_, i) => picked.expenses.has(i)),
        meals: doc.meals.filter((_, i) => picked.meals.has(i)),
        investments: doc.investments.filter((_, i) => picked.investments.has(i))
      });
      onImported();
      close();
    } catch (err) {
      setError(errorMessage(err, 'Could not save those rows.'));
      setBusy(null);
    }
  };

  return (
    <Modal open={open} title="Import from a bill or statement" onClose={close}>
      {importNotice && (
        <div className="mb-4">
          <InlineNotice message={importNotice} />
        </div>
      )}

      {!doc ? (
        <div className="space-y-4">
          <label
            htmlFor="import-file"
            className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-canvas px-4 py-8 text-center transition hover:border-brand-300"
          >
            <UploadIcon className="h-6 w-6 text-muted" />
            <span className="text-sm font-medium text-ink">
              {busy === 'reading' ? `Reading ${fileName}…` : 'Choose a file'}
            </span>
            <span className="text-xs text-muted">
              PDF or CSV statement, or a photo of a bill
            </span>
          </label>
          <input
            id="import-file"
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            disabled={busy !== null}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void read(file);
            }}
          />

          {busy === 'reading' && (
            <p className="flex items-center justify-center gap-2 text-sm text-muted">
              <Spinner className="h-4 w-4" />
              Reading the file — a long statement can take a moment.
            </p>
          )}

          <p className="rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-muted">
            Nothing is saved until you review it. Scanned PDFs have no text in them — upload a
            screenshot of those instead.
          </p>

          {error && (
            <p className="rounded-xl border border-expense/25 bg-expense/5 px-3 py-2 text-sm text-ink">
              {error}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-canvas px-3 py-2">
            <p className="text-sm font-medium text-ink">{doc.documentType}</p>
            <p className="mt-0.5 text-xs text-muted">{doc.summary}</p>
          </div>

          {total === 0 && doc.expenses.length + doc.meals.length + doc.investments.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">
              Nothing was found in that file.
            </p>
          ) : (
            <div className="space-y-4">
              <Group title="Expenses">
                {doc.expenses.map((row, i) => (
                  <Row
                    key={i}
                    checked={picked!.expenses.has(i)}
                    onToggle={() => toggle('expenses', i)}
                    title={row.merchant || labelise(row.category)}
                    subtitle={`${labelise(row.category)} · ${formatDay(row.date)}`}
                    amount={money(row.amount)}
                  />
                ))}
              </Group>

              <Group title="Investments">
                {doc.investments.map((row, i) => (
                  <Row
                    key={i}
                    checked={picked!.investments.has(i)}
                    onToggle={() => toggle('investments', i)}
                    title={row.instrument || labelise(row.type)}
                    subtitle={`${labelise(row.type)} · ${formatDay(row.date)}`}
                    amount={money(row.amount)}
                  />
                ))}
              </Group>

              <Group title="Meals">
                {doc.meals.map((row, i) => (
                  <Row
                    key={i}
                    checked={picked!.meals.has(i)}
                    onToggle={() => toggle('meals', i)}
                    title={row.items.map((item) => item.name).join(', ')}
                    subtitle={`${labelise(row.mealType)} · ${formatDay(row.date)}`}
                    amount={`${Math.round(row.items.reduce((s, i2) => s + i2.calories, 0))} kcal`}
                  />
                ))}
              </Group>
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-expense/25 bg-expense/5 px-3 py-2 text-sm text-ink">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" className="btn-ghost flex-1" onClick={reset}>
              Choose another
            </button>
            <button
              type="button"
              className="btn-primary flex-1"
              onClick={save}
              disabled={busy !== null || total === 0}
            >
              {busy === 'saving' ? <Spinner className="h-4 w-4" /> : null}
              Import {total > 0 ? total : ''}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode[] }) {
  if (!children.length) return null;
  return (
    <div>
      <p className="label">
        {title} <span className="normal-case text-muted/70">({children.length})</span>
      </p>
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
        {children}
      </ul>
    </div>
  );
}

function Row({
  checked,
  onToggle,
  title,
  subtitle,
  amount
}: {
  checked: boolean;
  onToggle: () => void;
  title: string;
  subtitle: string;
  amount: string;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={checked}
        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${
          checked ? 'bg-surface' : 'bg-canvas opacity-55'
        }`}
      >
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
            checked ? 'brand-solid border-transparent' : 'border-line bg-surface'
          }`}
        >
          {checked && <CheckIcon className="h-3 w-3" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink">{title}</span>
          <span className="block truncate text-xs text-muted">{subtitle}</span>
        </span>
        <span className="shrink-0 text-sm font-medium text-ink">{amount}</span>
      </button>
    </li>
  );
}
