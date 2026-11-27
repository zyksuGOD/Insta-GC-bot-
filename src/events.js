const { getClient } = require('./ig');
const { getWelcome, setWelcome, logMessage, logJoin } = require('./db');
const { handleMenu, handleTotal } = require('./commands');

const TWELVE_HOURS = 12 * 60 * 60 * 1000;

async function sendSwipeReply(threadId, itemId, text) {
  const ig = getClient();
  const thread = ig.entity.directThread(threadId);
  try {
    await thread.broadcastText(text, { replyToItemId: itemId });
  } catch {
    await thread.broadcastText(text);
  }
}

async function handleMessage(item, threadId, sender) {
  const userId = sender.pk.toString();
  const username = sender.username;
  const text = item.text || '';
  const itemId = item.item_id;

  logMessage(userId, username, threadId);

  // 12h cooldown welcome
  const last = getWelcome(userId, threadId);
  const now = Date.now();
  if (!last || now - last.ts > TWELVE_HOURS) {
    setWelcome(userId, threadId);
    await sendSwipeReply(threadId, itemId,
      `Welcome back to our gc @${username} how are you? 🎈`);
    return;
  }

  // ignore keyword
  if (/\bignore\b/i.test(text)) {
    await sendSwipeReply(threadId, itemId,
      `AWW BACCHA ISSOKIEE MEIN HU NA APKE LIYE 🥹 💋`);
    return;
  }

  // IG gc link detection
  if (/https?:\/\/(www\.)?ig\.me\/j\/[\w-]+/i.test(text)) {
    await sendSwipeReply(threadId, itemId,
      `AWW TERE B44P KI BIWI KE PICS DE RHA HAI GC PE ? 🥰`);
    return;
  }

  // commands
  if (/^\/menu\b/i.test(text)) return handleMenu(threadId);
  if (/^\/total\b/i.test(text)) return handleTotal(threadId);
}

async function handleJoin(user, threadId) {
  const ig = getClient();
  logJoin(user.pk.toString(), user.username, threadId);
  await ig.entity.directThread(threadId).broadcastText(
    `Welcome to our gc @${user.username}`);
}

module.exports = { handleMessage, handleJoin };