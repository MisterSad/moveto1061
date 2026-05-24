// Main app — routing, state management, role switching for demo.

const { useState: aUs, useEffect: aUe, useMemo: aUm } = React;
const { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } = ReactRouterDOM;

// Secure password generator — 16 chars, ensures variety, avoids ambiguous chars
function generatePassword(len = 16) {
  const upper   = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const lower   = "abcdefghijkmnpqrstuvwxyz";
  const digits  = "23456789";
  const symbols = "!@#$%&*_-+?";
  const all = upper + lower + digits + symbols;
  const buf = new Uint32Array(Math.max(len, 8));
  crypto.getRandomValues(buf);
  const parts = [
    upper[buf[0] % upper.length],
    lower[buf[1] % lower.length],
    digits[buf[2] % digits.length],
    symbols[buf[3] % symbols.length],
  ];
  for (let i = 4; i < len; i++) parts.push(all[buf[i] % all.length]);
  // Shuffle
  for (let i = parts.length - 1; i > 0; i--) {
    const r = new Uint32Array(1); crypto.getRandomValues(r);
    const j = r[0] % (i + 1);
    [parts[i], parts[j]] = [parts[j], parts[i]];
  }
  return parts.join("");
}

function App() {
  // ===== Language — fixed to English =====
  const lang = "en";
  const setLang = () => {};
  const t = useT(lang);

  // ===== Tweaks =====
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);
  aUe(() => {
    const root = document.documentElement;
    root.style.setProperty("--gold", tw.goldHue);
    root.style.setProperty("--rad", tw.goldHue);
  }, [tw.goldHue]);

  // ===== Guild settings (editable by each R5, visible on landing) =====
  const [guildSettings, setGuildSettings] = aUs(() => {
    const saved = localStorage.getItem("radmtlh_guildSettings");
    if (saved) try { return JSON.parse(saved); } catch (e) {}
    return {
      rad: {
        members: 47, avgPower: "73M", slots: 8,
        req: ["Puissance ≥ 60M", "Discord actif", "Présence KvK obligatoire"],
        reqEn: ["Power ≥ 60M", "Active on Discord", "Mandatory SvS & GvG presence"],
        pitch: "Coordination chirurgicale, jeu organisé, KvK haut niveau. La Radiant aligne ses heures, ses cibles, et ses pertes.",
        pitchEn: "Surgical coordination, structured play, top-tier SvS & GvG. The Radiant aligns its hours, its targets, and its losses.",
      },
      mtlh: {
        members: 52, avgPower: "58M", slots: 12,
        req: ["Puissance ≥ 45M", "Discord actif", "Rallies coordonnés (FR/EN)"],
        reqEn: ["Power ≥ 45M", "Active on Discord", "Coordinated rallies (FR/EN)"],
        pitch: "Brute force et discipline du fer. Metalheads frappe fort, frappe ensemble, et ne lâche jamais une cible avant qu'elle soit morte.",
        pitchEn: "Brute force and iron discipline. Metalheads hits hard, hits together, and never drops a target until it's dead.",
      },
    };
  });
  aUe(() => localStorage.setItem("radmtlh_guildSettings", JSON.stringify(guildSettings)), [guildSettings]);

  function updateGuildSettings(guild, patch) {
    setGuildSettings(prev => ({ ...prev, [guild]: { ...prev[guild], ...patch } }));
  }

  // ===== Team (R5 / R4 / Prince / Recruiter) — managed by Prince =====
  const [team, setTeam] = aUs(() => {
    const saved = localStorage.getItem("radmtlh_team");
    if (saved) try { return JSON.parse(saved); } catch (e) {}
    // Default = bootstrap from MOCK_DATA members + add the Prince (Vortexa = also R5 RAD)
    return [
      { id: "u_rad_r5",   ign: "Vortexa",     role: "R5",        guild: "rad",  color: "rad",  isPrince: true, password: "Pr1nce-R4d-2026!" },
      { id: "u_rad_r4a",  ign: "Heliax",      role: "R4",        guild: "rad",  color: "rad",  password: "Hx-9k4Pmq72#aBz" },
      { id: "u_rad_r4b",  ign: "Solenne",     role: "R4",        guild: "rad",  color: "rad",  password: "S0lenne-Tr-88!Qw" },
      { id: "u_rad_r4c",  ign: "Auriel",      role: "R4",        guild: "rad",  color: "rad",  password: "Aur-7Wq2K-pNh!4r" },
      { id: "u_mtlh_r5",  ign: "Ironclad",    role: "R5",        guild: "mtlh", color: "mtlh", password: "1ronclad-Mt!h-29" },
      { id: "u_mtlh_r4a", ign: "Hammerfall",  role: "R4",        guild: "mtlh", color: "mtlh", password: "Hmrfll-Kp4@x2-Wt" },
      { id: "u_mtlh_r4b", ign: "Crogan",      role: "R4",        guild: "mtlh", color: "mtlh", password: "Crogan-3rL-x99!q" },
      { id: "u_mtlh_r4c", ign: "Slagheart",   role: "R4",        guild: "mtlh", color: "mtlh", password: "Sl4g-r2N7-Q!emHb" },
      { id: "u_rec_01",   ign: "Sentinel",    role: "Recruiter", guild: null,   color: "all",  password: "S3ntinel-Rc!28-Bq" },
    ];
  });
  aUe(() => {
    localStorage.setItem("radmtlh_team", JSON.stringify(team));
    // Sync to window.MOCK_DATA so chat lookups keep working
    window.MOCK_DATA.RAD_MEMBERS  = team.filter(m => m.guild === "rad"  && (m.role === "R5" || m.role === "R4"));
    window.MOCK_DATA.MTLH_MEMBERS = team.filter(m => m.guild === "mtlh" && (m.role === "R5" || m.role === "R4"));
    window.MOCK_DATA.membersOf = (g) => team.filter(m => m.guild === g && (m.role === "R5" || m.role === "R4"));
    window.MOCK_DATA.memberById = (id) => team.find(m => m.id === id);
  }, [team]);

  function createMember({ ign, role, guild }) {
    if (!ign?.trim()) return null;
    const id = "u_" + (role === "Prince" ? "prince" : role === "Recruiter" ? "rec" : guild) + "_" + Date.now();
    const member = {
      id,
      ign: ign.trim(),
      role,
      guild: (role === "Prince" || role === "Recruiter") ? null : guild,
      color: (role === "Prince" || role === "Recruiter") ? "all" : guild,
      isPrince: role === "Prince",
      password: generatePassword(),
      createdAt: new Date().toISOString(),
    };
    setTeam(prev => [...prev, member]);
    return member;
  }
  function updateMember(id, patch) {
    setTeam(prev => prev.map(m => m.id === id ? { ...m, ...patch,
      color: (patch.role === "Prince" || patch.role === "Recruiter") ? "all" : (patch.guild || m.guild),
      guild: (patch.role === "Prince" || patch.role === "Recruiter") ? null : (patch.guild ?? m.guild),
      isPrince: patch.role ? patch.role === "Prince" : m.isPrince,
    } : m));
  }
  function deleteMember(id) {
    setTeam(prev => prev.filter(m => m.id !== id));
  }
  function regeneratePassword(id) {
    const newPwd = generatePassword();
    setTeam(prev => prev.map(m => m.id === id ? { ...m, password: newPwd } : m));
    return newPwd;
  }

  // ===== Auth / role =====
  // Roles: visitor | player_new | player_applicant | rad_r5 | rad_r4 | mtlh_r5 | mtlh_r4 | super | recruiter
  const [role, setRole] = aUs(() => localStorage.getItem("radmtlh_role") || "visitor");
  aUe(() => localStorage.setItem("radmtlh_role", role), [role]);

  // ===== Profile for "new player" path =====
  const [profile, setProfile] = aUs(() => {
    const saved = localStorage.getItem("radmtlh_profile");
    return saved ? JSON.parse(saved) : null;
  });
  aUe(() => { if (profile) localStorage.setItem("radmtlh_profile", JSON.stringify(profile)); }, [profile]);

  // ===== Applicants (with chat) — seed from MOCK_DATA, merge chats =====
  const [applicants, setApplicants] = aUs(() => {
    return window.MOCK_DATA.APPLICANTS.map(a => ({
      ...a,
      chat: window.MOCK_DATA.CHATS[a.id] || [],
    }));
  });

  // The "self applicant" when player_new finishes the flow
  const [selfApplicantId, setSelfApplicantId] = aUs(() => localStorage.getItem("radmtlh_selfApplicantId") || null);
  aUe(() => {
    if (selfApplicantId) localStorage.setItem("radmtlh_selfApplicantId", selfApplicantId);
    else localStorage.removeItem("radmtlh_selfApplicantId");
  }, [selfApplicantId]);

  // ===== Route =====
  const navigate = useNavigate();
  const location = useLocation();
  const route = location.pathname === "/" ? "landing" : location.pathname.substring(1);
  const setRoute = (r) => {
    navigate(r === "landing" ? "/" : `/${r}`);
  };

  // ===== Derived: current user info =====
  const currentUserInfo = aUm(() => {
    if (role === "visitor") return { name: null, id: null };
    if (role === "player_new") return { name: profile?.ign || "Toi", id: selfApplicantId };
    if (role === "player_applicant") {
      // Default to Ophelya (a_001) so the demo "in-review" view works
      const id = selfApplicantId || "a_001";
      const a = applicants.find(x => x.id === id);
      return { name: a?.ign || "Toi", id };
    }
    if (role === "rad_r5") return { name: "Vortexa", id: "u_rad_r5" };
    if (role === "rad_r4") return { name: "Heliax", id: "u_rad_r4a" };
    if (role === "mtlh_r5") return { name: "Ironclad", id: "u_mtlh_r5" };
    if (role === "mtlh_r4") return { name: "Hammerfall", id: "u_mtlh_r4a" };
    if (role === "super") return { name: "Vortexa ★", id: "u_rad_r5" };
    if (role === "recruiter") {
      const rec = team.find(m => m.role === "Recruiter");
      return { name: rec ? rec.ign : "Recruiter", id: rec ? rec.id : "u_rec_01" };
    }
    return { name: null, id: null };
  }, [role, profile, selfApplicantId, applicants, team]);

  // Reduce role to a simpler nav-role
  const navRole = aUm(() => {
    if (role === "visitor") return "visitor";
    if (role.startsWith("player")) return "player";
    if (role.startsWith("rad")) return "rad_r5"; // share nav between R5/R4
    if (role.startsWith("mtlh")) return "mtlh_r5";
    if (role === "super" || role === "recruiter") return "super";
    return "visitor";
  }, [role]);

  // ===== Auto-route based on role on login =====
  function login(acc) {
    setRole(acc.role);
    if (acc.role === "player_new") {
      setProfile(null);
      setSelfApplicantId(null);
      setRoute("profile");
    } else if (acc.role === "player_applicant") {
      setSelfApplicantId(acc.applicantId || "a_001");
      setRoute("player");
    } else if (acc.role === "super" || acc.role === "recruiter") {
      setRoute("super");
    } else {
      setRoute("admin");
    }
  }

  function logout() {
    setRole("visitor");
    setRoute("landing");
  }

  // Staff login (IGN + password) → role derived from team member
  function staffLogin(ign, password) {
    const m = team.find(x =>
      x.ign.toLowerCase() === ign.trim().toLowerCase() && x.password === password);
    if (!m) return false;
    let appRole;
    if (m.isPrince) appRole = "super";
    else if (m.role === "Recruiter") appRole = "recruiter";
    else if (m.role === "R5") appRole = m.guild + "_r5";
    else if (m.role === "R4") appRole = m.guild + "_r4";
    else return false;
    setRole(appRole);
    if (m.isPrince || m.role === "Recruiter") setRoute("super");
    else setRoute("admin");
    return true;
  }

  // ===== Application actions =====
  function submitApplication(app) {
    const id = "a_" + Date.now();
    const newApp = {
      id, avatar: (app.ign || "??").slice(0, 2).toUpperCase(),
      ...app, chat: [],
    };
    setApplicants(prev => [newApp, ...prev]);
    setSelfApplicantId(id);
    setRole("player_applicant");
  }

  function changeStatus(applicantId, status) {
    setApplicants(prev => prev.map(a => {
      if (a.id !== applicantId) return a;
      const stamp = new Date().toISOString();
      const sysMsg = { id: "m" + Date.now(), type: "system", text: (lang === "fr" ? "Statut → " : "Status → ") + t("status_" + status), ts: stamp };
      return { ...a, status, chat: [...(a.chat || []), sysMsg] };
    }));
  }

  function sendMessage(applicantId, msg) {
    setApplicants(prev => prev.map(a => {
      if (a.id !== applicantId) return a;
      return { ...a, chat: [...(a.chat || []), msg] };
    }));
  }

  function vote(applicantId, messageId, choice, userId) {
    setApplicants(prev => prev.map(a => {
      if (a.id !== applicantId) return a;
      const chat = (a.chat || []).map(m => {
        if (m.id !== messageId || m.type !== "vote") return m;
        const v = { yes: [...(m.votes?.yes || [])], no: [...(m.votes?.no || [])], abstain: [...(m.votes?.abstain || [])] };
        ["yes", "no", "abstain"].forEach(k => { v[k] = v[k].filter(x => x !== userId); });
        v[choice].push(userId);
        return { ...m, votes: v };
      });
      // also reflect onto the applicant's main vote tally (only count R5/R4 votes — same here)
      const voteMsg = chat.find(m => m.type === "vote");
      const votes = voteMsg ? voteMsg.votes : a.votes;
      return { ...a, chat, votes: votes || a.votes };
    }));
  }

  // ===== Render =====
  const myGuild = role.startsWith("rad") ? "rad" : role.startsWith("mtlh") ? "mtlh" : "rad";
  
  let body = (
    <Routes>
      <Route path="/" element={<LandingScreen t={t} lang={lang} setRoute={setRoute} role={navRole} guildSettings={guildSettings} />} />
      <Route path="/login" element={<LoginScreen t={t} lang={lang} login={login} staffLogin={staffLogin} />} />
      <Route path="/guild_settings" element={<GuildSettingsScreen t={t} lang={lang} guild={myGuild} settings={guildSettings[myGuild]} onSave={(patch) => updateGuildSettings(myGuild, patch)} />} />
      <Route path="/profile" element={<ProfileScreen t={t} lang={lang} profile={profile} setProfile={setProfile} setRoute={setRoute} />} />
      <Route path="/apply" element={!profile ? <Navigate to="/profile" replace /> : <ApplyScreen t={t} lang={lang} profile={profile} setApplication={submitApplication} setRoute={setRoute} />} />
      <Route path="/player" element={<PlayerDashboard t={t} lang={lang} applicant={applicants.find(a => a.id === currentUserInfo.id)} onSend={sendMessage} onVote={vote} />} />
      <Route path="/admin" element={<AdminDashboard t={t} lang={lang} role={role} currentUserId={currentUserInfo.id} applicants={applicants} onChangeStatus={changeStatus} onSend={sendMessage} onVote={vote} isSuper={role === "super" || role === "recruiter"} />} />
      <Route path="/super" element={<SuperAdminScreen t={t} lang={lang} applicants={applicants} team={team} isPrince={role === "super"} onCreateMember={createMember} onUpdateMember={updateMember} onDeleteMember={deleteMember} onRegeneratePassword={regeneratePassword} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  return (
    <div className="app">
      <TopBar
        route={route} setRoute={setRoute}
        role={navRole}
        lang={lang} setLang={setLang}
        t={t}
        onLogout={logout}
        selfName={currentUserInfo.name}
      />
      {body}

      <RoleSwitcher role={role} setRole={(r) => {
        setRole(r);
        // pick a sensible default route per role
        if (r === "visitor") setRoute("landing");
        else if (r === "player_new") { setProfile(null); setSelfApplicantId(null); setRoute("profile"); }
        else if (r === "player_applicant") { setSelfApplicantId("a_001"); setRoute("player"); }
        else if (r === "super" || r === "recruiter") setRoute("super");
        else setRoute("admin");
      }} t={t} />

      {/* Tweaks panel */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Style" />
        <TweakColor
          label="Couleur or"
          value={tw.goldHue}
          options={[
            "oklch(0.82 0.12 78)",
            "oklch(0.78 0.14 50)",
            "oklch(0.85 0.08 95)",
            "oklch(0.72 0.13 150)",
          ]}
          onChange={(v) => setTweak("goldHue", v)}
        />
      </TweaksPanel>
    </div>
  );
}

// ===== Role switcher (demo) =====
function RoleSwitcher({ role, setRole, t }) {
  const [open, setOpen] = React.useState(false);
  const opts = [
    { k: "visitor", l: t("role_visitor") },
    { k: "player_new", l: t("role_player") + " (new)" },
    { k: "player_applicant", l: t("role_player") + " (Ophelya)" },
    { k: "rad_r5", l: t("role_rad_r5") },
    { k: "mtlh_r5", l: t("role_mtlh_r5") },
    { k: "super", l: t("role_super") },
    { k: "recruiter", l: "Recruiter" },
  ];
  return (
    <div className={`role-switcher ${open ? "is-open" : ""}`}>
      <button className="role-switcher__toggle" aria-label="Demo role switcher" onClick={() => setOpen(o => !o)}>★</button>
      <div className="role-switcher__panel">
        <div className="role-switcher__title">★ {t("role_switcher")}</div>
        <div className="role-switcher__row">
          {opts.map(o => (
            <button key={o.k} className={role === o.k ? "active" : ""} onClick={() => { setRole(o.k); setOpen(false); }}>
              {o.l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== Tweaks =====
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "goldHue": "oklch(0.82 0.12 78)"
}/*EDITMODE-END*/;

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
