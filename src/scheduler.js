const cron = require('node-cron');
const { getClient } = require('./ig');

function start(threadId) {
  // 12:00 AM Good Night
  cron.schedule('0 0 * * *', async () => {
    try {
      await getClient().entity.directThread(threadId)
        .broadcastText('GOOD NIGHT USERS Susu karke soo jana babu 💋 @everyone');
      console.log('[cron] GN sent');
    } catch (e) { console.error('[GN]', e.message); }
  }, { timezone: 'Asia/Kolkata' });

  // 7:00 AM Good Morning
  cron.schedule('0 7 * * *', async () => {
    try {
      await getClient().entity.directThread(threadId)
        .broadcastText('GOOD MORNING Ngas How are you @everyone');
      console.log('[cron] GM sent');
    } catch (e) { console.error('[GM]', e.message); }
  }, { timezone: 'Asia/Kolkata' });
}

module.exports = { start };