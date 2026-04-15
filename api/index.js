export default async function handler(req, res) {
  const url = new URL(req.url);
  const action = url.searchParams.get('a');
  const user = url.searchParams.get('u');

  const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
  const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

  try {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      return res.status(500).json({ error: 'Missing TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET' });
    }

    const tokenRes = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      body: `client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`
    });
    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;

    if (action === 'u') {
      const usersRes = await fetch(`https://api.twitch.tv/helix/users?login=${user}`, {
        headers: {
          'Client-ID': CLIENT_ID,
          'Authorization': `Bearer ${token}`
        }
      });
      const usersData = await usersRes.json();
      res.status(200).json(usersData.data?.[0] || null);
    } else {
      res.status(400).json({ error: 'bad action' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
