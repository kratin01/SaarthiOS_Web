# SaarthiOS Web

SaarthiOS is a small personal app for the everyday things that are easy to lose track of: what you
spent, what you ate, and what you put away.

The idea is simple. Instead of filling forms or keeping a spreadsheet alive, you just say what
happened and the app files it for you.

**Live at [saarthios.space](https://saarthios.space)**

This is the web app. The API lives in [SaarthiOS](https://github.com/kratin01/SaarthiOS).

---

## What it does

### You talk, it logs

Type something like *"spent 250 on lunch and 80 on auto"* or *"had 2 rotis, dal and a bowl of
curd"*. An assistant reads it, works out the amounts, the categories and the calories, and saves
each piece in the right place. One sentence can update several things at once.

If something is ambiguous, like a portion size, it asks a short follow up instead of guessing.

### Expenses

Where your money actually went this week, month or year. Totals, a daily trend, a split by
category, and the places you spend most. Every entry stays editable.

### Health

Meals with calories and protein, carbs and fat, measured against a daily goal. Add your height,
weight and what you are aiming for, and it works out a sensible calorie and protein target
instead of making you look it up.

### Investments

What you have contributed, split by type, month by month. Ask it to check prices and it fetches
live quotes for your shares so you can see how they are doing against what you paid. Prices are
only fetched when you ask, so nothing on screen is quietly out of date.

### Your own trackers

The four built in areas are not the whole story, so you can build your own. Make a *Workout*
tracker with the fields you care about, then say *"did 30 minutes chest and 20 pushups"* and it
logs there too. Reading, sleep, mood, water, study hours: whatever you actually want to watch.

### Import

Send it a bank statement PDF or CSV, or a photo of a bill, and it reads the rows and enters them
for you. You review before anything is saved.

### Tips

Ask, and it looks at your own numbers for the period you are viewing and suggests what to change.
Nothing generic, only what your data shows.

### Small things that matter

Light and dark themes that follow your system until you pick one. Works on a phone as well as a
laptop, and installs to your home screen. You can also plug in your own AI key from any of eleven
providers if you would rather not use the shared one.

---

## Tech

React 18, Vite, TypeScript, Tailwind and Recharts. Static files only, so it holds no secrets and
talks to the API over HTTPS.

## Quick start

```bash
npm install
npm run dev
```

Opens on `http://localhost:5173`. Vite forwards `/api` to the API on port 5000, so there is
nothing to configure. Just have the API running too.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check, then build into `dist/` |
| `npm run preview` | Serve the built files on `:4173` |
| `npm run typecheck` | Type-check only |

## Building for production

```bash
npm ci        # install exactly what the lockfile pins
npm run build # type-checks first, then writes dist/
```

`dist/` is plain static files, so any web server will do.

**The API is expected on the same origin.** nginx serves `/` from `dist/` and passes `/api` to the
backend, which means no configuration and no CORS in production.

Only set `VITE_API_URL` if the API really is on another domain. It is baked in at build time, so
changing it needs a rebuild rather than a restart, and a stale value there is invisible until the
app cannot reach the server. Leave it blank for the normal setup.

> Anything in a `VITE_` variable ships to the browser as readable text. A URL is fine. A key is
> not.

Two things must be true wherever `dist/` lands:

- **Unknown paths must return `index.html`.** React Router owns the URLs, so without this a
  refresh on `/chat` gives a 404. In nginx that is `try_files $uri $uri/ /index.html`.
- **`index.html` must not be cached hard.** Asset filenames contain a content hash and can be
  cached forever, but a stale `index.html` keeps pointing at the old bundle.

## Installable app

There is a manifest, icons and the iOS meta tags, and deliberately **no service worker**. Chrome
no longer requires one, and here it would only add offline support to an app where every screen
needs the API, while bringing the usual problem of people being stuck on a cached build after a
deploy. Updates arrive on launch, exactly like the website.

---

## Project structure

```
src/
├── main.tsx       mounts React
├── App.tsx        routes and the signed-in guard
├── index.css      the design system: colours, cards, inputs, buttons
├── types.ts       the shape of everything the API returns
├── api/           every backend call
├── components/    reusable pieces
├── pages/         one file per screen
├── context/       signed-in user, theme, service status
├── hooks/         shared behaviour such as useFetch
└── lib/           formatting helpers
```

`api/`, `components/` and `pages/` each have their own README.

There is no global store. Each page fetches what it needs through `useFetch`, and context holds
only what is genuinely shared: who is signed in, the theme, and whether the backend is healthy.

## Design

Calm and low contrast on purpose. Nothing shouts.

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `canvas` | `#F6F7F4` | `#151917` | Page background |
| `surface` | `#FFFFFF` | `#1E2320` | Cards |
| `line` | `#E8EAE4` | `#2D3430` | Borders |
| `ink` | `#2B322E` | `#E7EBE6` | Text |
| `muted` | `#78827C` | `#8D9890` | Secondary text |
| `expense` | `#C08457` | `#D19A70` | Anything about spending |
| `health` | `#6F9E7E` | `#85B896` | Anything about food |
| `invest` | `#6B87A8` | `#86A3C4` | Anything about investing |

Each area keeps its colour in both themes, on the sidebar icon, the stat card and the chart line,
so you learn it once. Colours are CSS variables behind Tailwind names, so a component writes
`bg-canvas` and never thinks about the theme.

One column on phones, two on tablets, sidebar plus grid on desktop. The sidebar becomes a slide in
drawer below 1024px.

---

## Contributing

Contributions are very welcome, whether that is a bug report, a rough idea, or a pull request.

```bash
git clone https://github.com/kratin01/SaarthiOS_Web.git
cd SaarthiOS_Web && npm install
npm run dev     # needs the API running on :5000
```

A few things worth knowing before you open a PR:

1. **`npm run build` must pass.** It type-checks before bundling, so it catches most mistakes.
2. **Use the shared classes.** `.card`, `.input`, `.btn-primary` and `.chip` live in `index.css`.
   Restyle a button there and every button follows. One off styles drift apart.
3. **Never hardcode a colour.** Use the tokens above, or dark mode breaks.
4. **Check phone widths.** Test at 320px and 390px and make sure the page does not scroll
   sideways. Give responsive grids an explicit `grid-cols-1` base, otherwise the implicit track
   grows to fit its content and overflows.
5. **Types come from `types.ts`.** If an API response changes, start there.

Please say what you changed and how you checked it, including which screen sizes if you touched
layout. Small PRs are easier to review and get merged faster.
