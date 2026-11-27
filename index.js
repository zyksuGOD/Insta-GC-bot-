require('dotenv').config();
const express = require('express');
const path = require('path');
const { loginWithSession, getClient, getMe } = require('./src/ig');
const { getConfig, setConfig } = require('./src/db');
const { handleMessage, handleJoin } = require('./src/events');
const { handleSendGc } = require('./src/commands');
const scheduler = require('./src/scheduler');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let botRunning = false;
let activeThread = null;
let admins = [];

// ===== DASHBOARD API =====
app.post('/api/start', async (req, res) => {
  const { password, session, threadId, adminList } = req.body;
  if (password !== process.env.DASH_PASSWORD)
    return res.status(401).json({ error: 'Wrong password' });

  if (botRunning) return res.json({ ok: true, msg: 'already running', me: getMe()?.username });

  try {
    activeThread = threadId;
    admins = (adminList || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    if (admins.length > 5) return res.status(400).json({ error: 'Max 5 admins allowed' });

    await loginWithSession(session, process.env.PROXY_URL);
    setConfig('threadId', threadId);
    setConfig('admins', JSON.stringify(admins));
    setConfig('session', session);

    botRunning = true;
    startPolling();
    scheduler.start(threadId);

    res.json({ ok: true, me: getMe().username });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/status', (req, res) => {
  res.json({ running: botRunning, me: getMe()?.username || null });
});

// ===== POLLING =====
let lastSeenItem = null;

async function startPolling() {
  const ig = getClient();
  const thread = ig.entity.directThread(activeThread);
  lastSeenItem = getConfig('lastItem_' + activeThread) || null;

  setInterval(async () => {
    try {
      const items = await thread.getItems();
      const newOnes = items.slice(0, 20).reverse();
      for (const item of newOnes) {
        if (item.item_id === lastSeenItem) continue;
        if (item.user_id?.toString() === getMe().pk.toString()) continue;

        // join events
        if (item.item_type === 'action_log' &&
            item.action_log?.description?.includes('joined')) {
          const u = item.action_log.user;
          await handleJoin(u, activeThread);
          lastSeenItem = item.item_id;
          setConfig('lastItem_' + activeThread, lastSeenItem);
          continue;
        }

        if (item.item_type === 'text') {
          const sender = { pk: item.user_id, username: item.user_id };
          try {
            const u = await ig.user.info(item.user_id);
            sender.username = u.username;
          } catch {}
          await handleMessage(item, activeThread, sender);
        }
        lastSeenItem = item.item_id;
        setConfig('lastItem_' + activeThread, lastSeenItem);
      }
    } catch (e) {
      console.error('[poll]', e.message);
    }
  }, 5000);
}

// ===== ADMIN DM /send_gc =====
async function checkAdminDMs() {
  const ig = getClient();
  const inbox = await ig.feed.directInbox().items();
  for (const thread of inbox) {
    if (thread.is_group) continue;
    const items = await ig.entity.directThread(thread.thread_id).getItems();
    for (const item of items.slice(0, 5)) {
      if (item.item_type !== 'text') continue;
      const uname = (await ig.user.info(item.user_id).catch(() => ({}))).username;
      if (!admins.includes((uname || '').toLowerCase())) continue;
      const m = item.text.match(/^\/send_gc\s+([\s\S]+)/i);
      if (m) {
        await handleSendGc(activeThread, m[1]);
        console.log('[admin] /send_gc executed by', uname);
      }
    }
  }
}

setInterval(() => { if (botRunning) checkAdminDMs().catch(() => {}); }, 15000);

// ===== AUTO RESUME =====
(async () => {
  const sess = getConfig('session');
  const tid = getConfig('threadId');
  const ad = getConfig('admins');
  if (sess && tid) {
    try {
      activeThread = tid;
      admins = JSON.parse(ad || '[]');
      await loginWithSession(sess, process.env.PROXY_URL);
      botRunning = true;
      startPolling();
      scheduler.start(tid);
      console.log('[resume] bot restarted from saved session');
    } catch (e) { console.error('[resume]', e.message); }
  }
})();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('[web] on', PORT));