export default function handler(req, res) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers.host;
  // Fallback to localhost if testing locally without Vercel injecting host, 
  // though Vercel dev handles it.
  const redirectUri = encodeURIComponent(`${protocol}://${host || 'localhost:3000'}/api/auth/callback`);
  
  if (!clientId) {
    return res.status(500).send("DISCORD_CLIENT_ID is not set in Vercel Environment Variables.");
  }

  const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify`;
  res.redirect(302, url);
}
