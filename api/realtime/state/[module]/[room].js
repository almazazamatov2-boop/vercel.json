const { getRealtimeState, setRealtimeState } = require('../../../../../lib/core');
const { json, badMethod, readBody } = require('../../../../_lib/http');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 200, { ok: true });
  if (badMethod(req, res, ['GET', 'POST'])) return;

  try {
    const moduleName = String(req.query?.module || '').trim().toLowerCase();
    const room = String(req.query?.room || '').trim().toLowerCase();
    if (!moduleName || !room) return json(res, 400, { error: 'Missing module/room' });

    if (req.method === 'GET') {
      const state = await getRealtimeState(moduleName, room, {});
      return json(res, 200, { module: moduleName, room, state });
    }

    const body = await readBody(req);
    const patch = typeof body.state === 'object' && body.state ? body.state : {};
    const ttlSec = Number(body.ttlSec || 60 * 60 * 24);
    const next = await setRealtimeState(moduleName, room, patch, ttlSec);
    return json(res, 200, { module: moduleName, room, state: next });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
};
