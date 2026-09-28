// Talks to /api on the same origin. The web server forwards it to the backend.

const $ = (id) => document.getElementById(id);

let items = [];
let filter = 'all';

const RING_LENGTH = 2 * Math.PI * 19;

// --- helpers ---------------------------------------------------------------

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function showError(message) {
  const box = $('error');
  if (!message) { box.hidden = true; return; }
  box.textContent = message;
  box.hidden = false;
}

async function readError(res, fallback) {
  try {
    const body = await res.json();
    return body.error || fallback;
  } catch {
    return fallback;
  }
}

// --- rendering -------------------------------------------------------------

const CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l5 5L19 7"/></svg>';
const CROSS = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const BOX = '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="3"/>'
          + '<path d="M8 3v4M16 3v4M8.5 13h7"/></svg>';

const EMPTY_TEXT = {
  all: 'Nothing here yet. Add your first task above.',
  active: 'All done. Nothing left to do.',
  done: 'No completed tasks yet.',
};

function visible() {
  if (filter === 'active') return items.filter((t) => !t.done);
  if (filter === 'done') return items.filter((t) => t.done);
  return items;
}

function render() {
  const list = $('list');
  const rows = visible();

  if (rows.length === 0) {
    list.innerHTML = `<li class="empty">${BOX}${EMPTY_TEXT[filter]}</li>`;
  } else {
    list.innerHTML = rows.map((t) => `
      <li class="${t.done ? 'done' : ''}" data-id="${t._id}">
        <button class="tick" aria-label="${t.done ? 'Mark as not done' : 'Mark as done'}"
                aria-pressed="${t.done}">${CHECK}</button>
        <span class="text">${escapeHtml(t.title)}</span>
        <button class="del" aria-label="Delete task">${CROSS}</button>
      </li>`).join('');
  }

  const total = items.length;
  const done = items.filter((t) => t.done).length;
  const open = total - done;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  $('sub').textContent = total === 0
    ? 'Nothing to do'
    : `${done} of ${total} complete`;

  $('ring-label').textContent = `${percent}%`;
  $('ring-fill').style.strokeDashoffset = RING_LENGTH * (1 - percent / 100);
  $('ring-fill').style.opacity = percent === 0 ? 0 : 1;

  const foot = $('card-foot');
  foot.hidden = total === 0;
  $('remaining').textContent = open === 1 ? '1 task left' : `${open} tasks left`;
  $('clear-done').hidden = done === 0;
}

// --- data ------------------------------------------------------------------

async function loadTodos() {
  try {
    const res = await fetch('/api/todos');
    if (!res.ok) throw new Error(await readError(res, 'Could not load your tasks'));
    items = await res.json();
    showError(null);
    render();
  } catch (err) {
    items = [];
    $('list').innerHTML = `<li class="empty">${BOX}Your tasks are not available right now.</li>`;
    $('card-foot').hidden = true;
    $('sub').textContent = 'Unavailable';
    $('ring-label').textContent = '--';
    $('ring-fill').style.strokeDashoffset = RING_LENGTH;
    $('ring-fill').style.opacity = 0;
    showError(err.message);
  }
}

async function loadInfo() {
  try {
    const v = await (await fetch('/version')).json();
    $('web-version').textContent = v.version;
  } catch { /* served by this same server, rarely fails */ }

  const pip = $('pip');
  try {
    const res = await fetch('/api/info');
    if (!res.ok) throw new Error();
    const info = await res.json();
    $('api-version').textContent = info.version;
    $('api-instance').textContent = info.instance;
    if (info.databaseConnected) {
      pip.className = 'pip ok';
      $('status').textContent = 'connected';
    } else {
      pip.className = 'pip bad';
      $('status').textContent = 'database unavailable';
    }
  } catch {
    pip.className = 'pip bad';
    $('status').textContent = 'backend unreachable';
    $('api-version').textContent = '?';
    $('api-instance').textContent = '?';
  }
}

// --- actions ---------------------------------------------------------------

$('add-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = $('title');
  const title = input.value.trim();
  if (!title) return;

  $('add-btn').disabled = true;
  try {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error(await readError(res, 'Could not add the task'));
    input.value = '';
    showError(null);
    await loadTodos();
  } catch (err) {
    showError(err.message);
  } finally {
    $('add-btn').disabled = false;
    input.focus();
  }
});

$('list').addEventListener('click', async (event) => {
  const li = event.target.closest('li[data-id]');
  if (!li) return;
  const id = li.dataset.id;

  try {
    if (event.target.closest('.tick')) {
      const done = !li.classList.contains('done');
      li.classList.toggle('done', done); // optimistic, feels instant
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done }),
      });
      if (!res.ok) throw new Error(await readError(res, 'Could not update the task'));
      await loadTodos();
    }

    if (event.target.closest('.del')) {
      const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await readError(res, 'Could not delete the task'));
      await loadTodos();
    }
  } catch (err) {
    showError(err.message);
    await loadTodos();
  }
});

$('filters').addEventListener('click', (event) => {
  const chip = event.target.closest('.chip');
  if (!chip) return;
  filter = chip.dataset.filter;
  document.querySelectorAll('.chip').forEach((c) => {
    c.classList.toggle('is-active', c === chip);
  });
  render();
});

$('clear-done').addEventListener('click', async () => {
  const done = items.filter((t) => t.done);
  try {
    await Promise.all(done.map((t) =>
      fetch(`/api/todos/${t._id}`, { method: 'DELETE' })));
    await loadTodos();
  } catch {
    showError('Could not clear completed tasks');
    await loadTodos();
  }
});

// --- start -----------------------------------------------------------------

loadInfo();
loadTodos();
setInterval(loadInfo, 10000);
