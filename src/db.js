const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'bot.db'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  username TEXT,
  thread_id TEXT,
  ts INTEGER
);
CREATE TABLE IF NOT EXISTS joins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  username TEXT,
  thread_id TEXT,
  ts INTEGER
);
CREATE TABLE IF NOT EXISTS welcomes (
  user_id TEXT,
  thread_id TEXT,
  ts INTEGER,
  PRIMARY KEY (user_id, thread_id)
);
`);

const getConfig = (key) => {
  const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key);
  return row ? row.value : null;
};

const setConfig = (key, value) =>
  db.prepare('INSERT OR REPLACE INTO config (key,value) VALUES (?,?)').run(key, value);

const logMessage = (userId, username, threadId) =>
  db.prepare('INSERT INTO messages (user_id,username,thread_id,ts) VALUES (?,?,?,?)')
    .run(userId, username, threadId, Date.now());

const logJoin = (userId, username, threadId) =>
  db.prepare('INSERT INTO joins (user_id,username,thread_id,ts) VALUES (?,?,?,?)')
    .run(userId, username, threadId, Date.now());

const getWelcome = (userId, threadId) =>
  db.prepare('SELECT ts FROM welcomes WHERE user_id=? AND thread_id=?').get(userId, threadId);

const setWelcome = (userId, threadId) =>
  db.prepare('INSERT OR REPLACE INTO welcomes (user_id,thread_id,ts) VALUES (?,?,?)')
    .run(userId, threadId, Date.now());

const dayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const getDailyStats = (threadId) => {
  const start = dayStart();
  const total = db.prepare('SELECT COUNT(*) c FROM messages WHERE thread_id=? AND ts>=?')
    .get(threadId, start).c;
  const active = db.prepare('SELECT COUNT(DISTINCT user_id) c FROM messages WHERE thread_id=? AND ts>=?')
    .get(threadId, start).c;
  const joined = db.prepare('SELECT COUNT(*) c FROM joins WHERE thread_id=? AND ts>=?')
    .get(threadId, start).c;
  return { total, active, joined };
};

module.exports = {
  getConfig, setConfig, logMessage, logJoin,
  getWelcome, setWelcome, getDailyStats
};