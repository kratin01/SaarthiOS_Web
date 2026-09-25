/** Profile, goals and the AI provider you want your agents to use. */
import { useState } from 'react';
import { authApi } from '@/api';
import { errorMessage } from '@/api/http';
import { useAuth } from '@/context/AuthContext';
import { Page, PageHeader } from '@/components/layout/Page';
import { Card } from '@/components/ui/Card';
import { AiProviderCard } from '@/components/settings/AiProviderCard';
import { CustomAgentsCard } from '@/components/settings/CustomAgentsCard';
import { Spinner } from '@/components/ui/States';
import { currencySymbol } from '@/lib/format';

const CURRENCIES = [
  { code: 'INR', label: 'Indian Rupee' },
  { code: 'USD', label: 'US Dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'British Pound' },
  { code: 'AED', label: 'UAE Dirham' },
  { code: 'RUB', label: 'Russian Ruble' }
];

export function SettingsPage() {
  const { user, setUser, logout } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [currency, setCurrency] = useState(user?.currency ?? 'INR');
  const [budget, setBudget] = useState(user?.monthlyBudget?.toString() ?? '');
  const [calorieGoal, setCalorieGoal] = useState(user?.dailyCalorieGoal?.toString() ?? '2000');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setSaved(false);
    setError(null);
    try {
      const updated = await authApi.updateProfile({
        name: name.trim(),
        currency,
        monthlyBudget: budget === '' ? null : Number(budget),
        dailyCalorieGoal: Number(calorieGoal) || 0
      });
      setUser(updated);
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err, 'Could not save your settings.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page>
      <PageHeader title="Settings" subtitle="Your profile, goals and AI connection." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Profile" description="Used across every dashboard">
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="label" htmlFor="set-name">
                Name
              </label>
              <input
                id="set-name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={2}
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="set-currency">
                Currency
              </label>
              <select
                id="set-currency"
                className="input"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {CURRENCIES.map((value) => (
                  <option key={value.code} value={value.code}>
                    {value.code} · {value.label} ({currencySymbol(value.code)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="set-budget">
                Monthly budget <span className="normal-case text-muted/70">(optional)</span>
              </label>
              <input
                id="set-budget"
                className="input"
                type="number"
                min="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Leave blank for no budget"
              />
              <p className="mt-1.5 text-xs text-muted">
                Set this and the overview tells you when you are close to it.
              </p>
            </div>

            <div>
              <label className="label" htmlFor="set-calories">
                Daily calorie goal
              </label>
              <input
                id="set-calories"
                className="input"
                type="number"
                min="0"
                value={calorieGoal}
                onChange={(e) => setCalorieGoal(e.target.value)}
              />
            </div>

            {error && (
              <p className="rounded-xl border border-expense/25 bg-expense/5 px-3 py-2 text-sm text-ink">
                {error}
              </p>
            )}
            {saved && (
              <p className="rounded-xl border border-health/25 bg-health/5 px-3 py-2 text-sm text-ink">
                Saved.
              </p>
            )}

            <button type="submit" className="btn-primary" disabled={busy}>
              {busy && <Spinner className="h-4 w-4" />}
              Save changes
            </button>
          </form>
        </Card>

        <div className="space-y-4">
          <AiProviderCard />

          <CustomAgentsCard />

          <Card title="Account">
            <p className="text-sm text-muted">
              Signed in as <span className="font-medium text-ink">{user?.email}</span>
            </p>
            {user?.googleId && (
              <p className="mt-1 text-sm text-muted">Connected with your Google account.</p>
            )}
            <button type="button" className="btn-ghost mt-4" onClick={logout}>
              Sign out
            </button>
          </Card>
        </div>
      </div>
    </Page>
  );
}
