import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { Modal } from '@/components/ui/Modal';
import { BookIcon, ChatIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, LeafIcon, PencilIcon, RepeatIcon, SettingsIcon, WalletIcon } from '@/components/ui/Icons';
import { formatMoney } from '@/lib/format';

const STEPS = [
  { title: 'Assistant', icon: ChatIcon },
  { title: 'Expenses', icon: WalletIcon },
  { title: 'Health', icon: LeafIcon },
  { title: 'Investments & subscriptions', icon: RepeatIcon },
  { title: 'Your space', icon: SettingsIcon }
];

function dismissed(key: string) {
  try { return Boolean(localStorage.getItem(key)); } catch { return false; }
}

export function Tutorial() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const storageKey = `saarthios.tutorial.${user?._id}`;
  const [open, setOpen] = useState(() => user?.tutorialStatus === 'pending' && !dismissed(storageKey));
  const [step, setStep] = useState(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const finish = (tutorialStatus: 'skipped' | 'completed') => {
    setOpen(false);
    try { localStorage.setItem(storageKey, tutorialStatus); } catch { /* Storage may be disabled. */ }
    if (user?.tutorialStatus === 'completed' || user?.tutorialStatus === 'skipped') return;
    void authApi.updateProfile({ tutorialStatus }).then((updated) => {
      if (mounted.current) setUser(updated);
    }).catch(() => undefined);
  };

  const Icon = STEPS[step].icon;
  const last = step === STEPS.length - 1;

  return (
    <>
      <button type="button" className="btn-quiet w-full justify-start" onClick={() => { setStep(0); setOpen(true); }}>
        <BookIcon className="h-4 w-4 shrink-0" /> Quick tour
      </button>
      <Modal open={open} title="Welcome to SaarthiOS" closeLabel="Skip tutorial" onClose={() => finish('skipped')}>
        <div className="flex items-center justify-between gap-2 text-xs text-muted">
          <span role="status">Step {step + 1} of {STEPS.length}</span>
          <span>Example only</span>
        </div>
        <div className="my-4 flex gap-1.5" aria-hidden="true">
          {STEPS.map((entry, index) => <span key={entry.title} className={`h-1 flex-1 rounded-full ${index <= step ? 'bg-brand-500' : 'bg-line'}`} />)}
        </div>
        <section className="min-h-[260px]" aria-live="polite" aria-atomic="true">
          <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-ink"><Icon className="h-5 w-5" />{STEPS[step].title}</h3>
          <Example key={step} step={step} currency={user?.currency ?? 'INR'} />
        </section>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
          <button type="button" className="btn-quiet px-2" onClick={() => finish('skipped')}>Skip</button>
          <div className="flex gap-2">
            <button type="button" className="btn-ghost px-3" disabled={step === 0} onClick={() => setStep(step - 1)}>
              <ChevronLeftIcon className="h-4 w-4" /> Back
            </button>
            <button type="button" className="btn-primary px-3" onClick={() => last ? finish('completed') : setStep(step + 1)}>
              {last ? 'Finish' : 'Next'}{last ? <CheckIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {last && <button type="button" className="btn-quiet mt-2 w-full" onClick={() => { finish('completed'); navigate('/chat'); }}><ChatIcon className="h-4 w-4" /> Open assistant</button>}
      </Modal>
    </>
  );
}

function Example({ step, currency }: { step: number; currency: string }) {
  const [preview, setPreview] = useState(false);
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState('200');
  const money = (value: number) => formatMoney(value, currency);

  if (step === 0) return (
    <div className="space-y-4">
      <p className="brand-solid ml-6 rounded-xl px-4 py-3 text-sm">Spent {money(200)} on lunch and had two rotis.</p>
      {preview ? <dl className="space-y-3 border-l-2 border-brand-300 pl-4 text-sm"><div><dt className="text-muted">Expense</dt><dd className="font-medium">Food · {money(200)}</dd></div><div><dt className="text-muted">Meal</dt><dd className="font-medium">Two rotis · Nutrition estimate</dd></div></dl>
        : <button type="button" className="btn-ghost" onClick={() => setPreview(true)}><ChatIcon className="h-4 w-4" /> Preview example</button>}
      <p className="text-xs text-muted">No records saved</p>
    </div>
  );
  if (step === 1) return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-line pb-4"><div><p className="text-sm font-medium">Lunch</p><p className="text-xs text-muted">Food · Today</p></div><span className="text-lg font-semibold">{money(Number(amount) || 0)}</span><button type="button" className="btn-quiet px-2" aria-label="Edit example expense" onClick={() => setEditing(!editing)}><PencilIcon className="h-4 w-4" /></button></div>
      {editing && <label className="block text-sm">Amount<input className="input mt-2" type="number" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>}
      <dl className="space-y-3 text-sm"><div><dt className="text-muted">Period</dt><dd>This month</dd></div><div><dt className="text-muted">Report</dt><dd>Expenses.xlsx</dd></div></dl>
    </div>
  );
  if (step === 2) return (
    <dl className="grid grid-cols-2 gap-5 text-sm"><div><dt className="text-muted">Lunch</dt><dd className="mt-1 font-medium">Two rotis, dal</dd></div><div><dt className="text-muted">Portion</dt><dd className="mt-1 font-medium">1 bowl of dal</dd></div><div><dt className="text-muted">Daily calorie goal</dt><dd className="mt-1 text-lg font-semibold">2,200 kcal</dd></div><div><dt className="text-muted">Daily protein goal</dt><dd className="mt-1 text-lg font-semibold">100 g</dd></div><div className="col-span-2 text-xs text-muted">Nutrition estimates · Personal targets</div></dl>
  );
  if (step === 3) return (
    <dl className="space-y-5 text-sm"><div className="border-b border-line pb-4"><dt className="text-muted">Investment · Total paid</dt><dd className="mt-1 text-lg font-semibold">{money(12000)}</dd><dd className="mt-1 text-muted">10 shares × {money(1200)}</dd></div><div><dt className="text-muted">Subscription · Music</dt><dd className="mt-1 text-lg font-semibold">{money(120)} / month</dd><dd className="mt-1 text-muted">Active · Monthly renewal</dd></div></dl>
  );
  return <dl className="space-y-5 text-sm"><div><dt className="text-muted">Profile & goals</dt><dd className="mt-1 font-medium">Currency · Budget · Daily targets</dd></div><div><dt className="text-muted">AI connection</dt><dd className="mt-1 font-medium">Shared default or personal provider</dd></div><div><dt className="text-muted">Custom tracker · Reading</dt><dd className="mt-1 font-medium">Book: The Little Prince · Pages: 12</dd></div></dl>;
}