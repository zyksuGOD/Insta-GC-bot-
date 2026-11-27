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
  
  // Generate a random device id automatically
  const randomDeviceId = 'android-' + Math.random().toString(16).slice(2, 18);
  ig.state.generateDevice(randomDeviceId);

  const agent = buildProxyAgent(proxyUrl);
  if (agent) {
    ig.request.defaults.agent = agent;
    console.log('[IG] using proxy');
  } else {
    console.log('[IG] no proxy — direct (ban risk higher)');
  }

  let sessionJson;
  
  // Agar Kanha ne direct raw sessionid paste kiya hai
  if (!sessionString.trim().startsWith('{')) {
    sessionJson = {
      cookies: `sessionid=${sessionString.trim()}`,
      device_id: randomDeviceId
    };
  } else {
    // Agar JSON format mein paste kiya hai
    sessionJson = JSON.parse(sessionString);
    if (sessionJson.cookies && !sessionJson.cookies.includes('sessionid=')) {
      sessionJson.cookies = `sessionid=${sessionJson.cookies}`;
    }
  }

  await ig.state.deserialize(sessionJson);
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