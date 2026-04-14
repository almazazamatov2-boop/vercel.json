module.exports = (req, res) => {
  const { a, u } = req.query
  const CLIENT_ID = 'njwi66jx4ju5kpb25aeh4fd4i2okq5'
  const CLIENT_SECRET = 'uspju8gdepuar3e7fgv7c5q0p5xem8'
  
  fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    body: `client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`
  }).then(r => r.json()).then(token => {
    if(a === 'u') {
      fetch(`https://api.twitch.tv/helix/users?login=${u}`, {
        headers: { 'Client-ID': CLIENT_ID, 'Authorization': 'Bearer ' + token.access_token }
      }).then(r => r.json()).then(data => {
        res.json(data.data?.[0] || {error:'not found'})
      })
    } else {
      res.json({error:'bad'})
    }
  }).catch(e => res.json({error:e.message}))
}