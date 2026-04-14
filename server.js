const http = require('http');
const fs = require('fs');
const path = require('path');

const CLIENT_ID = 'njwi66jx4ju5kpb25aeh4fd4i2okq5';
const CLIENT_SECRET = 'uspju8gdepuar3e7fgv7c5q0p5xem8';

async function getToken() {
  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    body: `client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`
  });
  const data = await res.json();
  return data.access_token;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // API endpoint
  if (url.pathname.startsWith('/api/')) {
    const action = url.searchParams.get('a');
    const user = url.searchParams.get('u');
    
    try {
      const token = await getToken();
      
      if (action === 'u') {
        const res2 = await fetch(`https://api.twitch.tv/helix/users?login=${user}`, {
          headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${token}` }
        });
        const data = await res2.json();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data.data?.[0] || { error: 'not found' }));
        return;
      }
    } catch (e) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: e.message }));
      return;
    }
  }
  
  // Static files
  let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
  if (filePath === '/index.html') filePath = '/index.html';
  
  const ext = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css'
  };
  
  try {
    const content = fs.readFileSync(path.join(__dirname, filePath));
    res.setHeader('Content-Type', contentTypes[ext] || 'text/plain');
    res.end(content);
  } catch (e) {
    res.setHeader('Content-Type', 'text/html');
    res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
  }
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server on ${port}`));