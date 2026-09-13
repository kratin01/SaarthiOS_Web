/**
 * Change AI provider, key and model without redeploying.
 *
 * The key only travels upward. What comes back is a hint like `AQ.Ab…5xKq`,
 * enough to recognise which key is saved and useless to anyone who sees it.
 *
 * "Load models" asks the provider what this key can actually use, so the list
 * stays right even as providers retire models.
 */
import { useEffect, useState } from 'react';
import { aiApi } from '@/api';
import { errorMessage } from '@/api/http';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/States';
import { CheckIcon, SparkIcon } from '@/components/ui/Icons';
import type { AiSettingsResponse, ProviderOption } from '@/types';

/** The five calls the card needs, so it can drive personal or shared settings. */
export interface AiSettingsApi {
  settings: () => Promise<AiSettingsResponse>;
  save: (draft: { provider: string; model: string; baseUrl: string; apiKey: string }) => Promise<AiSettingsResponse>;
  reset: () => Promise<AiSettingsResponse>;
  models: (draft: { provider: string; model: string; baseUrl: string; apiKey: string }) => Promise<string[]>;
  test: (draft: { provider: string; model: string; baseUrl: string; apiKey: string }) => Promise<{ model: string; ms: number }>;
}

interface Props {
  onSaved?: () => void;
  /** Defaults to the signed-in user's own settings. */
  api?: AiSettingsApi;
  title?: string;
  description?: string;
  savedMessage?: string;
  resetLabel?: string;
}

export function AiProviderCard({
  onSaved,
  api = aiApi,
  title = 'AI provider',
  description = 'Change your key or model here — no redeploy needed',
  savedMessage = 'Saved. Your agents will use this from the next message.',
  resetLabel = 'Remove my key'
}: Props) {
  const [data, setData] = useState<AiSettingsResponse | null>(null);
  const [provider, setProvider] = useState('');
  const [model, setModel] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');

  const [liveModels, setLiveModels] = useState<string[] | null>(null);
  const [busy, setBusy] = useState<'save' | 'test' | 'models' | 'reset' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api
      .settings()
      .then((settings) => {
        setData(settings);
        setProvider(settings.provider || 'gemini');
        setModel(settings.model || '');
        setBaseUrl(settings.baseUrl || '');
      })
      .catch((err) => setError(errorMessage(err, 'Could not load AI settings.')));
    // `api` is a stable module object, so this runs once per card.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) {
    return (
      <Card title={title}>
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      </Card>
    );
  }

  const providers = data.providers ?? [];
  const current: ProviderOption | undefined = providers.find((p) => p.id === provider);
  const draft = { provider, model: model.trim(), baseUrl: baseUrl.trim(), apiKey: apiKey.trim() };
  const hasStoredKey = Boolean(data.keyHint) && data.provider === provider;
  const needsKey = Boolean(current && !current.keyOptional && !apiKey.trim() && !hasStoredKey);

  const changeProvider = (id: string) => {
    setProvider(id);
    setModel('');
    setBaseUrl('');
    setLiveModels(null);
    setNotice(null);
    setError(null);
  };

  const run = async (kind: typeof busy, action: () => Promise<string | null>) => {
    setBusy(kind);
    setError(null);
    setNotice(null);
    try {
      setNotice(await action());
    } catch (err) {
      setError(errorMessage(err, 'That did not work.'));
    } finally {
      setBusy(null);
    }
  };

  const loadModels = () =>
    run('models', async () => {
      const models = await api.models(draft);
      setLiveModels(models);
      return `${models.length} models available with this key.`;
    });

  const test = () =>
    run('test', async () => {
      const result = await api.test(draft);
      return `Works — ${result.model} replied in ${(result.ms / 1000).toFixed(1)}s.`;
    });

  const save = () =>
    run('save', async () => {
      const saved = await api.save(draft);
      // Merged, not replaced: the catalogue this form is built from must
      // survive even if a response ever comes back without it.
      setData((prev) => ({ ...prev, ...saved }));
      setApiKey('');
      onSaved?.();
      return savedMessage;
    });

  const reset = () =>
    run('reset', async () => {
      const saved = await api.reset();
      setData((prev) => ({ ...prev, ...saved }));
      setProvider(saved.provider || 'gemini');
      setModel('');
      setBaseUrl('');
      setApiKey('');
      setLiveModels(null);
      onSaved?.();
      return 'Removed. Falling back to the server default.';
    });

  const modelOptions = liveModels
    ? liveModels.map((id) => ({ id, note: '' }))
    : (current?.suggested ?? []);

  return (
    <Card
      title={title}
      description={description}
      action={
        <span
          className={`inline-flex items-center gap-1.5 text-xs ${
            data.configured ? 'text-health' : 'text-muted'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${data.configured ? 'bg-health' : 'bg-line'}`} />
          {data.configured ? 'Connected' : 'Not set up'}
        </span>
      }
    >
      <div className="space-y-4">
        {data.configured && (
          <p className="rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-muted">
            Currently using <span className="font-medium text-ink">{data.label}</span> ·{' '}
            <span className="font-medium text-ink">{data.model}</span>
            {data.source === 'shared' && ' — the shared default, not your own key'}
            {data.source === 'env' && ' — from the server config, not your own key'}
            {typeof data.usersOnDefault === 'number' && (
              <>
                <br />
                {data.usersOnDefault === 1
                  ? '1 account is on this default.'
                  : `${data.usersOnDefault} accounts are on this default.`}
                {data.updatedBy && ` Last changed by ${data.updatedBy}.`}
              </>
            )}
          </p>
        )}

        {!data.configured && data.reason && (
          <p className="rounded-xl border border-expense/25 bg-expense/5 px-3 py-2 text-xs text-ink">
            {data.reason}
          </p>
        )}

        <div>
          <label className="label" htmlFor="ai-provider">
            Provider
          </label>
          <select
            id="ai-provider"
            className="input"
            value={provider}
            onChange={(e) => changeProvider(e.target.value)}
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          {current?.keyHelp && <p className="mt-1.5 text-xs text-muted">Key from {current.keyHelp}</p>}
        </div>

        <div>
          <label className="label" htmlFor="ai-key">
            API key
          </label>
          <input
            id="ai-key"
            className="input"
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={
              hasStoredKey
                ? `${data.keyHint} — leave blank to keep it`
                : current?.keyOptional
                  ? 'Not needed for this provider'
                  : 'Paste your key'
            }
          />
          <p className="mt-1.5 text-xs text-muted">
            Stored encrypted. It is never sent back to this page.
          </p>
        </div>

        {provider === 'custom' && (
          <div>
            <label className="label" htmlFor="ai-base">
              Base URL
            </label>
            <input
              id="ai-base"
              className="input"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://my-host/v1"
            />
          </div>
        )}

        <div>
          <div className="mb-1.5 flex items-end justify-between gap-3">
            <label className="label mb-0" htmlFor="ai-model">
              Model
            </label>
            <button
              type="button"
              onClick={loadModels}
              disabled={busy !== null || needsKey}
              className="text-xs font-medium text-brand-600 transition hover:text-brand-700 disabled:opacity-40"
            >
              {busy === 'models' ? 'Loading…' : 'Load from provider'}
            </button>
          </div>
          <select
            id="ai-model"
            className="input"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            <option value="">Default ({current?.defaultModel || 'not set'})</option>
            {modelOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id}
                {m.note ? ` — ${m.note}` : ''}
              </option>
            ))}
          </select>
          {!liveModels && (
            <p className="mt-1.5 text-xs text-muted">
              These are suggestions. Load from provider to see exactly what your key allows.
            </p>
          )}
        </div>

        {error && (
          <p className="rounded-xl border border-expense/25 bg-expense/5 px-3 py-2 text-sm text-ink">
            {error}
          </p>
        )}
        {notice && (
          <p className="flex items-start gap-2 rounded-xl border border-health/25 bg-health/5 px-3 py-2 text-sm text-ink">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-health" />
            {notice}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary"
            onClick={save}
            disabled={busy !== null || needsKey}
          >
            {busy === 'save' && <Spinner className="h-4 w-4" />}
            Save
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={test}
            disabled={busy !== null || needsKey}
          >
            {busy === 'test' ? <Spinner className="h-4 w-4" /> : <SparkIcon className="h-4 w-4" />}
            Test connection
          </button>
          {(data.source === 'user' || data.source === 'shared') && (
            <button type="button" className="btn-quiet" onClick={reset} disabled={busy !== null}>
              {resetLabel}
            </button>
          )}
        </div>

        {needsKey && (
          <p className="text-xs text-muted">Add a key to save or test this provider.</p>
        )}
      </div>
    </Card>
  );
}
