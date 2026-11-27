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

async function loginWithCredentials(username, password, proxyUrl) {
  ig = new IgApiClient();
  ig.state.generateDevice(username);

  const agent = buildProxyAgent(proxyUrl);
  if (agent) {
    ig.request.defaults.agent = agent;
    console.log('[IG] using proxy');
  } else {
    console.log('[IG] NO PROXY DETECTED - direct connection');
  }

  try {
    await ig.simulate.preLoginFlow();
    const user = await ig.account.login(username, password);
    me = user;
    console.log('[IG] logged in as', me.username);
    return me;
  } catch (e) {
    console.error("Login Error:", e.message);
    if (e.message.includes('challenge')) {
       throw new Error("Checkpoint! Apne phone me login karke 'It was me' approve karein, phir try karein.");
    }
    throw new Error(`Exact Error: ${e.message}`);
  }
}

function getClient() { return ig; }
function getMe() { return me; }

module.exports = { loginWithCredentials, getClient, getMe };