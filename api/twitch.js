export const config = {
  runtime: 'edge',
  api: {
    bodyParser: false,
  }
};

const CLIENT_ID = 'njwi66jx4ju5kpb25aeh4fd4i2okq5';
const CLIENT_SECRET = 'uspju8gdepuar3e7fgv7c5q0p5xem8';

let token = '';

async function getToken() {
  if (token) return token;
  const res = await fetch('https://id.twitch.tv/oauth2/token?' + new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'client_credentials'
  }), { method: 'POST' });
  const d = await res.json();
  token = d.access_token;
  return token;
}

export default async function(req) {
  const url = new URL(req.url);
  const action = url.searchParams.get('a');
  const u = url.searchParams.get('u');
  
  try {
    const tok = await getToken();
    
    let data;
    if (action === 'u') {
      const res = await fetch('https://api.twitch.tv/helix/users?login=' + u, {
        headers: { 'Client-ID': CLIENT_ID, 'Authorization': 'Bearer ' + tok }
      });
      data = await res.json();
      return new Response(JSON.stringify(data.data?.[0] || null), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    if (action === 's') {
      const res = await fetch('https://api.twitch.tv/helix/streams?user_login=' + u, {
        headers: { 'Client-ID': CLIENT_ID, 'Authorization': 'Bearer ' + tok }
      });
      data = await res.json();
      return new Response(JSON.stringify({ live: !!data.data?.length }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    return new Response('{"e":"bad"}', { status: 400 });
  } catch(e) {
    return new Response('{"e":"' + e.message + '"}', { status: 500 });
  }
}