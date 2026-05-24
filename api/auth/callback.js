export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).send("No code provided");

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    return res.status(500).send("DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET is missing.");
  }

  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers.host;
  const redirectUri = `${protocol}://${host || 'localhost:3000'}/api/auth/callback`;

  try {
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      return res.status(400).send(`Discord Auth Error: ${tokenData.error_description || tokenData.error}`);
    }

    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    
    const userData = await userResponse.json();
    
    // Inject logic to save user info to localStorage and redirect to profile.
    const html = `
      <!DOCTYPE html>
      <html>
      <head><title>Authenticating...</title></head>
      <body>
        <p>Connexion réussie. Redirection en cours...</p>
        <script>
          const discordUser = ${JSON.stringify(userData)};
          localStorage.setItem('radmtlh_discordUser', JSON.stringify(discordUser));
          localStorage.setItem('radmtlh_role', 'player_new');
          window.location.href = '/profile';
        </script>
      </body>
      </html>
    `;
    res.setHeader("Content-Type", "text/html");
    res.status(200).send(html);
    
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
}
