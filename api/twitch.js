const CLIENT_ID = 'njwi66jx4ju5kpb25aeh4fd4i2okq5';
const CLIENT_SECRET = 'uspju8gdepuar3e7fgv7c5q0p5xem8';

let accessToken = null;

async function getAccessToken() {
  if (accessToken) return accessToken;
  
  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`
  });
  
  const data = await response.json();
  accessToken = data.access_token;
  return accessToken;
}

export default async function handler(req, res) {
  const { action, user, channel } = req.query;
  
  try {
    const token = await getAccessToken();
    
    if (action === 'checksub') {
      // Check if user is subscribed to channel
      const response = await fetch(`https://api.twitch.tv/helix/subscriptions?user_id=${user}&broadcaster_id=${channel}`, {
        headers: {
          'Client-ID': CLIENT_ID,
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      res.json({ subscribed: data.data && data.data.length > 0, tier: data.data?.[0]?.tier });
    } 
    else if (action === 'user') {
      // Get user ID by username
      const response = await fetch(`https://api.twitch.tv/helix/users?login=${user}`, {
        headers: {
          'Client-ID': CLIENT_ID,
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      res.json(data.data?.[0] || null);
    }
    else if (action === 'stream') {
      // Check if user is live
      const response = await fetch(`https://api.twitch.tv/helix/streams?user_login=${user}`, {
        headers: {
          'Client-ID': CLIENT_ID,
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      res.json({ live: data.data && data.data.length > 0, stream: data.data?.[0] });
    }
    else {
      res.status(400).json({ error: 'Unknown action' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}