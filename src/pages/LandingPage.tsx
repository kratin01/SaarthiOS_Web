/** The public front door: what SaarthiOS does, before anyone is asked to sign in. */
import { Link } from 'react-router-dom';
import type { ComponentType } from 'react';
import { useTheme } from '@/context/ThemeContext';
import {
  ChatIcon,
  CheckIcon,
  LeafIcon,
  MicIcon,
  MoonIcon,
  RepeatIcon,
  SparkIcon,
  SunIcon,
  TrendIcon,
  UploadIcon,
  WalletIcon
} from '@/components/ui/Icons';

type Icon = ComponentType<{ className?: string }>;

const STEPS: { title: string; text: string; icon: Icon }[] = [
  {
    title: 'Say it your way',
    text: 'Type or speak the way you normally talk, in English or Hinglish. One message can hold a payment and a meal.',
    icon: MicIcon
  },
  {
    title: 'It gets sorted',
    text: 'Each part goes to the right place: expenses, meals, investments, subscriptions or a tracker you made. If a portion is unclear, it asks once.',
    icon: SparkIcon
  },
  {
    title: 'See the full picture',
    text: 'Your dashboards update straight away. Ask "how much did I spend on food this month?" and the answer comes from your own records.',
    icon: ChatIcon
  }
];

const FEATURES: { title: string; text: string; icon: Icon; color: string }[] = [
  {
    title: 'Expenses',
    text: 'Categories, daily trends and the places you spend most. Download any month as an Excel file.',
    icon: WalletIcon,
    color: '#C08457'
  },
  {
    title: 'Meals',
    text: 'Calories and protein for every dish, with daily targets worked out from your height and weight.',
    icon: LeafIcon,
    color: '#6F9E7E'
  },
  {
    title: 'Investments',
    text: 'SIPs, funds, gold and shares in one list, with live share prices next to what you paid.',
    icon: TrendIcon,
    color: '#6B87A8'
  },
  {
    title: 'Subscriptions',
    text: 'Netflix, the gym, cloud storage. See what they cost each month and what is still due.',
    icon: RepeatIcon,
    color: '#A8829E'
  },
  {
    title: 'Your own trackers',
    text: 'Workouts, reading, sleep or water. Choose the fields you care about and the assistant fills them in.',
    icon: SparkIcon,
    color: '#8E7CC3'
  },
  {
    title: 'Bills and statements',
    text: 'Upload a bank statement or a photo of a bill. You pick the rows to keep before anything is saved.',
    icon: UploadIcon,
    color: '#4E7C6B'
  }
];

const PROMISES = [
  'Every entry is checked before it is saved.',
  'Answers about your spending and meals come from your own records.',
  'Nothing from a bill or statement is saved until you approve it.',
  'Anything you log can be edited or deleted later.'
];

export function LandingPage() {
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 rounded-lg" aria-label="SaarthiOS home">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500">
            <span className="h-2.5 w-2.5 rounded-full bg-canvas" />
          </span>
          <span className="text-sm font-semibold tracking-tight">SaarthiOS</span>
        </Link>

        <nav aria-label="Account" className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="rounded-lg p-2 text-muted transition hover:bg-surface hover:text-ink"
          >
            {theme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
          </button>
          <Link to="/login" className="btn-quiet px-3 py-2">
            Sign in
          </Link>
          <Link to="/register" className="btn-primary hidden px-3 py-2 sm:inline-flex">
            Get started
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:pb-24 lg:pt-12">
          <div className="animate-fade-up">
            <p className="mb-5 inline-flex rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted">
              Money, meals and habits in one chat
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl sm:leading-[1.1]">
              Just type what happened. SaarthiOS keeps track.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Write "spent 250 on lunch and had 2 rotis" and it saves the expense, logs the meal and
              updates your dashboards. Ask how your month is going whenever you like.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary px-5 py-3">
                Get started
              </Link>
              <Link to="/login" className="btn-ghost px-5 py-3">
                I already have an account
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted">
              Works on your phone too. Add it to your home screen and it opens like an app.
            </p>
          </div>

          <ChatPreview />
        </section>

        <section aria-labelledby="how-title" className="border-y border-line bg-surface">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
            <h2 id="how-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
              How it works
            </h2>
            <ol className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              {STEPS.map(({ title, text, icon: StepIcon }, index) => (
                <li key={title} className="rounded-2xl border border-line bg-canvas p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      <StepIcon className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-medium text-muted">Step {index + 1}</span>
                  </div>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          aria-labelledby="features-title"
          className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6"
        >
          <h2 id="features-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Everything in one place
          </h2>
          <p className="mt-3 max-w-2xl text-muted">
            Each area has its own page with charts, a list you can edit and tips based on your
            numbers.
          </p>
          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ title, text, icon: FeatureIcon, color }) => (
              <li key={title} className="card p-5">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ color, backgroundColor: `${color}1A` }}
                >
                  <FeatureIcon className="h-4 w-4" />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="trust-title" className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
          <div className="card grid grid-cols-1 gap-8 p-6 sm:p-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 id="trust-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Careful with your numbers
              </h2>
              <p className="mt-3 text-muted">
                The assistant suggests and the app checks everything before it is saved.
              </p>
            </div>
            <ul className="space-y-3">
              {PROMISES.map((promise) => (
                <li key={promise} className="flex gap-3 text-sm">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-health" />
                  {promise}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="start-title" className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
          <div className="rounded-2xl bg-brand-50 px-6 py-10 text-center sm:px-10">
            <h2
              id="start-title"
              className="text-2xl font-semibold tracking-tight text-brand-900 sm:text-3xl"
            >
              Start with one sentence
            </h2>
            <p className="mx-auto mt-3 max-w-md text-brand-800">
              Create an account, tell it about your day and watch your dashboards fill in.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/register" className="btn-primary px-5 py-3">
                Create an account
              </Link>
              <Link to="/login" className="btn-ghost px-5 py-3">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-muted sm:px-6">
          <p>© {new Date().getFullYear()} SaarthiOS</p>
          <nav aria-label="Footer" className="flex gap-4">
            <Link to="/login" className="hover:text-ink">
              Sign in
            </Link>
            <Link to="/register" className="hover:text-ink">
              Create an account
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function ChatPreview() {
  return (
    <figure className="card animate-fade-up p-4 [animation-delay:120ms] sm:p-6">
      <figcaption className="mb-4 flex items-center gap-2 text-xs font-medium text-muted">
        <span className="h-2 w-2 rounded-full bg-health" aria-hidden="true" />
        Example chat
      </figcaption>
      <div className="space-y-3 text-sm">
        <p className="brand-solid ml-auto w-fit max-w-[90%] rounded-2xl rounded-br-md px-4 py-2.5">
          Spent 250 on lunch and 80 on an auto. Had 2 rotis and dal for dinner.
        </p>
        <p className="max-w-[92%] rounded-2xl rounded-bl-md border border-line bg-canvas px-4 py-2.5">
          Expenses of INR 330 recorded. Meal logged: roti (2), dal (1 katori). Roughly 420 kcal,
          18 g protein.
        </p>
        <ul aria-label="Agents that ran" className="flex flex-wrap gap-2 text-xs text-muted">
          <li className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1">
            <CheckIcon className="h-3 w-3 text-expense" />
            Expense Agent
          </li>
          <li className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1">
            <CheckIcon className="h-3 w-3 text-health" />
            Health Agent
          </li>
        </ul>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4">
        <div>
          <dt className="text-xs text-muted">Spent today</dt>
          <dd className="mt-1 text-lg font-semibold">₹330</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Calories today</dt>
          <dd className="mt-1 text-lg font-semibold">420 kcal</dd>
        </div>
      </dl>
    </figure>
  );
}
