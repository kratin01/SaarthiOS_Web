# `api/` — talking to the server

Two files. Components import from `index.ts` and never touch axios directly.

| File        | What it does                                                          |
| ----------- | --------------------------------------------------------------------- |
| `http.ts`   | The shared axios instance, the token, and error-to-sentence conversion |
| `index.ts`  | Every backend call the app makes, grouped by feature                   |

---

## `http.ts`

Three things live here.

**`tokenStore`** — reads and writes the JWT in `localStorage` under `saarthios.token`.

**`http`** — the axios instance. Two interceptors do the repetitive work:

* Before a request: attach `Authorization: Bearer <token>` if there is one.
* After a failed response: decide whether a 401 means "your session died".

That second decision is fussier than it looks:

| 401 from | What happens | Why |
| -------- | ------------ | --- |
| `/auth/login`, `/auth/register`, `/auth/google` | Nothing — the page shows the error | A 401 here means wrong credentials, not a dead session |
| Anything else, while on `/login` or `/register` | Token cleared, no redirect | `AuthContext` checks `/auth/me` on every load. Redirecting to `/login` *from* `/login` is a full reload, and would loop forever |
| Anything else, anywhere else | Token cleared, sent to `/login` | The session is gone; staying put would leave the user stuck |

The route guard remembers where you were headed, so signing in returns you there rather than
dumping you on the dashboard.

**`errorMessage(error)`** — turns any thrown thing into a sentence you can put on screen:

| Situation                | You see                                    |
| ------------------------ | ------------------------------------------ |
| Server sent a message    | That message                               |
| Request timed out        | "The request took too long. Try again."    |
| Server unreachable       | "Cannot reach the server. Is it running?"  |
| Anything else            | The fallback you passed in                 |

---

## `index.ts`

One object per feature, each method returning already-unwrapped, typed data.

| Object          | Methods                                                  |
| --------------- | -------------------------------------------------------- |
| `authApi`       | `register`, `login`, `google`, `providers`, `me`, `updateProfile`, `bodyTargets` |
| `chatApi`       | `send`, `history`, `status`                              |
| `dashboardApi`  | `overview`                                               |
| `expenseApi`    | `list`, `create`, `update`, `remove`                     |
| `mealApi`       | `list`, `create`, `update`, `remove`                     |
| `investmentApi` | `list`, `create`, `update`, `remove`, `holdings`          |
| `agentApi`      | `list`, `create`, `update`, `remove`, `entries`, `createEntry`, `removeEntry` |
| `metaApi`       | `options`                                                |

`authApi.providers()` needs no token — the sign-in page calls it to find out whether to show the
Google button, and to get the public Google client id. Keeping the id on the server means it is
configured in exactly one place.

Typical use inside a page:

```tsx
const { data, loading, error, reload } = useFetch(() => expenseApi.list(range), [range]);
```

---

## Adding an endpoint

1. Add its response shape to `src/types.ts`.
2. Add the method to the matching object in `index.ts`.
3. Call it from a page through `useFetch`.

Nothing else needs to change — the token, the base URL and the error handling are already wired.
