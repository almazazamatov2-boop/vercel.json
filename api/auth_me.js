export default async function handler(req, res) {
  const token = req.cookies.twitch_token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const clientId = process.env.TWITCH_CLIENT_ID;

  try {
    const response = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-Id': clientId,
      },
    });

    const data = await response.json();
    if (!response.ok || !data.data?.[0]) {
      return res.status(500).json({ error: 'Failed to fetch user' });
    }

    const user = data.data[0];
    return res.status(200).json({
      id: user.id,
      login: user.login,
      display_name: user.display_name,
      profile_image_url: user.profile_image_url,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
