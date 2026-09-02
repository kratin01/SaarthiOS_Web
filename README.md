# SaarthiOS — Web

The [SaarthiOS](https://saarthios.space) web app: a chat assistant and four dashboards for money,
food, investments and anything else you want to track.

Static files only — it holds no secrets and talks to the API over HTTPS. The API lives in
[SaarthiOS](https://github.com/kratin01/SaarthiOS).

**Stack:** React 18 · Vite · TypeScript · Tailwind · Recharts

---

## Quick start

```bash
npm install
npm run dev
```

Opens on `http://localhost:5173`. Vite proxies `/api` to the API on port 5000, so there is nothing
to configure — just have the API running too.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check, then build into `dist/` |
| `npm run preview` | Serve the built files on `:4173` |
| `npm run typecheck` | Type-check only |

---

## Building for production

```bash
npm ci        # install exactly what the lockfile pins
npm run build # type-checks first, then writes dist/
```

`dist/` is plain static files. Serve them from any web server.

**The API is expected on the same origin.** nginx serves `/` from `dist/` and proxies `/api` to
the backend, so no configuration is needed and there is no CORS in production.

Only set `VITE_API_URL` if the API is genuinely on a different domain. It is baked in at **build
time**, so changing it needs a rebuild, not a restart — and a stale value here is invisible until
the app can't reach the server. Leave it blank for the standard setup.

> Anything in a `VITE_` variable ships to the browser in plain text. A URL is fine; a key never is.

Two things must be true wherever `dist/` lands:

- **Unknown paths must return `index.html`.** React Router owns the URLs, so without this a refresh
  on `/chat` is a 404. nginx does it with `try_files $uri $uri/ /index.html`.
- **`index.html` must not be cached aggressively.** Asset filenames are content-hashed and safe to
  cache forever, but a stale `index.html` keeps pointing at the old bundle.

---

## Installable app

The app is installable to a home screen or desktop: a manifest, icons and the iOS meta tags, and
**no service worker on purpose**. Chrome no longer requires one, and the only thing it would add
here is offline support for an app where every screen needs the API — while introducing the usual
failure mode of users being stuck on a cached bundle after a deploy. Updates land on launch,
exactly like the website.

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
├── hooks/         shared behaviour, e.g. useFetch
└── lib/           formatting helpers
```

`api/`, `components/` and `pages/` each have their own README.

There is no global store. Each page fetches what it needs through `useFetch`, and context holds
only what is genuinely shared — who is signed in, the theme, and whether the backend is healthy.

---

## Design

Calm and low-contrast on purpose. Two themes; the toggle follows your system until you choose,
then remembers.

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

Each life area keeps its colour in both themes — sidebar icon, stat card, chart line — so you learn
it once. Colours are CSS variables behind Tailwind names, so components write `bg-canvas` and never
think about the theme.

Layout is one column on phones, two on tablets, sidebar plus grid on desktop. The sidebar becomes a
slide-in drawer below 1024px.

---

## Contributing

Issues and pull requests are welcome.

```bash
git clone https://github.com/kratin01/SaarthiOS_Web.git
cd SaarthiOS_Web && npm install
npm run dev     # needs the API running on :5000
```

Before opening a PR:

1. **`npm run build` must pass.** It type-checks before it bundles, so this catches most mistakes.
2. **Use the shared classes.** `.card`, `.input`, `.btn-primary`, `.chip` live in `index.css`.
   Restyling a button there changes every button; one-off styles drift.
3. **Never hardcode a colour.** Use the tokens above, or dark mode breaks.
4. **Check phone widths.** Test at 320px and 390px and confirm the page does not scroll sideways.
   Give responsive grids an explicit `grid-cols-1` base, or the implicit track grows to its
   content and overflows.
5. **Types come from `types.ts`.** If you change an API response, start there.

Say what you changed and how you verified it — including which screen sizes you checked, if it
touched layout.
