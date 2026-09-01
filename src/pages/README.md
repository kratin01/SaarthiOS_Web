# `pages/` — one file per screen

A page fetches its own data, holds its own small bits of state, and arranges components. Routes are
listed in `src/App.tsx`.

| File                  | Route            | What you see                                              |
| --------------------- | ---------------- | --------------------------------------------------------- |
| `AuthPage.tsx`        | `/login`, `/register` | Sign in or sign up                                   |
| `DashboardPage.tsx`   | `/`              | The overview of everything                                |
| `ChatPage.tsx`        | `/chat`          | The assistant                                             |
| `ExpensesPage.tsx`    | `/expenses`      | Spending analytics and the transaction list               |
| `HealthPage.tsx`      | `/health`        | Nutrition analytics and the meal list                     |
| `InvestmentsPage.tsx` | `/investments`   | Contribution analytics and the list                       |
| `CustomAgentPage.tsx` | `/a/:slug`       | One user-built agent — its stats, chart and entries       |
| `SettingsPage.tsx`    | `/settings`      | Profile, goals, the AI connection and your own agents     |

---

## `AuthPage.tsx`

Sign in and sign up are the same layout, switched by a `mode` prop — the two forms differ by one
field. If you are already signed in it redirects straight to where you were headed.

It asks the server which sign-in methods are available. When Google is configured, a
"Continue with Google" button appears above the form with an "or" divider; when it is not, the page
looks exactly as it did before.

## `DashboardPage.tsx`

The home screen, from a single `/api/dashboard` request.

A **Today / This month** toggle at the top switches the whole page — stats, both charts, the
category split and the insight lines. It opens on **Today**, since that is usually what you want to
know; the month view is one click away.

* **Insights** — one-line observations like "Spending today is 62% lower than yesterday". They come
  from plain arithmetic on the server, so they appear even without an AI key.
* **Two stat tiles** — spent and calories, each compared with the previous period. Investments are
  deliberately absent: a SIP is a monthly habit, not a daily number, so they live in their own tab.
* **Two trend charts** — a rolling week on Today, the month's days on This month.
* **A category donut** and the **recent activity** feed, which merges all three areas into one
  timeline.

## `ChatPage.tsx`

The main way to put anything into the system.

* **Threads.** "New chat" starts a clean one; past chats live behind a toggle in the header, off by
  default and remembered in `localStorage`. On narrow screens it opens as a drawer.
* **Your message appears immediately.** It is held in local state and rendered the moment you press
  Enter, with "Agents are working" underneath, then replaced by the real turn when the reply lands.
* **Follow-ups work.** Because a thread carries its own history, answering "one katori" to a portion
  question is understood as the answer.
* If no AI provider is set up it says so and links to Settings, rather than failing silently.

## `ExpensesPage.tsx` · `HealthPage.tsx` · `InvestmentsPage.tsx`

The three domain screens share one layout:

```
title + "Add" button
range pills
the Tips button
stat tiles
charts
the list, with edit and delete on hover
"Showing 50 of 143" + Load more
```

Lists load 50 rows at a time. The stat tiles and charts always describe the **whole range**, so they
do not move as you load more — only the list below grows.

Each one also has a small modal for adding a record by hand, so the app is fully usable without AI.
The same modal edits an existing row — correcting a wrong number is a fix, not a new entry, which is
why the assistant does not try to do it from chat.

Expenses additionally has **Import**: upload a bank statement (PDF or CSV) or a photo of a bill, and
the AI reads the transactions off it. You review the rows before anything is saved.

Investments has an extra **Shares** field that only appears when the type is `stocks`, because a
unit count is meaningless for a SIP. With a share count saved, **Check prices** fetches live prices
and shows profit or loss per holding. Prices are never fetched on page load — it is an outside call,
so it happens only when you ask.

On Health the modal takes a single food item on purpose — for a real meal it is faster to describe
it in chat and let the Health Agent estimate every item for you. Editing an existing meal is
different: it opens with every item the agent logged, so a wrong protein estimate can be corrected
where it actually is. The meal total recalculates itself on save.

Health also opens with the **body profile** card. Height, weight and a goal (lean, maintain or bulk)
give you a BMI and suggested daily calorie and protein targets. The suggestion lands in editable
fields and nothing is saved until you press Save — it is a starting point, not a prescription.

## `CustomAgentPage.tsx`

The same layout as the three above, except **nothing on it is hardcoded**. The stat tiles, the
chart and the add form are all generated from `agent.fields` — the stats the user chose when they
built the agent in Settings. One page component serves every agent anyone ever creates.

It is mounted at `/a/:slug` rather than `/:slug` so a user naming an agent "Chat" or "Settings"
can never shadow a real route.

## `SettingsPage.tsx`

Name, currency, monthly budget and daily calorie goal. Setting a budget is what switches on the
budget insight and the progress bar on the overview.

The **AI provider** panel is where you choose a provider, paste a key and pick a model — no redeploy
and no `.env` edit. Keys are stored encrypted on the server and never come back to the browser; the
panel only shows a hint like `AQ.Ab…5xKq`.

---

## Adding a page

1. Create the file here.
2. Add a `<Route>` in `src/App.tsx`.
3. Add an entry to the `NAV` array in `components/layout/AppShell.tsx`.
