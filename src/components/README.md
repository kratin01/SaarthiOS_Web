# `components/` — the reusable pieces

Nothing here fetches data. Components take props and render. That keeps them easy to reuse and
easy to reason about.

```
components/
├── ui/        small building blocks used everywhere
├── layout/    the frame around every page
├── charts/    Recharts wrappers
├── chat/      the conversation screen
├── auth/      sign-in extras
├── import/    reading a bill or statement
├── insights/  the "Tips" button every data screen shares
├── health/    the body profile card
├── investments/ live share prices and profit/loss
└── settings/  the AI provider panel and the agent builder
```

---

## `ui/`

| File              | What it is                                                                                             |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| `Card.tsx`        | A white panel with an optional title, description and header action. The container for almost everything.  |
| `Stat.tsx`        | The big number tile. Shows a value, an optional change arrow, and an optional progress bar for goals.      |
| `States.tsx`      | `Spinner`, `Loading`, `EmptyState`, `ErrorState`. Every list needs all four, so they live together.        |
| `Modal.tsx`       | A centred panel. Closes on Escape or a backdrop click, and locks page scrolling while open.               |
| `RangePicker.tsx` | The `Week · Month · Year` pills above each dashboard.                                                     |
| `Icons.tsx`       | Every icon in the app, as inline SVG. No icon library — smaller bundle, and they inherit text colour.     |

## `layout/`

| File           | What it is                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `AppShell.tsx` | The frame: sidebar, navigation, the account block, and the routed page. Below 1024px the sidebar becomes a slide-in drawer. |
| `Page.tsx`     | `Page` sets the padding and max width. `PageHeader` is the title, subtitle and action button.                             |

## `charts/`

| File         | What it is                                                                       |
| ------------ | ---------------------------------------------------------------------------------- |
| `Charts.tsx` | `TrendChart`, `BarsChart`, `DonutChart` and `Legend`                              |

One file so every chart shares the same axis styling, tooltip and "nothing here yet" message.

| Component    | Use it for                                        | Example                     |
| ------------ | ------------------------------------------------- | --------------------------- |
| `TrendChart` | Something over time                               | Spending per day            |
| `BarsChart`  | Comparing named buckets                           | Investment by month         |
| `DonutChart` | Share of a whole                                  | Spending by category        |
| `Legend`     | The colour key beside a donut, with percentages   | —                           |

Each takes `formatX` and `formatY` so the same chart can show rupees, calories or grams.

## `chat/`

| File                | What it is                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `MessageTurn.tsx`   | One exchange: your message on the right, the reply on the left. Also exports `UserBubble`.                          |
| `AgentActivity.tsx` | The collapsible trace under a reply — which agents ran, what each one did, how long it took.                        |
| `Composer.tsx`      | The input box. Grows as you type, Enter sends, Shift+Enter adds a line.                                              |
| `ConversationList.tsx` | The thread sidebar: "New chat" plus your past chats, with delete-on-hover.                                       |

`AgentActivity` is what makes the multi-agent behaviour visible instead of magic. When one sentence
creates both an expense and a meal, you can open it and see exactly that.

`UserBubble` is exported separately so the chat page can show your message the instant you press
Enter, before the server has replied.

## `auth/`

| File               | What it is                                                                    |
| ------------------ | ------------------------------------------------------------------------------- |
| `GoogleButton.tsx` | The "Continue with Google" button                                              |

Google's script is fetched on demand, so only visitors who reach the sign-in page download it — and
nothing loads at all when Google sign-in is switched off on the server.

Google draws the button itself. Their branding rules require it, and it keeps us out of the business
of handling popups. It sits **outside** the `<form>` on purpose: Google's markup includes a
clickable element that could otherwise submit the email/password form.

The component hands the resulting credential up to the page, which passes it to
`loginWithGoogle()`. It never touches the token itself.

## `settings/`

| File                 | What it is                                              |
| -------------------- | ------------------------------------------------------- |
| `AiProviderCard.tsx` | Pick a provider, paste a key, choose a model, test it    |
| `CustomAgentsCard.tsx` | Build your own agent: name, icon, the stats it tracks, and your instructions |
The key field is `type="password"` and only ever travels upward. What comes back is a hint like
`AQ.Ab…5xKq`, enough to recognise which key is saved and useless to anyone reading it.

"Load from provider" asks the provider which models the key can actually use, so the dropdown does
not go stale when a model is retired. "Test connection" makes one tiny live call, so a bad key or a
retired model shows up here rather than mid-conversation.

## `import/`

| File              | What it is                                            |
| ----------------- | ----------------------------------------------------- |
| `ImportModal.tsx` | Upload a bill or statement, review it, save what you tick |

Three steps: choose a file, review what was found, import. The review step is the point — a
statement can hold fifty lines, and none of them are saved until you say so. Unticking a row simply
leaves it out of the request.

One restaurant bill can produce an expense **and** a meal, so the review groups rows by type.

---

## House style

* Props are typed inline. No shared prop-type files to keep in sync.
* Styling is Tailwind classes plus the shared `.card` / `.btn-primary` / `.input` classes from
  `index.css`.
* Buttons that only show an icon carry an `aria-label`.
* Row actions (like delete) are `opacity-0 group-hover:opacity-100` so lists stay calm, but they
  also appear on keyboard focus.
