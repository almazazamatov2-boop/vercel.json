const { extractKinopoiskId, getKinoTimings, addKinoTiming, removeKinoTiming } = require('../../lib/core');
const { json, badMethod, readBody } = require('../_lib/http');

const ALLOWED = new Set(['obnazhonka', 'zapretnye-slova', 'ban-risk-scena']);

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 200, { ok: true });
  if (badMethod(req, res, ['GET', 'POST', 'DELETE'])) return;

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const raw = (url.searchParams.get('id') || '').trim();
    const id = extractKinopoiskId(raw);
    if (!id) return json(res, 400, { error: 'Invalid id' });

    if (req.method === 'GET') {
      const timings = await getKinoTimings(id);
      return json(res, 200, { id, timings });
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const time = String(body.time || '').trim();
      const category = String(body.category || '').trim();
      const label = String(body.label || '').trim();

      if (!time || !category || !label) return json(res, 400, { error: 'Missing fields' });
      if (!ALLOWED.has(category)) return json(res, 400, { error: 'Invalid category' });

      const created = await addKinoTiming(id, { time, category, label });
      return json(res, 201, { id, timing: created });
    }

    if (req.method === 'DELETE') {
      const timingId = (url.searchParams.get('timingId') || '').trim();
      if (!timingId) return json(res, 400, { error: 'Missing timingId' });
      const timings = await removeKinoTiming(id, timingId);
      return json(res, 200, { id, timings });
    }
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
};
