# TaskList

A three tier task list. Add a task, tick it off, delete it. That is the whole
application.

Your job is not to change it. Your job is to package it, deploy it, and ship it.

## The three tiers

```
  browser  ->  frontend :3000  ->  backend :8080  ->  mongodb :27017
               Node + Express      Node + Express     stock image
               serves the UI       REST API           stores the todos
               proxies /api
```

| Folder | What it is |
|---|---|
| `frontend/` | The web UI and its server |
| `backend/` | The REST API |
| none | MongoDB, use the official `mongo` image as it is |

MongoDB needs nothing built. It creates its collection on the first write.

Each folder has a `README.md` listing its port and its environment variables.
That is all you need.

## Environment variables you will need

| Tier | Variable | Example |
|---|---|---|
| frontend | `BACKEND_URL` | `http://backend:8080` |
| frontend | `APP_VERSION` | `1.0.0` |
| backend | `MONGO_URL` | `mongodb://root:secret@mongodb:27017/?authSource=admin` |
| backend | `APP_VERSION` | `1.0.0` |
| mongodb | `MONGO_INITDB_ROOT_USERNAME` | `root` |
| mongodb | `MONGO_INITDB_ROOT_PASSWORD` | `secret` |

`MONGO_URL` contains a password. It is not the same kind of thing as
`APP_VERSION`, and it should not be handled the same way.

## Rules

1. Nothing from the tables above may be baked into an image. The same image must
   run anywhere with different values.
2. One image per tier. Two Dockerfiles, since MongoDB is used as published.
3. `latest` is not a version.

## You can check each tier on its own

Neither tier crashes when the thing below it is missing, so you can verify your
images one at a time.

| Tier | Your image is correct when |
|---|---|
| backend | `curl localhost:8080/api/info` returns your `APP_VERSION`, with `databaseConnected: false` |
| frontend | the page loads and the status line says the backend is unreachable |

Both of those are a pass.

## Useful to know

- `APP_VERSION` appears in the page footer. Once you are deploying through a
  pipeline, that is how you prove the running version is the one you built.
- The footer also shows which backend instance answered. When you scale to more
  than one replica, watch it change.
