# Frontend, TaskList web

Express server that serves the UI from `public/` and forwards `/api` requests to
the backend.

There is no build step. The files in `public/` are the application as it runs.

## Running it

```bash
npm install
node server.js
```

| | |
|---|---|
| Runtime | Node.js 20 or newer |
| Listens on | port 3000 by default |
| Needs | the backend |

## Environment variables

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `3000` | Port to listen on |
| `BACKEND_URL` | `http://localhost:8080` | Where `/api` requests are forwarded |
| `APP_VERSION` | `0.0.0-dev` | Shown in the page footer |
| `INSTANCE_NAME` | hostname | Leave it unset |

## Why the proxy exists

The browser only ever talks to this server. Requests to `/api` are forwarded
server-side, so the backend does not need to be reachable from the browser and
there is no CORS configuration anywhere.

## Note on startup

The page loads even when the backend is unreachable. The status line says so and
the list shows an error. That is expected behaviour, not a fault.
