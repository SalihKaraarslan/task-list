# Task List App

A simple task list built as a full-stack take-home assignment: a React Native (Expo) mobile app
talking to a Node.js / Express / GraphQL backend backed by MongoDB.

- Create tasks, mark them as completed (or pending again).
- Search by title, filter by status, scroll through pages, pull to refresh.
- Optimistic updates: a tap changes the list right away and rolls back if the server says no.

## Quick start

You only need to edit one file: `backend/.env` (the MongoDB connection string). The mobile app
needs no configuration.

**Backend**

```bash
cd backend
npm install
cp .env.example .env   # open .env and set MONGODB_URI (see "MongoDB connection string" below)
npm run dev            # API on http://localhost:4000, Sandbox on http://localhost:4000/graphql
```

**Mobile** (in a second terminal, with the backend running)

```bash
cd mobile
npm install
npx expo login         # Expo Go on iOS needs the same account signed in on the phone
npx expo start         # scan the QR code with Expo Go (Android) or the Camera app (iOS)
```

| File           | Required | Content                                                                                             |
| -------------- | -------- | --------------------------------------------------------------------------------------------------- |
| `backend/.env` | Yes      | `MONGODB_URI`: your Atlas or local connection string. `PORT` is optional (default 4000).            |
| `mobile/.env`  | No       | Only if the phone cannot reach the backend: `EXPO_PUBLIC_API_URL=http://<computer-ip>:4000/graphql` |

If a connection string was shared with this submission, paste it as `MONGODB_URI` and skip the
Atlas steps below.

## Tech stack

| Part    | Stack                                                                                   |
| ------- | --------------------------------------------------------------------------------------- |
| Backend | Node.js 24, TypeScript, Express 5, Apollo Server 5 (GraphQL), Mongoose 9, MongoDB Atlas |
| Mobile  | Expo SDK 57 (React Native 0.86), TypeScript, Redux Toolkit + RTK Query, graphql-request |
| Tooling | ESLint 9, Prettier, `tsx` for the dev server                                            |

## Project structure

```
task-list/
├── backend/                 # GraphQL API
│   └── src/
│       ├── server.ts        # Connects to MongoDB, then starts the HTTP server
│       ├── app.ts           # Express app: middleware chain + Apollo Server on /graphql
│       ├── config/          # Environment variables (validated at startup)
│       ├── db/              # MongoDB connection
│       ├── middleware/      # Request logger, JSON 404, error handler
│       ├── graphql/         # Schema (typeDefs), resolvers, error helpers, formatError
│       ├── modules/tasks/   # Task model, service, validation, mapper, types
│       └── utils/           # Cursor encoding, regex escaping
└── mobile/                  # Expo app
    ├── App.tsx              # Redux Provider + SafeAreaProvider + screen
    └── src/
        ├── app/             # Redux store and typed hooks
        ├── api/             # graphql-request client, RTK Query base query, GraphQL documents
        ├── features/tasks/  # RTK Query API, filter slice, screen, components, validation
        ├── components/      # Shared UI (ErrorBanner)
        ├── hooks/           # useDebounce
        ├── config/          # Backend URL resolution
        └── theme/           # Colors, spacing, font sizes
```

Each package is independent and has its own `package.json` and lockfile.

## Prerequisites

- Node.js 20.19 or newer (developed and tested on Node 24).
- A MongoDB database: a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster or a local
  MongoDB.
- A phone with [Expo Go](https://expo.dev/go) (SDK 57) on the same Wi-Fi network as your computer.
- A free Expo account. Since SDK 57, Expo Go on iOS requires you to be signed in both in the
  terminal (`npx expo login`) and in the Expo Go app with the same account.

## 1. Backend

Commands are in the Quick start above. This section explains the connection string and the tools.

### MongoDB connection string

**Atlas (recommended):**

1. Create a free cluster.
2. _Database Access_: create a database user with a password.
3. _Network Access_: add your current IP address (or `0.0.0.0/0` while developing).
4. _Connect → Drivers_: copy the connection string and put it in `backend/.env`. Add the database
   name (`/tasklist`) after the host:

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/tasklist?retryWrites=true&w=majority&appName=task-list
```

Special characters in the password must be URL-encoded (`@` → `%40`, `:` → `%3A`).

**Local MongoDB:** install it (for example `brew tap mongodb/brew && brew install mongodb-community`
and `brew services start mongodb-community`) and use
`MONGODB_URI=mongodb://127.0.0.1:27017/tasklist`.

The server connects to MongoDB before it starts listening. If the connection fails, it exits with a
clear error. Indexes are created automatically on first start.

### Try the API

- Open `http://localhost:4000/graphql` in a browser to get the Apollo Sandbox (schema explorer and
  query editor).
- `GET http://localhost:4000/health` returns `{ "status": "ok", "db": "connected" }`.

### Scripts

| Script                 | What it does                                    |
| ---------------------- | ----------------------------------------------- |
| `npm run dev`          | Start with auto-reload (`tsx watch`)            |
| `npm run build`        | Compile TypeScript to `dist/`                   |
| `npm start`            | Run the compiled server (`node dist/server.js`) |
| `npm run typecheck`    | `tsc --noEmit`                                  |
| `npm run lint`         | ESLint                                          |
| `npm run format:check` | Prettier check (`npm run format` to fix)        |

Environment variables: `MONGODB_URI` (required), `PORT` (default `4000`), `NODE_ENV`. In production
(`NODE_ENV=production`) introspection and the Sandbox are off, helmet's Content-Security-Policy is
on, and internal error details are hidden from clients.

## 2. Mobile app

Commands are in the Quick start above. Make sure the backend is running and that the phone and
the computer are on the same Wi-Fi network.

### Backend address

The app finds the backend on its own: it takes the IP address of the computer that runs
`expo start` and uses port `4000`. No `.env` file is needed. If that does not work on your
network, create `mobile/.env` with one line:

```
EXPO_PUBLIC_API_URL=http://<your-computer-ip>:4000/graphql
```

(macOS: `ipconfig getifaddr en0` prints the address.) Then restart `expo start` and reload the app.

### Troubleshooting

- **"Could not reach the server"**: the backend is not running, the phone is on another network, or
  the firewall blocks port 4000. `npx expo start --tunnel` only tunnels the JavaScript bundle, not
  the backend, so the phone still needs to reach your computer directly.
- **"Project is incompatible with this version of Expo Go"**: update Expo Go to the SDK 57 build.
- **iOS shows a login error**: sign in with the same Expo account in the terminal and in Expo Go.

### Scripts

| Script                 | What it does                              |
| ---------------------- | ----------------------------------------- |
| `npm start`            | `expo start`                              |
| `npm run typecheck`    | `tsc --noEmit`                            |
| `npm run lint`         | `expo lint` (ESLint with the Expo config) |
| `npm run format:check` | Prettier check (`npm run format` to fix)  |

## GraphQL API

Single endpoint: `POST /graphql`. Requests and responses are JSON. The mobile app only uses the
operations below.

```graphql
enum TaskStatus {
  PENDING
  COMPLETED
}

type Task {
  id: ID!
  title: String!
  status: TaskStatus!
  createdAt: String! # ISO 8601
}

input TaskFilter {
  status: TaskStatus # only tasks with this status
  search: String # only tasks whose title starts with this text (case-insensitive)
}

type TaskConnection {
  items: [Task!]!
  nextCursor: String # send it back as "after" to get the next page; null on the last page
  totalCount: Int! # tasks that match the filter, across all pages; counted only when requested
}

type TaskStats {
  pending: Int!
  completed: Int!
  total: Int!
}

type Query {
  getTasks(filter: TaskFilter, first: Int = 20, after: String): TaskConnection!
  taskStats(filter: TaskFilter): TaskStats!
}

type Mutation {
  createTask(title: String!): Task!
  updateTask(id: ID!, status: TaskStatus!): Task!
}
```

### Examples

Fetch the first page (the assignment's `getTasks` — no arguments needed):

```graphql
query {
  getTasks {
    items {
      id
      title
      status
      createdAt
    }
    nextCursor
    totalCount
  }
}
```

Next page, only pending tasks whose title starts with "bu":

```graphql
query NextPage($after: String) {
  getTasks(filter: { status: PENDING, search: "bu" }, first: 20, after: $after) {
    items {
      id
      title
    }
    nextCursor
  }
}
```

Create and update:

```graphql
mutation {
  createTask(title: "Buy milk") {
    id
    title
    status
  }
}

mutation {
  updateTask(id: "6aa42e54de909d06c4f777ab", status: COMPLETED) {
    id
    status
  }
}
```

Counts by status:

```graphql
query {
  taskStats {
    pending
    completed
    total
  }
}
```

With `curl`:

```bash
curl -s http://localhost:4000/graphql \
  -H 'content-type: application/json' \
  -d '{"query":"{ getTasks { items { id title status } totalCount } }"}'
```

### Errors

As is standard in GraphQL, errors thrown while resolving a field come back with HTTP 200 and an
`errors` array. Every error carries a machine-readable code in `extensions.code`:

| Code                        | When                                                                                                                                                                                                              |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BAD_USER_INPUT`            | Empty or too long title, a pending task with the same title already exists (on create, or when setting a completed task back to pending), search longer than 100 characters, `first` outside 1–50, invalid cursor |
| `NOT_FOUND`                 | `updateTask` with an unknown or malformed id                                                                                                                                                                      |
| `GRAPHQL_VALIDATION_FAILED` | Invalid query (for example a wrong enum value); HTTP 400                                                                                                                                                          |

```json
{
  "errors": [
    {
      "message": "Title is required",
      "extensions": { "code": "BAD_USER_INPUT", "argumentName": "title" }
    }
  ],
  "data": null
}
```

## Design decisions

**Backend**

- **One GraphQL endpoint instead of REST routes.** The schema is the contract: arguments and result
  types are typed and documented, and the Sandbox auto-completes them.
- **Thin resolvers, a service layer, a model.** Resolvers only pass arguments on. The service
  (`modules/tasks/task.service.ts`) holds the logic and talks to Mongoose. Documents are mapped to
  plain DTOs (`id` as a string, `createdAt` as an ISO string) before they leave the service.
- **Cursor pagination, not offset.** The cursor is the id of the last task on the page, encoded as
  base64url. MongoDB ObjectIds grow with time, so "id lower than the cursor, newest first" is a
  stable page even when new tasks arrive. Offset pagination would skip or repeat rows in that case.
  `getTasks` without arguments still returns the first 20 tasks, as the assignment asks.
- **Field-level resolver for `totalCount`.** Counting the matching tasks is a separate database
  query. It lives in a resolver for the `TaskConnection.totalCount` field, so GraphQL runs it only
  when a client asks for that field. The mobile app does not (its tabs use `taskStats`), so it
  never pays for the count; the Sandbox or another client can still request it.
- **Aggregation for the counts.** `taskStats` runs a `$match` + `$group` pipeline, so the database
  counts tasks by status and the API never loads the tasks themselves.
- **Prefix search that can use an index.** MongoDB cannot use an index range for a
  case-insensitive regex. Each task therefore stores a lower-cased copy of its title
  (`titleNormalized`) with an index; the search runs an anchored, case-sensitive regex on that
  field, which MongoDB turns into an index range scan (`["bu", "bv")`). User input is
  regex-escaped, so `b.*` is a literal search, not a pattern. A compound `{ status, _id }` index
  serves the filtered, paginated list query.
- **Middleware chain.** `helmet` (security headers) → request logger (method, path, GraphQL
  operation name, status, duration) → `/health` → `cors` + `express.json` + Apollo on `/graphql` →
  JSON 404 → JSON error handler. In development helmet's Content-Security-Policy is disabled because
  it blocks the Apollo Sandbox page; it is on in production.
- **Validation on both sides.** The backend is the source of truth (title 1–120 characters after
  trimming and collapsing repeated spaces, at most one pending task per title ignoring case and
  spacing — checked on create and when a task goes back to pending — search up to 100 characters,
  page size 1–50, cursor format, id format). The app repeats the title rules
  so the user gets instant feedback. Errors use consistent codes (`BAD_USER_INPUT`, `NOT_FOUND`);
  `formatError` also maps Mongoose validation and cast errors to those codes and hides internal
  errors in production.
- **Configuration is validated at startup** (`config/env.ts`); a missing `MONGODB_URI` stops the
  server with a clear message instead of failing on the first request.

**Mobile**

- **Redux Toolkit with a clear split.** Server data lives in the RTK Query cache
  (`features/tasks/tasksApi.ts`); UI state (search text, active tab) lives in a normal slice
  (`tasksFilterSlice.ts`). One store, typed hooks.
- **GraphQL over RTK Query.** A small custom `baseQuery` sends each operation with
  `graphql-request` and maps GraphQL errors (`extensions.code`, message) and network failures into
  one error shape that every hook receives.
- **Infinite query for the list.** `getTasks` is an RTK Query infinite query keyed by the filter;
  the cursor is the page param. `FlatList` calls `fetchNextPage` near the end of the list. Each
  filter combination is its own cache entry, so switching tabs back and forth is instant. A cached
  tab is refreshed in the background only when its data is older than 30 seconds
  (`refetchOnMountOrArgChange: 30`); there is no polling.
- **Cache invalidation with tags.** Creating a task invalidates the list and the stats. Updating a
  task is optimistic: every cached list is patched at once. The task gets its new status, leaves
  the tab it no longer belongs to and joins the tab it now belongs to at the right position
  (lists are newest-first and MongoDB ids grow with time). The stats refetch; on failure the
  patches are undone and the list is refetched.
- **Small, focused components** (`TaskForm`, `TaskSearch`, `TaskFilterTabs`, `TaskList`,
  `TaskItem`, `ListState`, `ErrorBanner`) with React Native's `StyleSheet` and a tiny theme file.
  Loading, error (with retry), empty, paginating and refreshing states are all handled. Errors
  that follow an action (a refused duplicate, a failed update) appear in a floating banner that
  never shifts the layout. No navigation library: the assignment is a single screen.
- **Duplicate check before the round trip.** A memoized selector collects the pending titles that
  are already in the RTK Query cache. Adding a title that is already pending, or moving a completed
  task back to pending while another pending task has its title, is refused instantly with a
  message — no request, no flicker. The backend enforces the same rule, so a duplicate that is not
  loaded yet is still caught (the optimistic change is then rolled back).
- **Search is debounced** (300 ms) so the backend is not queried on every keystroke.

**Left out on purpose** (to keep the scope of "a simple task list"): authentication, tests,
Docker, rate limiting, deleting tasks. Natural next steps would be a `deleteTask` mutation, a
user model with JWT auth (the GraphQL context is the place to resolve it), unit tests for the
service layer, and a CI workflow running `typecheck`, `lint` and `format:check` for both packages.
