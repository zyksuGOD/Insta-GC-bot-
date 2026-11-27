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
  
  const randomDeviceId = 'android-' + Math.random().toString(16).slice(2, 18);
  ig.state.generateDevice(randomDeviceId);

  const agent = buildProxyAgent(proxyUrl);
  if (agent) {
    ig.request.defaults.agent = agent;
    console.log('[IG] using proxy');
  } else {
    console.log('[IG] no proxy — direct');
  }

  let sessionJson;
  let cleanString = String(sessionString).trim();

  // Agar direct session id paste kiya hai
  if (!cleanString.startsWith('{')) {
    // Agar galti se 'sessionid=' laga diya hai, toh hata do
    if (cleanString.startsWith('sessionid=')) {
      cleanString = cleanString.replace('sessionid=', '');
    }
    
    sessionJson = {
      cookies: `sessionid=${cleanString}`,
      device_id: randomDeviceId
    };
  } else {
    // Agar JSON format mein paste kiya hai
    try {
      sessionJson = JSON.parse(cleanString);
      if (sessionJson.cookies && !sessionJson.cookies.includes('sessionid=')) {
        sessionJson.cookies = `sessionid=${sessionJson.cookies}`;
      }
    } catch (e) {
      throw new Error("Session ID ka format galat hai. Sirf lamba wala text paste karein.");
    }
  }

  try {
    await ig.state.deserialize(sessionJson);
    me = await ig.account.currentUser();
    console.log('[IG] logged in as', me.username);
    return me;
  } catch (err) {
    throw new Error("Instagram login fail. Session ID expired ho sakta hai. Naya session nikal kar try karein.");
  }
}

function getClient() {
  if (!ig) throw new Error('IG not logged in');
  return ig;
}

function getMe() {
  return me;
}

module.exports = { loginWithSession, getClient, getMe };