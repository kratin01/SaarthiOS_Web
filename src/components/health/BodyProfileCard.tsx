/**
 * Height, weight and goal in — BMI and daily targets out.
 *
 * The numbers it works out are a starting point, not a prescription, so they
 * land in editable fields and nothing is saved until you press Save.
 */
import { useState } from 'react';
import { authApi } from '@/api';
import { errorMessage } from '@/api/http';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/States';
import { LeafIcon } from '@/components/ui/Icons';
import type { BodyGoal, BodyTargets } from '@/types';

const GOALS: { value: BodyGoal; label: string; hint: string }[] = [
  { value: 'lean', label: 'Lean', hint: 'Lose fat' },
  { value: 'normal', label: 'Maintain', hint: 'Stay as you are' },
  { value: 'bulky', label: 'Bulk', hint: 'Build muscle' }
];

const BAND_TONE: Record<string, string> = {
  Underweight: 'text-invest',
  Normal: 'text-health',
  Overweight: 'text-invest',
  Obese: 'text-expense'
};

export function BodyProfileCard() {
  const { user, setUser } = useAuth();

  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState(user?.heightCm ? String(user.heightCm) : '');
  const [weight, setWeight] = useState(user?.weightKg ? String(user.weightKg) : '');
  const [goal, setGoal] = useState<BodyGoal>(user?.bodyGoal ?? 'normal');

  const [targets, setTargets] = useState<BodyTargets | null>(null);
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');

  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSet = Boolean(user?.heightCm && user?.weightKg);

  const calculate = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await authApi.bodyTargets({
        heightCm: Number(height),
        weightKg: Number(weight),
        bodyGoal: goal
      });
      setTargets(result);
      setCalories(String(result.dailyCalorieGoal));
      setProtein(String(result.dailyProteinGoal));
    } catch (err) {
      setError(errorMessage(err, 'Could not work that out. Check the numbers.'));
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await authApi.updateProfile({
        heightCm: Number(height),
        weightKg: Number(weight),
        bodyGoal: goal,
        dailyCalorieGoal: Number(calories) || 0,
        dailyProteinGoal: Number(protein) || 0
      });
      setUser(updated);
      setTargets(null);
      setOpen(false);
    } catch (err) {
      setError(errorMessage(err, 'Could not save your targets.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      title="Your targets"
      description={
        isSet
          ? 'Worked out from your height, weight and goal. Edit them any time.'
          : 'Add your height and weight and I will suggest daily calorie and protein targets.'
      }
      action={
        <button type="button" className="btn-ghost" onClick={() => setOpen((v) => !v)}>
          {open ? 'Close' : isSet ? 'Recalculate' : 'Set up'}
        </button>
      }
      className="mb-6"
    >
      {isSet && !open && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Figure label="BMI" value={String(bmiOf(user!.heightCm!, user!.weightKg!))} tone={BAND_TONE[bandOf(bmiOf(user!.heightCm!, user!.weightKg!))]} hint={bandOf(bmiOf(user!.heightCm!, user!.weightKg!))} />
          <Figure label="Goal" value={GOALS.find((g) => g.value === user?.bodyGoal)?.label ?? 'Maintain'} />
          <Figure label="Calories a day" value={`${user?.dailyCalorieGoal ?? 0}`} hint="kcal" />
          <Figure
            label="Protein a day"
            value={user?.dailyProteinGoal ? `${user.dailyProteinGoal}` : '—'}
            hint={user?.dailyProteinGoal ? 'g' : 'not set'}
          />
        </div>
      )}

      {!isSet && !open && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <LeafIcon className="h-4 w-4 shrink-0" />
          Nothing set yet — your calorie goal is the default {user?.dailyCalorieGoal ?? 2000} kcal.
        </p>
      )}

      {open && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="body-height">
                Height <span className="normal-case text-muted/70">(cm)</span>
              </label>
              <input
                id="body-height"
                className="input"
                type="number"
                min="50"
                max="260"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="175"
              />
            </div>
            <div>
              <label className="label" htmlFor="body-weight">
                Weight <span className="normal-case text-muted/70">(kg)</span>
              </label>
              <input
                id="body-weight"
                className="input"
                type="number"
                min="20"
                max="400"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="70"
              />
            </div>
          </div>

          <div>
            <span className="label">What are you aiming for</span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {GOALS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setGoal(option.value)}
                  aria-pressed={goal === option.value}
                  className={`rounded-xl border px-3 py-2.5 text-left transition ${
                    goal === option.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-line text-muted hover:text-ink'
                  }`}
                >
                  <span className="block text-sm font-medium">{option.label}</span>
                  <span className="block text-xs opacity-80">{option.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="btn-ghost"
            onClick={() => void calculate()}
            disabled={busy || !height || !weight}
          >
            {busy && <Spinner className="h-4 w-4" />}
            Work out my targets
          </button>

          {targets && (
            <div className="rounded-xl border border-line bg-canvas p-4">
              <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="text-sm text-ink">
                  BMI <span className="font-semibold">{targets.bmi}</span>
                </p>
                <p className={`text-sm font-medium ${BAND_TONE[targets.bmiBand] ?? 'text-muted'}`}>
                  {targets.bmiBand}
                </p>
                <p className="text-xs text-muted">
                  maintenance is about {targets.maintenanceCalories} kcal
                </p>
              </div>

              <p className="mb-4 text-sm text-muted">{targets.note}</p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="body-calories">
                    Daily calories <span className="normal-case text-muted/70">(kcal)</span>
                  </label>
                  <input
                    id="body-calories"
                    className="input"
                    type="number"
                    min="0"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="body-protein">
                    Daily protein <span className="normal-case text-muted/70">(g)</span>
                  </label>
                  <input
                    id="body-protein"
                    className="input"
                    type="number"
                    min="0"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                  />
                </div>
              </div>

              <p className="mt-3 text-xs text-muted">
                These are estimates from your height and weight. Change either number if you know
                better — nothing is saved until you press Save.
              </p>

              <button
                type="button"
                className="btn-primary mt-4"
                onClick={() => void save()}
                disabled={saving}
              >
                {saving && <Spinner className="h-4 w-4" />}
                Save targets
              </button>
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-expense/25 bg-expense/5 px-3 py-2 text-sm text-ink">
              {error}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

function Figure({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold ${tone ?? 'text-ink'}`}>{value}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

const bmiOf = (heightCm: number, weightKg: number) =>
  Math.round((weightKg / (heightCm / 100) ** 2) * 10) / 10;

const bandOf = (bmi: number) => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};
