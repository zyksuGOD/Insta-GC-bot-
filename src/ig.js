const { IgApiClient } = require('instagram-private-api');
const { SocksProxyAgent } = require('socks-proxy-agent');
const { HttpsProxyAgent } = require('https-proxy-agent');

let ig = null;
let me = null;

function buildProxyAgent(proxyUrl) {
  if (!proxyUrl || !proxyUrl.trim()) return null;
  const url = proxyUrl.trim();
  if (url.startsWith('socks')) return new SocksProxyAgent(url);
  return new HttpsProxyAgent(url);
}

async function loginWithSession(sessionString, proxyUrl) {
  ig = new IgApiClient();
  ig.state.generateDevice('ig_gc_bot_' + Date.now());

  const agent = buildProxyAgent(proxyUrl);
  if (agent) {
    ig.request.defaults.agent = agent;
    console.log('[IG] using proxy');
  } else {
    console.log('[IG] no proxy — direct (ban risk higher)');
  }

  const session = JSON.parse(sessionString);
  await ig.state.deserialize(session);
  me = await ig.account.currentUser();
  console.log('[IG] logged in as', me.username);
  return me;
}

function getClient() {
  if (!ig) throw new Error('IG not logged in');
  return ig;
}

function getMe() {
  return me;
}

module.exports = { loginWithSession, getClient, getMe };