// TaskList API
// Configuration comes from environment variables. See README.md.

const express = require('express');
const os = require('os');
const { MongoClient, ObjectId } = require('mongodb');

const PORT = process.env.PORT || 8080;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const MONGO_DB = process.env.MONGO_DB || 'todos';
const APP_VERSION = process.env.APP_VERSION || '0.0.0-dev';
const INSTANCE = process.env.INSTANCE_NAME || os.hostname();

const app = express();
app.use(express.json());

let todos = null; // set once the database connection succeeds

// Connect in the background and keep retrying. The API starts either way,
// so a slow database does not stop this container from running.
async function connectToMongo() {
  while (true) {
    try {
      const client = await MongoClient.connect(MONGO_URL, {
        serverSelectionTimeoutMS: 3000,
      });
      todos = client.db(MONGO_DB).collection('todos');
      console.log(`connected to mongodb, database "${MONGO_DB}"`);
      return;
    } catch (err) {
      console.warn(`mongodb not reachable: ${err.message}`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

function requireDb(res) {
  if (!todos) {
    res.status(503).json({ error: 'Database unavailable' });
    return false;
  }
  return true;
}

// --- info, no database needed --------------------------------------------

app.get('/api/info', (req, res) => {
  res.json({
    version: APP_VERSION,
    instance: INSTANCE,
    databaseConnected: todos !== null,
  });
});

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', instance: INSTANCE });
});

// --- todos ----------------------------------------------------------------

app.get('/api/todos', async (req, res) => {
  if (!requireDb(res)) return;
  const list = await todos.find().sort({ createdAt: -1 }).limit(100).toArray();
  res.json(list);
});

app.post('/api/todos', async (req, res) => {
  if (!requireDb(res)) return;

  const title = (req.body.title || '').trim();
  if (!title) return res.status(400).json({ error: 'Title is required' });
  if (title.length > 200) return res.status(400).json({ error: 'Title is too long' });

  const todo = {
    title,
    done: false,
    createdAt: new Date(),
    createdBy: INSTANCE,
  };
  const result = await todos.insertOne(todo);
  console.log(`created todo ${result.insertedId}`);
  res.status(201).json({ ...todo, _id: result.insertedId });
});

app.patch('/api/todos/:id', async (req, res) => {
  if (!requireDb(res)) return;
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  const result = await todos.findOneAndUpdate(
    { _id: new ObjectId(req.params.id) },
    { $set: { done: Boolean(req.body.done) } },
    { returnDocument: 'after' }
  );

  if (!result) return res.status(404).json({ error: 'Not found' });
  res.json(result);
});

app.delete('/api/todos/:id', async (req, res) => {
  if (!requireDb(res)) return;
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  const result = await todos.deleteOne({ _id: new ObjectId(req.params.id) });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

// --- start ----------------------------------------------------------------

app.listen(PORT, '0.0.0.0', () => {
  console.log(`tasklist-api ${APP_VERSION} listening on port ${PORT} as ${INSTANCE}`);
  console.log(`mongodb target: ${MONGO_URL.replace(/\/\/.*@/, '//***@')}`);
});

connectToMongo();
