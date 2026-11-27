const { getClient } = require('./ig');
const { getDailyStats } = require('./db');

const menuText = `📋 *BOT COMMANDS*

/menu — Ye command list
/total — Aaj ka stats

*Admin only (DM the bot):*
/send_gc <text> — GC mein message bhejta hai

*Auto features:*
• New member → welcome
• 12h cooldown welcome on first msg
• "ignore" → cute swipe reply
• IG link → warning swipe reply
• 12:00 AM → Good Night
• 7:00 AM → Good Morning`;

async function handleMenu(threadId) {
  const ig = getClient();
  await ig.entity.directThread(threadId).broadcastText(menuText);
}

async function handleTotal(threadId) {
  const ig = getClient();
  const s = getDailyStats(threadId);
  const txt = `📊 *AAJ KA STATS*\n\n` +
    `💬 Total messages: *${s.total}*\n` +
    `👥 Active members: *${s.active}*\n` +
    `➕ New joined: *${s.joined}*`;
  await ig.entity.directThread(threadId).broadcastText(txt);
}

async function handleSendGc(threadId, text) {
  const ig = getClient();
  await ig.entity.directThread(threadId).broadcastText(text);
}

module.exports = { handleMenu, handleTotal, handleSendGc };