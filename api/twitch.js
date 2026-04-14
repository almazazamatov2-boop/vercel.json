const { getTwitchUserByLogin, getStreamByLogin, getFollowersTotalByLogin } = require('../lib/core');
const { json, badMethod } = require('./_lib/http');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 200, { ok: true });
  if (badMethod(req, res, ['GET'])) return;

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const a = (url.searchParams.get('a') || '').trim();
    const u = (url.searchParams.get('u') || '').trim().toLowerCase();
    if (!u) return json(res, 400, { error: 'Missing u' });

    if (a === 'u') {
      const user = await getTwitchUserByLogin(u);
      return json(res, user ? 200 : 404, user || { error: 'not found' });
    }

    if (a === 's') {
      const stream = await getStreamByLogin(u);
      return json(res, 200, { live: Boolean(stream), stream: stream || null });
    }

    if (a === 'f') {
      const total = await getFollowersTotalByLogin(u);
      return json(res, 200, { total });
    }

    return json(res, 400, { error: 'Unknown action' });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
};
