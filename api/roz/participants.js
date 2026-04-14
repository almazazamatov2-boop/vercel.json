const { getRealtimeState, setRealtimeState } = require('../../lib/core');
const { json, badMethod, readBody } = require('../_lib/http');

function sanitizeParticipant(item) {
  return {
    login: String(item.login || '').toLowerCase(),
    displayName: String(item.displayName || item.login || '').trim(),
    avatar: String(item.avatar || ''),
    joinedAt: item.joinedAt || new Date().toISOString()
  };
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 200, { ok: true });
  if (badMethod(req, res, ['GET', 'POST'])) return;

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const channel = (url.searchParams.get('channel') || '').trim().toLowerCase();
    if (!channel) return json(res, 400, { error: 'Missing channel' });

    if (req.method === 'GET') {
      const state = await getRealtimeState('roz', channel, { participants: [] });
      return json(res, 200, { channel, participants: state.participants || [], updatedAt: state.updatedAt || null });
    }

    const body = await readBody(req);
    const rawParticipants = Array.isArray(body.participants) ? body.participants : [];
    const unique = new Map();
    rawParticipants.forEach((p) => {
      const safe = sanitizeParticipant(p);
      if (safe.login) unique.set(safe.login, safe);
    });

    const participants = [...unique.values()];
    const state = await setRealtimeState('roz', channel, { participants });
    return json(res, 200, { channel, participants: state.participants || [], updatedAt: state.updatedAt || null });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
};
