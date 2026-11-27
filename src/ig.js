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
  }

  let sessionJson;
  let cleanString = String(sessionString).trim();

  if (!cleanString.startsWith('{')) {
    if (cleanString.startsWith('sessionid=')) {
      cleanString = cleanString.replace('sessionid=', '');
    }
    sessionJson = {
      cookies: `sessionid=${cleanString}`,
      device_id: randomDeviceId
    };
  } else {
    try {
      sessionJson = JSON.parse(cleanString);
      if (sessionJson.cookies && !sessionJson.cookies.includes('sessionid=')) {
        sessionJson.cookies = `sessionid=${sessionJson.cookies}`;
      }
    } catch (e) {
      throw new Error("Session ID ka format galat hai.");
    }
  }

  try {
    await ig.state.deserialize(sessionJson);
    me = await ig.account.currentUser();
    console.log('[IG] logged in as', me.username);
    return me;
  } catch (err) {
    throw new Error("Session expired ya invalid hai. Phone se naya nikaal ke daal.");
  }
}

function getClient() { return ig; }
function getMe() { return me; }

module.exports = { loginWithSession, getClient, getMe };