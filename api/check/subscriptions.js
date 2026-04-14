const { getStreamsChartsSubscriptions, sortSubscriptions } = require('../../lib/core');
const { json, badMethod } = require('../_lib/http');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 200, { ok: true });
  if (badMethod(req, res, ['GET'])) return;

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const user = (url.searchParams.get('user') || '').trim().toLowerCase();
    const q = (url.searchParams.get('q') || '').trim().toLowerCase();
    const sort = (url.searchParams.get('sort') || 'date_desc').trim();
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const pageSize = 24;

    if (!user) {
      return json(res, 400, { error: 'Missing user' });
    }

    const data = await getStreamsChartsSubscriptions(user);
    if (!data.user) {
      return json(res, 404, { error: 'User not found', user: null, totals: { totalSubs: 0, liveCount: 0 }, items: [], page: 1, pages: 1 });
    }

    let items = data.items;
    if (q) {
      items = items.filter((x) => x.displayName.toLowerCase().includes(q) || x.login.includes(q));
    }

    items = sortSubscriptions(items, sort);
    const liveCount = items.filter((x) => x.isLive).length;
    const pages = Math.max(1, Math.ceil(items.length / pageSize));
    const safePage = Math.min(page, pages);
    const start = (safePage - 1) * pageSize;
    const paged = items.slice(start, start + pageSize);

    return json(res, 200, {
      user: data.user,
      totals: { totalSubs: items.length, liveCount },
      items: paged,
      page: safePage,
      pages
    });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
};
