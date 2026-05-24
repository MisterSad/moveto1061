// Player Dashboard, Admin (R5/R4) Dashboard, Super-admin, Accepted roster

const _ps = React.useState;
const _pe = React.useEffect;
const _pm = React.useMemo;

// ============================================================
// PLAYER DASHBOARD
// ============================================================
function PlayerDashboard({ t, lang, session, profile }) {
  const [applicant, setApplicant] = _ps(null);
  const [loading, setLoading] = _ps(true);

  _pe(() => {
    if (session?.user?.id) {
      window.supabaseClient.from('applications').select('*').eq('user_id', session.user.id)
        .order('submitted_at', { ascending: false }).limit(1).single()
        .then(({ data, error }) => {
          if (data) {
             setApplicant({ ...data, ign: profile?.ign, discord: profile?.discord_tag });
          }
          setLoading(false);
        });
        
      // Subscribe
      const channel = window.supabaseClient.channel('player-app')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'applications', filter: `user_id=eq.${session.user.id}` }, payload => {
           setApplicant(prev => ({ ...prev, ...payload.new }));
        }).subscribe();
      return () => { window.supabaseClient.removeChannel(channel); }
    }
  }, [session, profile]);

  if (loading) return <main className="container"><div className="empty">Loading...</div></main>;
  if (!applicant) {
    return (
      <main className="container">
        <div className="empty">{lang === "fr" ? "Aucune candidature en cours." : "No application in progress."}</div>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="row row--between" style={{ marginBottom: 24 }}>
        <div>
          <div className="eyebrow">{t("dash_title")}</div>
          <h1 className="display" style={{ fontSize: 42, marginTop: 8 }}>
            {lang === "fr" ? "Bonjour " : "Hello "}<span style={{ fontStyle: "italic", color: "var(--gold)" }}>{applicant.ign}</span>.
          </h1>
        </div>
        <GuildBadge guild={applicant.guild} t={t} />
      </div>

      <StatusLarge status={applicant.status} t={t} />

      <div className="detail-grid" style={{ marginTop: 32 }}>
        <div className="card">
          <div className="card__head">
            <div className="card__title">{lang === "fr" ? "Ton profil candidat" : "Your candidate profile"}</div>
            <span className="mono" style={{ fontSize: 11, color: "var(--ink-mute)" }}>
              {lang === "fr" ? "Soumis le " : "Submitted "} {window.FMT.date(applicant.submitted_at, lang)}
            </span>
          </div>
          <ProfileKV applicant={applicant} t={t} lang={lang} />
        </div>

        <div className="chat-mobile-fill" style={{ height: 600 }}>
          <ChatPanel
            applicant={applicant}
            currentUserId={session?.user?.id}
            t={t} lang={lang}
          />
        </div>
      </div>
    </main>
  );
}

function ProfileKV({ applicant, t, lang }) {
  return (
    <div>
      <div className="kv"><span className="kv__k">{t("f_ign")}</span><span className="kv__v">{applicant.ign}</span></div>
      <div className="kv"><span className="kv__k">{t("f_uid")}</span><span className="kv__v mono">{applicant.uid}</span></div>
      <div className="kv"><span className="kv__k">{t("f_server")}</span><span className="kv__v mono">{applicant.server}</span></div>
      <div className="kv"><span className="kv__k">{t("f_power")}</span>
        <span className="kv__v" style={{ color: "var(--gold)", fontFamily: "var(--f-display)", fontSize: 20 }}>
          {window.FMT?.power ? window.FMT.power(parseInt(applicant.power) || 0) : applicant.power}
        </span>
      </div>
      <div className="kv"><span className="kv__k">{t("f_timezone")}</span><span className="kv__v">{applicant.timezone || "—"}</span></div>
      <div className="kv"><span className="kv__k">{t("f_language")}</span><span className="kv__v">{applicant.language || "—"}</span></div>
      <div className="kv"><span className="kv__k">{t("f_discord")}</span><span className="kv__v mono">{applicant.discord}</span></div>
      <div className="kv">
        <span className="kv__k">{t("f_motivation")}</span>
        <span className="kv__v" style={{ fontStyle: "italic", color: "var(--ink-dim)" }}>{applicant.motivation || "—"}</span>
      </div>
    </div>
  );
}

// ============================================================
// ADMIN DASHBOARD
// ============================================================
function AdminDashboard({ t, lang, role, currentUserId, forceGuild }) {
  const [applicants, setApplicants] = _ps([]);
  const [tab, setTab] = _ps("pending");
  const [selectedId, setSelectedId] = _ps(null);
  const [mobileView, setMobileView] = _ps("list");

  function fetchApplicants() {
    window.supabaseClient.from('applications')
      .select('*, profiles(ign, discord_tag)')
      .order('submitted_at', { ascending: false })
      .then(({ data, error }) => {
        if (data) {
          setApplicants(data.map(a => ({
            ...a,
            ign: a.profiles?.ign || 'Unknown',
            discord: a.profiles?.discord_tag || 'Unknown',
            votes: { yes: [], no: [], abstain: [] }
          })));
        }
      });
  }

  _pe(() => {
    fetchApplicants();
    const channel = window.supabaseClient.channel('admin-applications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, payload => {
        fetchApplicants();
      }).subscribe();
    return () => { window.supabaseClient.removeChannel(channel); };
  }, []);

  const filtered = _pm(() => {
    return applicants
      .filter(a => a.guild === forceGuild)
      .filter(a => tab === "all" ? true : a.status === tab);
  }, [applicants, forceGuild, tab]);

  const counts = _pm(() => {
    const subset = applicants.filter(a => a.guild === forceGuild);
    return {
      pending: subset.filter(a => a.status === "pending").length,
      review: subset.filter(a => a.status === "review").length,
      accepted: subset.filter(a => a.status === "accepted").length,
      rejected: subset.filter(a => a.status === "rejected").length,
      all: subset.length,
    };
  }, [applicants, forceGuild]);

  _pe(() => {
    if (filtered.length === 0) { setSelectedId(null); return; }
    if (!filtered.find(a => a.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered]);

  const selected = applicants.find(a => a.id === selectedId);

  async function changeStatus(applicantId, status) {
    await window.supabaseClient.from('applications').update({ status }).eq('id', applicantId);
  }

  return (
    <div className="admin-fullview">
      <div className="admin-fullview__head">
        <div className="row" style={{ gap: 16, alignItems: "center", minWidth: 0, flex: 1 }}>
          <div style={{ minWidth: 0 }}>
            <div className="row row--gap2">
              <div className="eyebrow">{t("admin_title")}</div>
            </div>
            <div className="admin-fullview__title display">
              {forceGuild === "rad" ? "RAD · The Radiant" : "MTLH · Metalheads"}
            </div>
          </div>

          <div className="admin-fullview__tabs">
            {[
              { k: "pending", l: t("tab_pending"), c: counts.pending },
              { k: "review", l: t("tab_review"), c: counts.review },
              { k: "accepted", l: t("tab_accepted"), c: counts.accepted },
              { k: "rejected", l: t("tab_rejected"), c: counts.rejected },
              { k: "all", l: t("tab_all"), c: counts.all },
            ].map(x => (
              <button key={x.k} className={tab === x.k ? "is-active" : ""} onClick={() => { setTab(x.k); setMobileView("list"); }}>
                {x.l}<span className="tabs__count">{x.c}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-fullview__mobiletabs">
        <button className={mobileView === "list" ? "is-active" : ""} onClick={() => setMobileView("list")}>
          List <span className="tabs__count">{filtered.length}</span>
        </button>
        <button className={mobileView === "detail" ? "is-active" : ""} onClick={() => setMobileView("detail")} disabled={!selected}>
          Profile
        </button>
        <button className={mobileView === "chat" ? "is-active" : ""} onClick={() => setMobileView("chat")} disabled={!selected}>
          Chat
        </button>
      </div>

      <div className={`admin-fullview__body view-${mobileView}`}>
        <aside className="admin-col admin-col--list">
          {filtered.length === 0 ? (
            <div className="empty" style={{ padding: 32 }}>{t("no_candidates")}</div>
          ) : (
            <div className="admin-list-compact">
              {filtered.map(a => (
                <CandidateCompactRow
                  key={a.id} a={a} t={t}
                  active={a.id === selectedId}
                  onClick={() => { setSelectedId(a.id); setMobileView("detail"); }}
                />
              ))}
            </div>
          )}
        </aside>

        <section className="admin-col admin-col--detail">
          {selected ? (
            <CandidateDetailCompact
              applicant={selected}
              t={t} lang={lang} role={role}
              onChangeStatus={changeStatus}
              onOpenChat={() => setMobileView("chat")}
            />
          ) : (
            <div className="empty" style={{ padding: 32 }}>Pick a candidate</div>
          )}
        </section>

        <section className="admin-col admin-col--chat">
          {selected ? (
            <ChatPanel
              applicant={selected}
              currentUserId={currentUserId}
              t={t} lang={lang}
            />
          ) : (
            <div className="empty" style={{ padding: 32 }}>No active conversation</div>
          )}
        </section>
      </div>
    </div>
  );
}

function CandidateCompactRow({ a, t, active, onClick }) {
  return (
    <button className={`candidate-compact ${active ? "is-active" : ""}`} onClick={onClick}>
      <Avatar name={a.ign} guild={a.guild} />
      <div className="candidate-compact__main">
        <div className="candidate-compact__name">{a.ign}</div>
        <div className="candidate-compact__sub mono">{a.server} · {window.FMT?.power ? window.FMT.power(a.power) : a.power}</div>
      </div>
      <div className="candidate-compact__right">
        <StatusBadge status={a.status} t={t} />
      </div>
    </button>
  );
}

function CandidateDetailCompact({ applicant, t, lang, role, onChangeStatus, onOpenChat }) {
  const isAdmin = role !== "player" && role !== "visitor" && role !== "player_new";
  return (
    <div className="admin-detail-compact">
      <div className="admin-detail-compact__head">
        <Avatar name={applicant.ign} guild={applicant.guild} size="lg" />
        <div style={{ minWidth: 0 }}>
          <div className="admin-detail-compact__name">{applicant.ign}</div>
          <div className="row row--gap2" style={{ marginTop: 6, flexWrap: "wrap" }}>
            <GuildBadge guild={applicant.guild} t={t} />
            <StatusBadge status={applicant.status} t={t} />
          </div>
        </div>
      </div>

      <div className="admin-detail-compact__scroll">
        <div className="admin-detail-compact__kv">
          <KvItem k={t("f_uid")} v={applicant.uid} mono />
          <KvItem k={t("f_server")} v={applicant.server} mono />
          <KvItem k={t("f_power")} v={window.FMT?.power ? window.FMT.power(parseInt(applicant.power) || 0) : applicant.power} accent />
          <KvItem k={t("f_timezone")} v={applicant.timezone || "—"} />
          <KvItem k={t("f_language")} v={applicant.language || "—"} />
          <KvItem k={t("f_discord")} v={applicant.discord} mono />
        </div>

        {applicant.motivation && (
          <div className="admin-detail-compact__motiv">
            <div className="kv__k" style={{ marginBottom: 6 }}>{t("f_motivation")}</div>
            <p style={{ margin: 0, color: "var(--ink-dim)", fontStyle: "italic", fontSize: 14, lineHeight: 1.5 }}>
              {applicant.motivation}
            </p>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="admin-detail-compact__actions">
          {applicant.status === "pending" && (
            <>
              <button className="btn btn--ghost btn--sm" onClick={() => onChangeStatus(applicant.id, "review")}>
                → {t("move_to_review")}
              </button>
              <button className="btn btn--ok btn--sm" onClick={() => onChangeStatus(applicant.id, "accepted")}>{t("accept")}</button>
              <button className="btn btn--danger btn--sm" onClick={() => onChangeStatus(applicant.id, "rejected")}>{t("reject")}</button>
            </>
          )}
          {applicant.status === "review" && (
            <>
              <button className="btn btn--ok btn--sm" onClick={() => onChangeStatus(applicant.id, "accepted")}>{t("accept")}</button>
              <button className="btn btn--danger btn--sm" onClick={() => onChangeStatus(applicant.id, "rejected")}>{t("reject")}</button>
              <button className="btn btn--ghost btn--sm" onClick={() => onChangeStatus(applicant.id, "pending")}>← {t("move_back")}</button>
            </>
          )}
          {(applicant.status === "accepted" || applicant.status === "rejected") && (
            <button className="btn btn--ghost btn--sm" onClick={() => onChangeStatus(applicant.id, "review")}>← {t("move_back")}</button>
          )}
        </div>
      )}
    </div>
  );
}

function KvItem({ k, v, mono, accent }) {
  return (
    <div className="admin-kv-item">
      <div className="kv__k">{k}</div>
      <div className={`admin-kv-item__v ${mono ? "mono" : ""} ${accent ? "accent" : ""}`}>{v}</div>
    </div>
  );
}

// ============================================================
// PRINCE DASHBOARD
// ============================================================
function PrinceDashboardScreen({ t, lang }) {
  const [applicants, setApplicants] = _ps([]);

  function fetchAll() {
    window.supabaseClient.from('applications').select('*').then(({ data }) => {
      if (data) setApplicants(data);
    });
  }

  _pe(() => { fetchAll(); }, []);

  const stats = _pm(() => {
    const groups = { rad: { pending: 0, review: 0, accepted: 0, rejected: 0, totalPower: 0 },
                     mtlh: { pending: 0, review: 0, accepted: 0, rejected: 0, totalPower: 0 } };
    applicants.forEach(a => {
      if (groups[a.guild]) {
        groups[a.guild][a.status]++;
        if (a.status === "accepted") groups[a.guild].totalPower += parseInt(a.power, 10);
      }
    });
    return groups;
  }, [applicants]);

  return (
    <main className="container container--wide">
      <div className="eyebrow">Prince View</div>
      <h1 className="display" style={{ fontSize: 44, marginTop: 8 }}>Consolidated view</h1>
      <div className="hairline hairline--gold"></div>

      <div className="grid-resp-2" style={{ gap: 24 }}>
        {["rad", "mtlh"].map(g => (
          <div key={g} className="card" style={{ borderTopWidth: 3, borderTopColor: `var(--${g})` }}>
            <div className="row" style={{ gap: 12, marginBottom: 16 }}>
              <span style={{ color: `var(--${g})`, width: 32, height: 32 }}>
                <GuildSigil guild={g} size={32} />
              </span>
              <div>
                <div className="card__title">{g === "rad" ? "RAD · The Radiant" : "MTLH · Metalheads"}</div>
                <div className="subtle" style={{ fontSize: 12 }}>
                  {stats[g].pending + stats[g].review + stats[g].accepted + stats[g].rejected} total applications
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 12 }}>
              {[
                { k: "pending", c: "var(--warn)", l: t("status_pending") },
                { k: "review", c: "var(--info)", l: t("status_review") },
                { k: "accepted", c: "var(--ok)", l: t("status_accepted") },
                { k: "rejected", c: "var(--bad)", l: t("status_rejected") },
              ].map(x => (
                <div key={x.k} style={{ padding: 12, background: "var(--bg-1)", borderRadius: 8, border: "1px solid var(--line-soft)" }}>
                  <div className="mono" style={{ fontSize: 9, color: x.c, textTransform: "uppercase", letterSpacing: "0.14em" }}>{x.l}</div>
                  <div className="display" style={{ fontSize: 28, marginTop: 6 }}>{stats[g][x.k]}</div>
                </div>
              ))}
            </div>
            <div className="mt-6" style={{ paddingTop: 16, borderTop: "1px solid var(--line-soft)" }}>
              <div className="row row--between">
                <span className="subtle" style={{ fontSize: 13 }}>Power added (accepted)</span>
                <span className="display" style={{ fontSize: 22, color: `var(--${g})` }}>
                  +{window.FMT?.power ? window.FMT.power(stats[g].totalPower) : stats[g].totalPower}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="display" style={{ fontSize: 32, marginTop: 64, marginBottom: 24 }}>{t("roster_title")}</h2>
      <RosterGrid applicants={applicants.filter(a => a.status === "accepted")} t={t} lang={lang} />
    </main>
  );
}

// ============================================================
// SYSTEM ADMIN DASHBOARD
// ============================================================
function SystemAdminScreen({ t, lang }) {
  const [team, setTeam] = _ps([]);

  function fetchTeam() {
    window.supabaseClient.from('profiles').select('*').neq('role', 'player_new').then(({ data }) => {
      if (data) setTeam(data.filter(u => u.role !== 'player')); // Filter out regular players to show only officers/super
    });
  }

  _pe(() => { fetchTeam(); }, []);

  return (
    <main className="container container--wide">
      <div className="eyebrow">System Admin</div>
      <h1 className="display" style={{ fontSize: 44, marginTop: 8 }}>Team management</h1>
      <div className="hairline hairline--gold"></div>
      
      <p className="subtle" style={{ marginBottom: 24, marginTop: 24 }}>Update roles of existing members. (Note: Only members who logged in at least once appear here)</p>
      <div className="card">
        <div className="team-list__head row row--between" style={{ padding: "0 0 12px 0", borderBottom: "1px solid var(--line-soft)", fontWeight: "bold", fontSize: 13 }}>
          <div style={{ flex: 1 }}>Member</div>
          <div style={{ width: 130 }}>Base Role</div>
          <div style={{ width: 80, textAlign: "center" }}>Prince?</div>
          <div style={{ width: 80, textAlign: "center" }}>Recruiter?</div>
          <div style={{ width: 80, textAlign: "center", color: "var(--gold)" }}>Admin?</div>
        </div>
        {team.map(m => (
           <div key={m.id} className="row row--between" style={{ padding: "12px 0", borderBottom: "1px solid var(--line-soft)", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <strong>{m.ign}</strong> <span className="mono subtle" style={{fontSize:11}}>({m.discord_tag})</span>
              </div>
              <div style={{ width: 130 }}>
                <select className="select" style={{ padding: "4px 8px", fontSize: 13 }} value={m.role} onChange={(e) => {
                  window.supabaseClient.from('profiles').update({ role: e.target.value }).eq('id', m.id).then(() => fetchTeam());
                }}>
                  <option value="player">Player</option>
                  <option value="rad_r4">RAD R4</option>
                  <option value="rad_r5">RAD R5</option>
                  <option value="mtlh_r4">MTLH R4</option>
                  <option value="mtlh_r5">MTLH R5</option>
                </select>
              </div>
              <div style={{ width: 80, textAlign: "center" }}>
                <input type="checkbox" checked={!!m.is_prince} onChange={(e) => {
                  window.supabaseClient.from('profiles').update({ is_prince: e.target.checked }).eq('id', m.id).then(() => fetchTeam());
                }} />
              </div>
              <div style={{ width: 80, textAlign: "center" }}>
                <input type="checkbox" checked={!!m.is_recruiter} onChange={(e) => {
                  window.supabaseClient.from('profiles').update({ is_recruiter: e.target.checked }).eq('id', m.id).then(() => fetchTeam());
                }} />
              </div>
              <div style={{ width: 80, textAlign: "center" }}>
                <input type="checkbox" checked={!!m.is_admin} onChange={(e) => {
                  window.supabaseClient.from('profiles').update({ is_admin: e.target.checked }).eq('id', m.id).then(() => fetchTeam());
                }} />
              </div>
           </div>
        ))}
      </div>
    </main>
  );
}

function RosterGrid({ applicants, t, lang }) {
  if (applicants.length === 0) {
    return <div className="empty">{lang === "fr" ? "Aucun joueur accepté pour l'instant" : "No accepted players yet"}</div>;
  }
  return (
    <div className="roster">
      {applicants.map(a => (
        <div key={a.id} className={`roster__card is-${a.guild}`}>
          <div className="row" style={{ gap: 12 }}>
            <Avatar name={a.ign} guild={a.guild} size="lg" />
            <div>
              <div style={{ fontFamily: "var(--f-display)", fontSize: 22 }}>{a.ign}</div>
              <div className="mono" style={{ fontSize: 11, color: "var(--ink-mute)" }}>UID · {a.uid}</div>
            </div>
          </div>
          <div className="row row--between" style={{ paddingTop: 12, borderTop: "1px solid var(--line-soft)" }}>
            <div>
              <div className="kv__k">{t("f_power")}</div>
              <div style={{ color: `var(--${a.guild})`, fontFamily: "var(--f-display)", fontSize: 22 }}>
                {window.FMT?.power ? window.FMT.power(a.power) : a.power}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="kv__k">{t("f_server")}</div>
              <div className="mono" style={{ fontSize: 13, marginTop: 2 }}>{a.server}</div>
            </div>
          </div>
          <GuildBadge guild={a.guild} t={t} />
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { PlayerDashboard, AdminDashboard, PrinceDashboardScreen, SystemAdminScreen, RosterGrid });
