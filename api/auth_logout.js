export default function handler(req, res) {
  res.setHeader('Set-Cookie', 'twitch_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax');
  return res.status(200).json({ success: true });
}
