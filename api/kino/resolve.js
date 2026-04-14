const { extractKinopoiskId, buildMirrorList } = require('../../lib/core');
const { json, badMethod } = require('../_lib/http');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 200, { ok: true });
  if (badMethod(req, res, ['GET'])) return;

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const raw = (url.searchParams.get('id') || '').trim();
    const id = extractKinopoiskId(raw);
    if (!id) {
      return json(res, 400, { error: 'Invalid Kinopoisk id/url' });
    }

    return json(res, 200, {
      movieMeta: {
        id,
        sourceUrl: `https://www.kinopoisk.ru/film/${id}/`,
        title: `Kinopoisk #${id}`
      },
      mirrors: buildMirrorList(id)
    });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
};
