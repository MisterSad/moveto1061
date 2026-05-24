// Main app — routing, state management, auth with Supabase

const { useState, useEffect, useMemo } = React;
const { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } = ReactRouterDOM;

function App() {
  const lang = "en";
  const t = window.useT ? window.useT(lang) : (k) => k;

  const [tw, setTweak] = useState(window.TWEAK_DEFAULTS || { goldHue: "oklch(0.82 0.12 78)" });
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--gold", tw.goldHue);
    root.style.setProperty("--rad", tw.goldHue);
  }, [tw.goldHue]);

  // ===== Supabase Auth =====
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    window.supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) setLoadingAuth(false);
    });

    const { data: { subscription } } = window.supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setProfile(null);
        setLoadingAuth(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      window.supabaseClient.from('profiles').select('*').eq('id', session.user.id).single()
        .then(({ data, error }) => {
          if (data) setProfile(data);
          else setProfile(null);
          setLoadingAuth(false);
        });
    }
  }, [session]);

  // ===== Shared Application Draft (Profile -> Apply flow) =====
  const [draftApp, setDraftApp] = useState({});

  // ===== Guild settings =====
  const [guildSettings, setGuildSettings] = useState({ rad: {}, mtlh: {} });
  useEffect(() => {
    window.supabaseClient.from('guild_settings').select('*').then(({ data }) => {
      if (data) {
        const gs = { rad: {}, mtlh: {} };
        data.forEach(row => { gs[row.id] = row; });
        setGuildSettings(gs);
      }
    });
  }, []);

  function updateGuildSettings(guild, patch) {
    window.supabaseClient.from('guild_settings').update(patch).eq('id', guild).then(() => {
      setGuildSettings(prev => ({ ...prev, [guild]: { ...prev[guild], ...patch } }));
    });
  }

  // ===== Role Derivation =====
  const role = useMemo(() => {
    if (!session) return "visitor";
    if (!profile) return "player_new";
    // Backwards compatibility if they still use 'super'
    if (profile.role === "super") return "rad_r5";
    return profile.role || "player_new";
  }, [session, profile]);

  const isAdmin = useMemo(() => {
    if (profile?.role === "super") return true;
    return !!profile?.is_admin;
  }, [profile]);

  const isPrince = useMemo(() => {
    return !!profile?.is_prince || !!profile?.is_recruiter;
  }, [profile]);

  // ===== Route =====
  const navigate = useNavigate();
  const location = useLocation();
  const route = location.pathname === "/" ? "landing" : location.pathname.substring(1);
  const setRoute = (r) => { navigate(r === "landing" ? "/" : `/${r}`); };

  // ===== Current User Info =====
  const currentUserInfo = useMemo(() => {
    if (!session) return { name: null, id: null };
    return { name: profile?.ign || session.user.user_metadata?.custom_claims?.global_name || "You", id: session.user.id };
  }, [session, profile]);

  function logout() {
    window.supabaseClient.auth.signOut().then(() => setRoute("landing"));
  }

  // NOTE: setLang logic from original app removed for brevity, assuming t() handles it
  const setLang = (l) => { /* language switcher omitted for brevity */ };

  if (loadingAuth) {
    return <div style={{display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center'}}>Loading...</div>;
  }

  const myGuild = role.startsWith("rad") ? "rad" : role.startsWith("mtlh") ? "mtlh" : "rad";

  let body = (
    <Routes>
      <Route path="/" element={<LandingScreen t={t} lang={lang} setRoute={setRoute} role={role} guildSettings={guildSettings} />} />
      <Route path="/login" element={<LoginScreen t={t} lang={lang} session={session} setRoute={setRoute} />} />
      <Route path="/guild_settings" element={<GuildSettingsScreen t={t} lang={lang} guild={myGuild} settings={guildSettings[myGuild]} onSave={(patch) => updateGuildSettings(myGuild, patch)} />} />
      <Route path="/profile" element={<ProfileScreen t={t} lang={lang} session={session} profile={profile} setProfile={setProfile} draftApp={draftApp} setDraftApp={setDraftApp} setRoute={setRoute} />} />
      <Route path="/apply" element={!session ? <Navigate to="/profile" replace /> : <ApplyScreen t={t} lang={lang} session={session} profile={profile} setProfile={setProfile} draftApp={draftApp} setRoute={setRoute} guildSettings={guildSettings} />} />
      <Route path="/player" element={<PlayerDashboard t={t} lang={lang} session={session} profile={profile} />} />
      <Route path="/admin/rad" element={<AdminDashboard t={t} lang={lang} role={role} profile={profile} currentUserId={session?.user?.id} forceGuild="rad" />} />
      <Route path="/admin/mtlh" element={<AdminDashboard t={t} lang={lang} role={role} profile={profile} currentUserId={session?.user?.id} forceGuild="mtlh" />} />
      <Route path="/prince" element={<PrinceDashboardScreen t={t} lang={lang} />} />
      <Route path="/system" element={<SystemAdminScreen t={t} lang={lang} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  return (
    <div className="app">
      <TopBar
        route={route} setRoute={setRoute}
        role={role}
        isAdmin={isAdmin}
        isPrince={isPrince}
        lang={lang} setLang={setLang}
        t={t}
        onLogout={logout}
        selfName={currentUserInfo.name}
      />
      {body}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
