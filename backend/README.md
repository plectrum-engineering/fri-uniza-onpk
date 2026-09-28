# Backend, TaskList API

Express REST API storing todos in MongoDB.

## Running it

```bash
npm install
node server.js
```

| | |
|---|---|
| Runtime | Node.js 20 or newer |
| Listens on | port 8080 by default |
| Needs | MongoDB |

## Environment variables

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `8080` | Port to listen on |
| `MONGO_URL` | `mongodb://localhost:27017` | Connection string. Contains the password, so treat it as a secret. |
| `MONGO_DB` | `todos` | Database name |
| `APP_VERSION` | `0.0.0-dev` | Shown in the page footer |
| `INSTANCE_NAME` | hostname | Which instance answered. Leave it unset. |

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/info` | Version, instance, whether the database is connected |
| GET | `/healthz` | Returns 200 while the process is running |
| GET | `/api/todos` | List todos |
| POST | `/api/todos` | Create one. Body: `{"title": "..."}` |
| PATCH | `/api/todos/:id` | Mark done or not done. Body: `{"done": true}` |
| DELETE | `/api/todos/:id` | Delete one |

## Note on startup

The API starts and answers even when MongoDB is unreachable. It retries the
connection in the background. Endpoints that need data return 503 until the
connection succeeds, and `/api/info` reports `databaseConnected: false`.

This means you can check your container works without MongoDB running.
