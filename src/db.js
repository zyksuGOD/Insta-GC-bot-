const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'bot.json');

// Load database
let db = {};
if (fs.existsSync(dbPath)) {
  try {
    db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (e) {}
}

// Default structure
if (!db.config) db.config = {};
if (!db.messages) db.messages = [];
if (!db.joins) db.joins = [];
if (!db.welcomes) db.welcomes = {};

// Save function
const save = () => {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
};

const getConfig = (key) => db.config[key] || null;
const setConfig = (key, value) => {
  db.config[key] = value;
  save();
};

const logMessage = (userId, username, threadId) => {
  db.messages.push({ userId, username, threadId, ts: Date.now() });
  save();
};

const logJoin = (userId, username, threadId) => {
  db.joins.push({ userId, username, threadId, ts: Date.now() });
  save();
};

const getWelcome = (userId, threadId) => {
  const key = `${userId}_${threadId}`;
  return db.welcomes[key] ? { ts: db.welcomes[key] } : null;
};

const setWelcome = (userId, threadId) => {
  const key = `${userId}_${threadId}`;
  db.welcomes[key] = Date.now();
  save();
};

const dayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const getDailyStats = (threadId) => {
  const start = dayStart();
  const todaysMessages = db.messages.filter(m => m.threadId === threadId && m.ts >= start);
  const total = todaysMessages.length;
  const active = new Set(todaysMessages.map(m => m.userId)).size;
  const joined = db.joins.filter(j => j.threadId === threadId && j.ts >= start).length;
  
  return { total, active, joined };
};

module.exports = {
  getConfig, setConfig, logMessage, logJoin,
  getWelcome, setWelcome, getDailyStats
};