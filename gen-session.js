require('dotenv').config();
const { IgApiClient } = require('instagram-private-api');
const { SocksProxyAgent } = require('socks-proxy-agent');
const { HttpsProxyAgent } = require('https-proxy-agent');
const fs = require('fs');
const prompt = require('prompt-sync')({ sigint: true });

function buildProxyAgent(proxyUrl) {
  if (!proxyUrl || !proxyUrl.trim()) return null;
  const url = proxyUrl.trim();
  if (url.startsWith('socks')) return new SocksProxyAgent(url);
  return new HttpsProxyAgent(url);
}

(async () => {
  const username = prompt('Instagram username: ');
  const password = prompt('Instagram password: ');

  const ig = new IgApiClient();
  ig.state.generateDevice(username);

  const agent = buildProxyAgent(process.env.PROXY_URL);
  if (agent) {
    ig.request.defaults.agent = agent;
    console.log('Using proxy from .env');
  } else {
    console.log('No proxy — direct connection');
  }

  try {
    await ig.simulate.preLoginFlow();
    const user = await ig.account.login(username, password);
    console.log('Logged in as', user.username);

    process.nextTick(async () => {
      await ig.simulate.postLoginFlow();
      const session = await ig.state.serialize();
      delete session.constants;
      fs.writeFileSync('session.json', JSON.stringify(session, null, 2));
      console.log('\n✅ Session saved to session.json');
      console.log('   Isko dashboard ke "Session ID" box mein paste kar.\n');
      console.log('Content:');
      console.log(JSON.stringify(session));
    });
  } catch (e) {
    console.error('Login failed:', e.message);
    if (e.message.includes('challenge')) {
      console.log('\n⚠️  Checkpoint aaya. Browser mein Instagram khol,');
      console.log('   verification complete kar, phir dubara chala.');
    }
  }
})();