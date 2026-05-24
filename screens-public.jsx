// Landing + Login + Profile creation + Apply screens

const _useState = React.useState;
const _useEffect = React.useEffect;

// ============================================================
// LANDING
// ============================================================
function LandingScreen({ t, lang, setRoute, role, guildSettings }) {
  return (
    <main>
      <section className="hero">
        <div className="hero__inner">
          <div className="eyebrow">{t("hero_eyebrow")}</div>
          <h1 className="display">
            {t("hero_title_a")}<br />
            {t("hero_title_b")}<br /><span className="accent">{t("hero_title_c")}</span>
          </h1>
          <p className="lead">{t("hero_lead")}</p>
          <div className="hero__cta">
            <button className="btn btn--primary btn--lg" onClick={() => setRoute(role === "visitor" ? "login" : "apply")}>
              {t("hero_cta_apply")} →
            </button>
            <button className="btn btn--ghost btn--lg" onClick={() => {
              document.getElementById("guilds-section").scrollIntoView({ behavior: "smooth", block: "start" });
            }}>{t("hero_cta_learn")}</button>
          </div>

          <div className="mono" style={{ marginTop: 64, color: "var(--ink-mute)", fontSize: 12, letterSpacing: "0.18em" }}>
            ─── 21 : 14 : 03 : 47 ───
            <div style={{ marginTop: 4, fontSize: 10, letterSpacing: "0.22em" }}>
              {lang === "fr" ? "TEMPS RESTANT AVANT MIGRATION" : "TIME UNTIL MIGRATION"}
            </div>
          </div>
        </div>
      </section>

      <section id="guilds-section" className="container container--wide">
        <div className="guilds">
          <GuildPresentation guild="rad" t={t} lang={lang} setRoute={setRoute} role={role} settings={guildSettings?.rad} />
          <GuildPresentation guild="mtlh" t={t} lang={lang} setRoute={setRoute} role={role} settings={guildSettings?.mtlh} />
        </div>

        <div style={{ marginTop: 80, marginBottom: 80, textAlign: "center" }}>
          <div className="eyebrow eyebrow--mute">{lang === "fr" ? "Comment ça marche" : "How it works"}</div>
          <h2 className="display" style={{ margin: "16px 0 48px" }}>
            {lang === "fr" ? "Quatre étapes." : "Four steps."}
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 24, maxWidth: 1100, margin: "0 auto"
          }}>
            {[
              { n: "01", t: lang === "fr" ? "Connexion Discord" : "Discord login", d: lang === "fr" ? "Authentification rapide via Discord." : "Quick auth through Discord." },
              { n: "02", t: lang === "fr" ? "Profil joueur" : "Player profile", d: lang === "fr" ? "Tu renseignes nom, UID, serveur, puissance." : "You enter IGN, UID, server, power." },
              { n: "03", t: lang === "fr" ? "Candidature" : "Application", d: lang === "fr" ? "Tu choisis ta guilde et tu déposes." : "You pick a guild and apply." },
              { n: "04", t: lang === "fr" ? "Décision R5/R4" : "R5/R4 review", d: lang === "fr" ? "Les officiers discutent, votent, statuent." : "Officers discuss, vote, decide." },
            ].map(s => (
              <div key={s.n} style={{ textAlign: "left", padding: "24px 0", borderTop: "1px solid var(--line-soft)" }}>
                <div className="mono" style={{ color: "var(--gold)", fontSize: 12, letterSpacing: "0.2em" }}>{s.n}</div>
                <div className="display" style={{ fontSize: 22, marginTop: 8 }}>{s.t}</div>
                <div className="subtle" style={{ marginTop: 6, fontSize: 14 }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function GuildPresentation({ guild, t, lang, setRoute, role, settings }) {
  const s = settings || {};
  const reqs = (lang === "fr" ? s.req : s.reqEn) || [];
  const pitch = (lang === "fr" ? s.pitch : s.pitchEn) || "";
  const data = guild === "rad"
    ? {
        name: "RAD · The Radiant",
        members: s.members ?? 47, avg: s.avgPower ?? "73M", slots: s.slots ?? 8,
        motto: t("rad_motto"),
        pitch, reqs,
      }
    : {
        name: "MTLH · Metalheads",
        members: s.members ?? 52, avg: s.avgPower ?? "58M", slots: s.slots ?? 12,
        motto: t("mtlh_motto"),
        pitch, reqs,
      };
  const c = guild === "rad" ? "rad" : "mtlh";
  return (
    <div className={`guild-card guild-card--${guild}`} style={{ color: `var(--${c})` }}>
      <div className="guild-card__sigil">
        <GuildSigil guild={guild} size={80} />
      </div>
      <div style={{ textAlign: "center", color: "var(--ink)" }}>
        <div className="eyebrow" style={{ color: `var(--${c})` }}>{guild === "rad" ? "Order I" : "Order II"}</div>
        <h2 className="display" style={{ marginTop: 12, fontSize: 36 }}>{data.name}</h2>
        <div className="guild-card__motto">{data.motto}</div>
        <p style={{ color: "var(--ink-dim)", maxWidth: 440, margin: "0 auto", fontSize: 15 }}>{data.pitch}</p>

        <div className="guild-stats">
          <div className="guild-stats__item">
            <div className="guild-stats__value" style={{ color: `var(--${c})` }}>{data.members}</div>
            <div className="guild-stats__label">{t("stat_members")}</div>
          </div>
          <div className="guild-stats__item">
            <div className="guild-stats__value" style={{ color: `var(--${c})` }}>{data.avg}</div>
            <div className="guild-stats__label">{t("stat_avg_power")}</div>
          </div>
          <div className="guild-stats__item">
            <div className="guild-stats__value" style={{ color: `var(--${c})` }}>{data.slots}</div>
            <div className="guild-stats__label">{t("stat_open_slots")}</div>
          </div>
        </div>

        <hr className="hairline" />

        <div className="text-center" style={{ marginBottom: 24 }}>
          <div className="eyebrow eyebrow--mute">{t("requirements")}</div>
          <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", fontSize: 14, color: "var(--ink-dim)" }}>
            {data.reqs.map((r, i) => (
              <li key={i} style={{ padding: "6px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <span style={{ color: `var(--${c})`, fontFamily: "var(--f-mono)", fontSize: 11 }}>0{i + 1}</span>
                {r}
              </li>
            ))}
          </ul>
        </div>

        <button className="btn btn--primary" onClick={() => {
          if (role === "visitor") setRoute("login");
          else setRoute("apply");
        }}>
          {t("apply_to_guild")}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// LOGIN (mock Discord OAuth + staff login)
// ============================================================
function LoginScreen({ t, lang, login, staffLogin }) {
  // demo accounts
  const accounts = [
    { id: "demo_new", name: "Nouveau joueur", desc: lang === "fr" ? "Test du flow complet (sans profil)" : "Full flow test (no profile)", role: "player_new" },
    { id: "demo_player", name: "Ophelya (RAD applicant)", desc: lang === "fr" ? "Candidature en discussion" : "Application under review", role: "player_applicant", applicantId: "a_001" },
    { id: "demo_rad", name: "Heliax (R4 RAD)", desc: lang === "fr" ? "Officier de RAD" : "RAD officer", role: "rad_r4" },
    { id: "demo_mtlh", name: "Ironclad (R5 MTLH)", desc: lang === "fr" ? "Chef de MTLH" : "MTLH leader", role: "mtlh_r5" },
    { id: "demo_super", name: "Vortexa (R5 RAD + Prince)", desc: lang === "fr" ? "Toi — Prince du site" : "You — site Prince", role: "super" },
  ];

  const [staffIgn, setStaffIgn] = _useState("");
  const [staffPwd, setStaffPwd] = _useState("");
  const [staffErr, setStaffErr] = _useState("");

  function trySignIn(e) {
    e?.preventDefault?.();
    setStaffErr("");
    if (!staffIgn.trim() || !staffPwd.trim()) {
      setStaffErr("Enter your in-game name and password.");
      return;
    }
    const ok = staffLogin(staffIgn, staffPwd);
    if (!ok) setStaffErr("No staff account matches these credentials.");
  }

  return (
    <main className="center-stage">
      <div className="auth-card card">
        <div className="text-center">
          <div className="glyph-big">●</div>
          <div className="eyebrow">{t("login_title")}</div>
          <h2 className="display" style={{ marginTop: 8, fontSize: 32 }}>
            {lang === "fr" ? "Accès au portail" : "Portal access"}
          </h2>
          <p className="subtle" style={{ marginTop: 12 }}>{t("login_lead")}</p>
        </div>

        <button className="btn btn--discord" style={{ width: "100%", marginTop: 24, justifyContent: "center" }}
          onClick={() => window.location.href = '/api/auth/discord'}>
          <svg width="20" height="15" viewBox="0 0 71 55" fill="currentColor"><path d="M60.1 4.9A58.6 58.6 0 0 0 45.4.5l-.6 1.4a54 54 0 0 0-12.9 0L31.3.5c-5 .8-10 2.3-14.6 4.4C7.5 18.8 5 32.3 6.3 45.6a59 59 0 0 0 17.7 8.9l1.5-2c-2.4-.9-4.7-2-7-3.4l1.7-1.4a42 42 0 0 0 35.7 0l1.7 1.4c-2.2 1.3-4.5 2.5-7 3.4l1.5 2a59 59 0 0 0 17.7-8.9c1.4-15.3-2.4-28.6-9.7-40.7Zm-35.7 33c-3.5 0-6.4-3.2-6.4-7.2 0-3.9 2.8-7.1 6.4-7.1 3.6 0 6.5 3.2 6.4 7.1 0 4-2.9 7.2-6.4 7.2Zm22.2 0c-3.5 0-6.4-3.2-6.4-7.2 0-3.9 2.8-7.1 6.4-7.1 3.6 0 6.4 3.2 6.4 7.1 0 4-2.8 7.2-6.4 7.2Z"/></svg>
          {t("login_cta")}
        </button>

        {/* Staff sign-in */}
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--line-soft)" }}>
          <div className="row row--between" style={{ alignItems: "baseline" }}>
            <div className="eyebrow eyebrow--mute">Staff sign-in</div>
            <span className="mono faint" style={{ fontSize: 10.5, letterSpacing: "0.12em" }}>R5 · R4 · RECRUITER · PRINCE</span>
          </div>
          <p className="subtle" style={{ fontSize: 12, marginTop: 6 }}>
            Use the credentials your Prince shared with you when your account was created.
          </p>
          <form onSubmit={trySignIn} className="col col--gap4" style={{ marginTop: 16 }}>
            <Field label="In-game name" required>
              <input className="input" value={staffIgn} onChange={e => setStaffIgn(e.target.value)} placeholder="Vortexa" autoComplete="username" />
            </Field>
            <Field label="Password" required error={staffErr}>
              <input className="input mono" type="password" value={staffPwd} onChange={e => setStaffPwd(e.target.value)} placeholder="••••••••••••••••" autoComplete="current-password" />
            </Field>
            <button type="submit" className="btn btn--primary" style={{ width: "100%", justifyContent: "center" }}>Sign in</button>
          </form>
        </div>

        <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--line-soft)" }}>
          <div className="eyebrow eyebrow--mute">{t("login_pick_account")}</div>
          <p className="subtle" style={{ fontSize: 12, marginTop: 6 }}>{t("login_disclaimer")}</p>
          <div className="col" style={{ marginTop: 16, gap: 8 }}>
            {accounts.map(a => (
              <button key={a.id} className="btn btn--ghost"
                style={{ justifyContent: "space-between", width: "100%", padding: "14px 16px", textTransform: "none", letterSpacing: 0 }}
                onClick={() => login(a)}>
                <span style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</div>
                  <div className="subtle" style={{ fontSize: 12, marginTop: 2, fontWeight: 400 }}>{a.desc}</div>
                </span>
                <span style={{ color: "var(--gold)" }}>→</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

// ============================================================
// PROFILE CREATION
// ============================================================
function ProfileScreen({ t, lang, profile, setProfile, setRoute }) {
  const [form, setForm] = _useState(() => {
    if (profile) return profile;
    const initial = { ign: "", uid: "", server: "", power: "", timezone: "", language: "", discord: "", motivation: "" };
    try {
      const dUser = JSON.parse(localStorage.getItem('radmtlh_discordUser'));
      if (dUser && dUser.username) {
        initial.discord = dUser.username + (dUser.discriminator && dUser.discriminator !== "0" ? "#" + dUser.discriminator : "");
      }
    } catch(e) {}
    return initial;
  });
  const [errors, setErrors] = _useState({});

  function update(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function submit() {
    const e = {};
    if (!form.ign) e.ign = lang === "fr" ? "Requis" : "Required";
    if (!form.uid) e.uid = lang === "fr" ? "Requis" : "Required";
    if (!form.server) e.server = lang === "fr" ? "Requis" : "Required";
    if (!form.power) e.power = lang === "fr" ? "Requis" : "Required";
    if (!form.discord) e.discord = lang === "fr" ? "Requis" : "Required";
    setErrors(e);
    if (Object.keys(e).length === 0) {
      setProfile(form);
      setRoute("apply");
    }
  }

  return (
    <main className="container container--narrow">
      <Stepper steps={[
        lang === "fr" ? "Connexion" : "Login",
        lang === "fr" ? "Profil" : "Profile",
        lang === "fr" ? "Candidature" : "Application",
      ]} current={1} />

      <div className="eyebrow">{lang === "fr" ? "Étape 02" : "Step 02"}</div>
      <h1 className="display" style={{ fontSize: 44, marginTop: 12 }}>{t("profile_title")}</h1>
      <p className="subtle" style={{ fontSize: 16, marginTop: 12, marginBottom: 40 }}>{t("profile_lead")}</p>

      <div className="card">
        <div className="grid-resp-2" style={{ gap: 20 }}>
          <Field label={t("f_ign")} required error={errors.ign}>
            <input className="input" value={form.ign} onChange={e => update("ign", e.target.value)}
              placeholder="Aurelyn" />
          </Field>
          <Field label={t("f_uid")} required hint="ex. 874 192 003" error={errors.uid}>
            <input className="input mono" value={form.uid} onChange={e => update("uid", e.target.value)}
              placeholder="000 000 000" />
          </Field>
          <Field label={t("f_server")} required error={errors.server}>
            <input className="input mono" value={form.server} onChange={e => update("server", e.target.value)}
              placeholder="S-3914" />
          </Field>
          <Field label={t("f_power")} required hint={lang === "fr" ? "ex. 65000000" : "e.g. 65000000"} error={errors.power}>
            <input className="input mono" value={form.power} onChange={e => update("power", e.target.value)}
              placeholder="65000000" />
          </Field>
          <Field label={t("f_timezone")}>
            <input className="input" value={form.timezone} onChange={e => update("timezone", e.target.value)}
              placeholder="UTC+1 — soirs" />
          </Field>
          <Field label={t("f_language")}>
            <input className="input" value={form.language} onChange={e => update("language", e.target.value)}
              placeholder="FR / EN" />
          </Field>
          <Field label={t("f_discord")} required error={errors.discord}>
            <input className="input mono" value={form.discord} onChange={e => update("discord", e.target.value)}
              placeholder="pseudo#1234" />
          </Field>
          <div></div>
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label={t("f_motivation")} hint={t("f_motivation_hint")}>
              <textarea className="textarea" value={form.motivation} onChange={e => update("motivation", e.target.value)}
                placeholder={lang === "fr" ? "Pourquoi tu rejoins, ce que tu apportes…" : "Why you're joining, what you bring…"} />
            </Field>
          </div>
        </div>

        <div className="row row--end" style={{ marginTop: 28 }}>
          <button className="btn btn--primary btn--lg" onClick={submit}>{t("save_continue")} →</button>
        </div>
      </div>
    </main>
  );
}

// ============================================================
// APPLY — guild picker
// ============================================================
function ApplyScreen({ t, lang, profile, setApplication, setRoute }) {
  const [pick, setPick] = _useState(null);
  function submit() {
    if (!pick) return;
    setApplication({
      ...profile,
      guild: pick,
      status: "pending",
      votes: { yes: [], no: [], abstain: [] },
      submittedAt: new Date().toISOString(),
    });
    setRoute("player");
  }
  return (
    <main className="container container--narrow">
      <Stepper steps={[
        lang === "fr" ? "Connexion" : "Login",
        lang === "fr" ? "Profil" : "Profile",
        lang === "fr" ? "Candidature" : "Application",
      ]} current={2} />

      <div className="eyebrow">{lang === "fr" ? "Étape 03" : "Step 03"}</div>
      <h1 className="display" style={{ fontSize: 44, marginTop: 12 }}>{t("apply_title")}</h1>
      <p className="subtle" style={{ fontSize: 16, marginTop: 12, marginBottom: 40 }}>{t("apply_lead")}</p>

      <div className="guild-picker">
        {["rad", "mtlh"].map(g => (
          <div key={g} className={`guild-pick guild-pick--${g} ${pick === g ? "selected" : ""}`}
            onClick={() => setPick(g)}>
            <div style={{ color: `var(--${g})`, margin: "0 auto 16px", width: 72, height: 72 }}>
              <GuildSigil guild={g} size={72} />
            </div>
            <div className="display" style={{ fontSize: 22, marginTop: 4 }}>
              {g === "rad" ? "RAD · The Radiant" : "MTLH · Metalheads"}
            </div>
            <div className="subtle" style={{ fontSize: 13, marginTop: 8, fontStyle: "italic" }}>
              {g === "rad" ? t("rad_motto") : t("mtlh_motto")}
            </div>
            <div className="mono" style={{ marginTop: 16, fontSize: 11, color: "var(--ink-mute)", letterSpacing: "0.14em" }}>
              {g === "rad" ? "POWER ≥ 60M" : "POWER ≥ 45M"}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 32 }}>
        <div className="eyebrow eyebrow--mute">{lang === "fr" ? "Récap de ton profil" : "Profile recap"}</div>
        <div className="grid-resp-4" style={{ gap: 16, marginTop: 16 }}>
          <div>
            <div className="kv__k">{t("f_ign")}</div>
            <div style={{ marginTop: 4 }}>{profile.ign}</div>
          </div>
          <div>
            <div className="kv__k">{t("f_uid")}</div>
            <div className="mono" style={{ marginTop: 4, fontSize: 13 }}>{profile.uid}</div>
          </div>
          <div>
            <div className="kv__k">{t("f_server")}</div>
            <div className="mono" style={{ marginTop: 4, fontSize: 13 }}>{profile.server}</div>
          </div>
          <div>
            <div className="kv__k">{t("f_power")}</div>
            <div style={{ marginTop: 4, color: "var(--gold)", fontFamily: "var(--f-display)", fontSize: 20 }}>
              {window.FMT.power(parseInt(profile.power) || 0)}
            </div>
          </div>
        </div>
      </div>

      <div className="row row--between mt-8">
        <button className="btn btn--ghost" onClick={() => setRoute("profile")}>← {lang === "fr" ? "Modifier le profil" : "Edit profile"}</button>
        <button className="btn btn--primary btn--lg" disabled={!pick} onClick={submit}>
          {t("apply_submit")} →
        </button>
      </div>
    </main>
  );
}

Object.assign(window, { LandingScreen, LoginScreen, ProfileScreen, ApplyScreen });
