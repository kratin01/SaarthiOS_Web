# SaarthiOS — Web

The SaarthiOS web app: a chat interface and four dashboards.

React 18 + Vite + TypeScript + Tailwind. Charts are Recharts.

> The API lives in its own repository, **SaarthiOS**. This app is static files only — it holds no
> secrets and talks to the API over HTTPS.

---

## Run it

```powershell
npm install
npm run dev
```

Opens on `http://localhost:5173`. Requests to `/api` are forwarded to the API on port 5000
automatically, so there is nothing to configure in development — just have the API running too.

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Dev server with hot reload            |
| `npm run build`     | Type-check, then build into `dist/`   |
| `npm run preview`   | Serve the built files locally         |
| `npm run typecheck` | Type-check only                       |

---

## Building for production

One environment variable, set at **build time** (Vite bakes it into the bundle):

```ini
VITE_API_URL=https://api.your-domain.com
```

No `/api` on the end and no trailing slash — the code appends `/api` itself.

```powershell
npm run build     # writes dist/
```

`dist/` is plain static files. Upload them to S3, Cloudflare Pages, or any web server. Because the
app uses client-side routing, whatever serves it must return `index.html` for unknown paths, or
refreshing on `/chat` gives a 404. Deployment notes are in the API repository's `DEPLOYMENT.md`.

---

## The folders

```
src/
├── main.tsx        mounts React
├── App.tsx         the routes, and the sign-in guard
├── index.css       the design system: colours, buttons, inputs, cards
├── types.ts        the shape of everything the API returns
├── api/            every backend call
├── components/     reusable pieces
├── pages/          one file per screen
├── context/        the signed-in user
├── hooks/          shared behaviour
└── lib/            formatting helpers
```

`api/`, `components/` and `pages/` each have their own README.

---

## Files outside those folders

| File           | What it does                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------- |
| `main.tsx`     | Mounts the app inside the router. Three lines of real work.                                          |
| `App.tsx`      | Lists every route. Anything inside `AppShell` redirects to `/login` when there is no signed-in user.   |
| `index.css`    | Tailwind plus the shared classes: `.card`, `.input`, `.btn-primary`, `.chip`. Change a button here and every button changes. |
| `types.ts`     | TypeScript versions of the API responses. Editing a server response starts here.                     |
| `context/AuthContext.tsx` | Holds the signed-in user. On load it swaps the stored token for the account, which also clears expired sessions. |
| `context/ThemeContext.tsx` | Light or dark. Follows the system until you choose, then remembers. |
| `hooks/useFetch.ts` | "Fetch this, show a spinner, show an error, let me retry." Every data page uses it, so loading feels the same everywhere. |
| `lib/format.ts` | Money, dates, labels and the chart colour palette.                                                  |

---

## The look

Calm and low-contrast, on purpose. Nothing shouts. There are two themes, and the toggle sits next
to your name in the sidebar — it follows your operating system until you pick one yourself, then it
remembers.

| Token       | Light     | Dark      | Used for                             |
| ----------- | --------- | --------- | ------------------------------------ |
| `canvas`    | `#F6F7F4` | `#151917` | Page background                      |
| `surface`   | `#FFFFFF` | `#1E2320` | Cards                                |
| `line`      | `#E8EAE4` | `#2D3430` | Borders and dividers                 |
| `ink`       | `#2B322E` | `#E7EBE6` | Text                                 |
| `muted`     | `#78827C` | `#8D9890` | Secondary text                       |
| `brand`     | sage      | sage      | Buttons, active nav                  |
| `expense`   | `#C08457` | `#D19A70` | Terracotta — anything about spending  |
| `health`    | `#6F9E7E` | `#85B896` | Green — anything about food           |
| `invest`    | `#6B87A8` | `#86A3C4` | Dusty blue — anything about investing |

Each life area keeps its colour in both themes: sidebar icon, stat card, chart line. You learn it
once.

Colours are CSS variables behind Tailwind's names, so a component still writes `bg-canvas` or
`text-ink` and never thinks about the theme. Two details are worth knowing:

* **The brand scale flips at the tint end.** Pairs like `bg-brand-50 text-brand-700` need a light
  tint with dark text in one theme and the reverse in the other, so those steps invert while the
  mid-tones stay put.
* **Filled buttons use `.brand-solid`, not `bg-brand-500 text-white`.** A mid-tone block with white
  text fails contrast on a dark page, so the class carries its own text colour and dark mode uses a
  light block with dark ink.

Layout: one column on phones, two on tablets, sidebar plus grid on desktop. The sidebar becomes a
slide-in drawer below 1024px.

---

## Where the data comes from

```
page  →  useFetch  →  api/  →  axios  →  /api/…  →  server
```

There is no global data store. Each page fetches what it needs, and `AuthContext` holds the only
thing that is genuinely global — who is signed in.
