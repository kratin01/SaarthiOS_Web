/**
 * Build your own agent.
 *
 * The three things a user provides map straight onto how the system works:
 * the name becomes its id in the AI plan, the prompt is pasted into the
 * planner, and the stats become the schema its data is validated against.
 */
import { useState } from 'react';
import { agentApi } from '@/api';
import { errorMessage } from '@/api/http';
import { useAgents } from '@/context/AgentsContext';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/States';
import { AGENT_ICONS, PlusIcon, TrashIcon, agentIcon } from '@/components/ui/Icons';
import type { CustomAgent } from '@/types';

interface DraftField {
  label: string;
  type: 'number' | 'text';
  unit: string;
}

const BLANK_FIELD: DraftField = { label: '', type: 'number', unit: '' };

export function CustomAgentsCard() {
  const { agents, max, refresh } = useAgents();
  const [editing, setEditing] = useState<CustomAgent | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirming, setConfirming] = useState<CustomAgent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const atLimit = agents.length >= max;

  const remove = async (agent: CustomAgent) => {
    setError(null);
    try {
      await agentApi.remove(agent._id);
      setConfirming(null);
      await refresh();
    } catch (err) {
      setError(errorMessage(err, 'Could not delete that agent.'));
    }
  };

  const togglePaused = async (agent: CustomAgent) => {
    setError(null);
    try {
      await agentApi.update(agent._id, { active: !agent.active });
      await refresh();
    } catch (err) {
      setError(errorMessage(err, 'Could not update that agent.'));
    }
  };

  return (
    <Card
      title="Your agents"
      description={
        max === 0
          ? 'Custom agents are switched off on this server.'
          : `Track anything you like. ${agents.length} of ${max} used.`
      }
      action={
        max > 0 && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setCreating(true)}
            disabled={atLimit}
            title={atLimit ? 'Delete an agent to make room for another' : undefined}
          >
            <PlusIcon className="h-4 w-4" />
            New agent
          </button>
        )
      }
    >
      {error && (
        <p className="mb-3 rounded-xl border border-expense/25 bg-expense/5 px-3 py-2 text-sm text-ink">
          {error}
        </p>
      )}

      {agents.length === 0 ? (
        <p className="text-sm text-muted">
          {max === 0
            ? 'Ask whoever runs this server to raise MAX_CUSTOM_AGENTS.'
            : 'Nothing yet. An agent could track workouts, reading, mood — anything you would otherwise keep in a notes app.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {agents.map((agent) => {
            const Icon = agentIcon(agent.icon);
            return (
              <li
                key={agent._id}
                className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {agent.name}
                    {!agent.active && <span className="ml-2 text-xs text-muted">Paused</span>}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {agent.fields.map((f) => f.label).join(' · ')}
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 text-xs font-medium text-muted transition hover:text-ink"
                  onClick={() => void togglePaused(agent)}
                >
                  {agent.active ? 'Pause' : 'Resume'}
                </button>
                <button
                  type="button"
                  className="shrink-0 text-xs font-medium text-muted transition hover:text-ink"
                  onClick={() => setEditing(agent)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(agent)}
                  aria-label={`Delete ${agent.name}`}
                  className="shrink-0 rounded-lg p-1.5 text-muted transition hover:bg-canvas hover:text-expense"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-3 text-xs text-muted">
        Agents you build work in chat straight away. Paused ones keep their data but stop listening.
      </p>

      <AgentModal
        key={editing?._id ?? 'new'}
        agent={editing}
        open={creating || editing !== null}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={async () => {
          setCreating(false);
          setEditing(null);
          await refresh();
        }}
      />

      <Modal
        open={confirming !== null}
        title={`Delete ${confirming?.name ?? 'agent'}?`}
        onClose={() => setConfirming(null)}
      >
        <div className="space-y-4 px-5 py-4">
          <p className="text-sm text-ink">
            {confirming?.entryCount
              ? `This also deletes ${confirming.entryCount} logged ${
                  confirming.entryCount === 1 ? 'entry' : 'entries'
                }. It cannot be undone.`
              : 'This agent has nothing logged yet, so nothing else is lost.'}
          </p>
          {!!confirming?.entryCount && (
            <p className="text-xs text-muted">
              To stop it listening without losing the history, use Pause instead.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setConfirming(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn bg-expense text-white hover:opacity-90"
              onClick={() => void remove(confirming!)}
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

function AgentModal({
  agent,
  open,
  onClose,
  onSaved
}: {
  agent: CustomAgent | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(agent?.name ?? '');
  const [description, setDescription] = useState(agent?.description ?? '');
  const [prompt, setPrompt] = useState(agent?.prompt ?? '');
  const [icon, setIcon] = useState(agent?.icon ?? 'spark');
  const [fields, setFields] = useState<DraftField[]>(
    agent?.fields.map((f) => ({ label: f.label, type: f.type, unit: f.unit })) ?? [
      { ...BLANK_FIELD }
    ]
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = (index: number, patch: Partial<DraftField>) =>
    setFields((list) => list.map((f, i) => (i === index ? { ...f, ...patch } : f)));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const usable = fields.filter((f) => f.label.trim() !== '');

    if (usable.length === 0) {
      setError('Add at least one stat for this agent to track.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const body = {
        name: name.trim(),
        description: description.trim(),
        prompt: prompt.trim(),
        icon,
        fields: usable.map((f) => ({ label: f.label.trim(), type: f.type, unit: f.unit.trim() }))
      };

      if (agent) await agentApi.update(agent._id, body);
      else await agentApi.create(body);

      onSaved();
    } catch (err) {
      setError(errorMessage(err, 'Could not save this agent.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title={agent ? `Edit ${agent.name}` : 'New agent'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="agent-name">
            Name
          </label>
          <input
            id="agent-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Workouts"
            minLength={2}
            maxLength={40}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="label" htmlFor="agent-description">
            Short description <span className="normal-case text-muted/70">(optional)</span>
          </label>
          <input
            id="agent-description"
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Runs, gym sessions and cycling"
            maxLength={160}
          />
        </div>

        <div>
          <span className="label">Icon</span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(AGENT_ICONS).map(([key, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => setIcon(key)}
                aria-label={`Use the ${key} icon`}
                aria-pressed={icon === key}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                  icon === key
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-line text-muted hover:text-ink'
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="label">What it tracks</span>
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={index} className="flex gap-2">
                <input
                  className="input flex-1"
                  value={field.label}
                  onChange={(e) => setField(index, { label: e.target.value })}
                  placeholder="Distance"
                  maxLength={40}
                  aria-label={`Stat ${index + 1} name`}
                />
                <select
                  className="input w-28 shrink-0"
                  value={field.type}
                  onChange={(e) => setField(index, { type: e.target.value as DraftField['type'] })}
                  aria-label={`Stat ${index + 1} type`}
                >
                  <option value="number">Number</option>
                  <option value="text">Text</option>
                </select>
                <input
                  className="input w-20 shrink-0"
                  value={field.unit}
                  onChange={(e) => setField(index, { unit: e.target.value })}
                  placeholder="km"
                  maxLength={12}
                  disabled={field.type === 'text'}
                  aria-label={`Stat ${index + 1} unit`}
                />
                <button
                  type="button"
                  onClick={() => setFields((list) => list.filter((_, i) => i !== index))}
                  disabled={fields.length === 1}
                  aria-label={`Remove stat ${index + 1}`}
                  className="shrink-0 rounded-lg p-2 text-muted transition hover:bg-canvas hover:text-expense disabled:opacity-40"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {fields.length < 6 && (
            <button
              type="button"
              className="mt-2 text-xs font-medium text-brand-700"
              onClick={() => setFields((list) => [...list, { ...BLANK_FIELD }])}
            >
              + Add another stat
            </button>
          )}

          <p className="mt-1.5 text-xs text-muted">
            Up to 6. These become the columns on the agent's page, and the only values the assistant
            is allowed to fill in.
          </p>
        </div>

        <div>
          <label className="label" htmlFor="agent-prompt">
            Instructions for the assistant{' '}
            <span className="normal-case text-muted/70">(optional)</span>
          </label>
          <textarea
            id="agent-prompt"
            className="input min-h-[80px] resize-y"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Log anything about running, gym or cycling. If I say a time like 30 mins, that is duration."
            maxLength={1000}
          />
          <p className="mt-1.5 text-xs text-muted">
            Written in your words. This is added to the assistant's instructions, so it is how you
            teach it to recognise your messages.
          </p>
        </div>

        {error && (
          <p className="rounded-xl border border-expense/25 bg-expense/5 px-3 py-2 text-sm text-ink">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? <Spinner /> : agent ? 'Save changes' : 'Create agent'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
