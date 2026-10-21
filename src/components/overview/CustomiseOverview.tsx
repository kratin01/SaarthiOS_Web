/** Lets a person choose which cards the Overview shows. Saved on the account. */
import { useState } from 'react';
import { authApi } from '@/api';
import { errorMessage } from '@/api/http';
import { useAuth } from '@/context/AuthContext';
import { useAgents } from '@/context/AgentsContext';
import { Modal } from '@/components/ui/Modal';
import {
  DEFAULT_OVERVIEW_CARDS,
  OVERVIEW_CARD_GROUPS,
  agentCardId
} from '@/lib/overview';

export function CustomiseOverview({ onClose }: { onClose: () => void }) {
  const { user, setUser } = useAuth();
  const { agents } = useAgents();
  const [selected, setSelected] = useState(
    () => new Set(user?.overviewCards ?? DEFAULT_OVERVIEW_CARDS)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groups = [
    ...OVERVIEW_CARD_GROUPS,
    {
      title: 'Your agents',
      cards: agents
        .filter((agent) => agent.active)
        .map((agent) => ({
          id: agentCardId(agent._id),
          label: agent.name,
          description: 'Entries and the first stat for the period'
        }))
    }
  ].filter((group) => group.cards.length > 0);

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      // Saved in display order, and only for cards that still exist.
      const overviewCards = groups
        .flatMap((group) => group.cards.map((card) => card.id))
        .filter((id) => selected.has(id));
      setUser(await authApi.updateProfile({ overviewCards }));
      onClose();
    } catch (err) {
      setError(errorMessage(err, 'Could not save your Overview. Try again.'));
      setSaving(false);
    }
  };

  return (
    <Modal open title="Customise your Overview" onClose={onClose}>
      <p className="text-sm text-muted">
        Pick what you want to see first. Your choice is saved to your account.
      </p>

      <div className="mt-4 space-y-5">
        {groups.map((group) => (
          <fieldset key={group.title}>
            <legend className="label">{group.title}</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {group.cards.map((card) => (
                <label
                  key={card.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition ${
                    selected.has(card.id) ? 'border-brand-200 bg-brand-50' : 'border-line hover:bg-canvas'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(card.id)}
                    onChange={() => toggle(card.id)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-brand-500"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink">{card.label}</span>
                    <span className="block text-xs text-muted">{card.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-expense/25 bg-expense/5 px-3 py-2 text-sm text-ink">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          className="btn-quiet"
          onClick={() => setSelected(new Set(DEFAULT_OVERVIEW_CARDS))}
          disabled={saving}
        >
          Use the default
        </button>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={() => void save()} disabled={saving}>
            {saving ? 'Saving' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
