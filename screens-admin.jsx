// Player Dashboard, Admin (R5/R4) Dashboard, Super-admin, Accepted roster

const _ps = React.useState;
const _pe = React.useEffect;
const _pm = React.useMemo;

// ============================================================
// PLAYER DASHBOARD
// ============================================================
function PlayerDashboard({ t, lang, applicant, onSend, onVote }) {
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
              {lang === "fr" ? "Soumis le " : "Submitted "} {window.FMT.date(applicant.submittedAt, lang)}
            </span>
          </div>
          <ProfileKV applicant={applicant} t={t} lang={lang} />

          {applicant.status === "review" && (
            <div className="mt-6" style={{ padding: 16, background: "var(--bg-1)", borderRadius: 8, border: "1px dashed var(--line)" }}>
              <div className="eyebrow eyebrow--mute">{lang === "fr" ? "Votes en cours" : "Live votes"}</div>
              <div style={{ marginTop: 12 }}>
                <VotePills votes={applicant.votes} />
              </div>
              <p className="subtle" style={{ fontSize: 13, marginTop: 12 }}>
                {lang === "fr"
                  ? "Les officiers de la guilde votent ci-dessous. Tu peux échanger avec eux directement dans le chat."
                  : "The guild officers are voting below. You can chat with them directly."}
              </p>
            </div>
          )}
        </div>

        <div className="chat-mobile-fill" style={{ height: 600 }}>
          <ChatPanel
            applicant={applicant}
            currentUserId={applicant.id}
            t={t} lang={lang}
            onSend={onSend} onVote={onVote}
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
          {window.FMT.power(parseInt(applicant.power) || 0)}
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
// ADMIN DASHBOARD (R5/R4 of one guild) — 3-column fixed layout
// Fills the viewport: no outer scroll. Each column has its own
// internal scroll when needed. Chat is always visible on desktop.
// ============================================================
function AdminDashboard({ t, lang, role, currentUserId, applicants, onChangeStatus, onSend, onVote, isSuper }) {
  const myGuild =
    role === "rad_r5" || role === "rad_r4" ? "rad"
    : role === "mtlh_r5" || role === "mtlh_r4" ? "mtlh"
    : null;

  const [guildFilter, setGuildFilter] = _ps(myGuild || "rad");
  const [tab, setTab] = _ps("pending");
  const [selectedId, setSelectedId] = _ps(null);
  // Mobile column toggle: "list" | "detail" | "chat"
  const [mobileView, setMobileView] = _ps("list");

  const visibleAll = _pm(() => {
    if (isSuper) return applicants;
    return applicants.filter(a => a.guild === myGuild);
  }, [applicants, myGuild, isSuper]);

  const filtered = _pm(() => {
    const g = isSuper ? guildFilter : myGuild;
    return visibleAll
      .filter(a => a.guild === g)
      .filter(a => tab === "all" ? true : a.status === tab);
  }, [visibleAll, guildFilter, tab, myGuild, isSuper]);

  const counts = _pm(() => {
    const g = isSuper ? guildFilter : myGuild;
    const subset = visibleAll.filter(a => a.guild === g);
    return {
      pending: subset.filter(a => a.status === "pending").length,
      review: subset.filter(a => a.status === "review").length,
      accepted: subset.filter(a => a.status === "accepted").length,
      rejected: subset.filter(a => a.status === "rejected").length,
      all: subset.length,
    };
  }, [visibleAll, guildFilter, myGuild, isSuper]);

  _pe(() => {
    if (filtered.length === 0) { setSelectedId(null); return; }
    if (!filtered.find(a => a.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered]);

  const selected = applicants.find(a => a.id === selectedId);

  return (
    <div className="admin-fullview">
      {/* Header bar */}
      <div className="admin-fullview__head">
        <div className="row" style={{ gap: 16, alignItems: "center", minWidth: 0, flex: 1 }}>
          <div style={{ minWidth: 0 }}>
            <div className="row row--gap2">
              <div className="eyebrow">{t("admin_title")}</div>
              {isSuper && <span className="badge badge--role" style={{ color: "var(--gold)" }}>● {t("super_title")}</span>}
            </div>
            <div className="admin-fullview__title display">
              {isSuper
                ? "All applications"
                : (myGuild === "rad" ? "RAD · The Radiant" : "MTLH · Metalheads")}
            </div>
          </div>

          {/* Tabs inline */}
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

        {isSuper && (
          <div className="row row--gap2">
            <button className={`btn btn--sm ${guildFilter === "rad" ? "btn--primary" : "btn--ghost"}`} onClick={() => setGuildFilter("rad")}>RAD</button>
            <button className={`btn btn--sm ${guildFilter === "mtlh" ? "btn--primary" : "btn--ghost"}`} onClick={() => setGuildFilter("mtlh")}>MTLH</button>
          </div>
        )}
      </div>

      {/* Mobile column switcher */}
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

      {/* 3-column body */}
      <div className={`admin-fullview__body view-${mobileView}`}>
        {/* Col 1 — List */}
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

        {/* Col 2 — Profile */}
        <section className="admin-col admin-col--detail">
          {selected ? (
            <CandidateDetailCompact
              applicant={selected}
              t={t} lang={lang} role={role}
              onChangeStatus={onChangeStatus}
              onOpenChat={() => setMobileView("chat")}
            />
          ) : (
            <div className="empty" style={{ padding: 32 }}>Pick a candidate</div>
          )}
        </section>

        {/* Col 3 — Chat */}
        <section className="admin-col admin-col--chat">
          {selected ? (
            <ChatPanel
              applicant={selected}
              currentUserId={currentUserId}
              t={t} lang={lang}
              onSend={onSend} onVote={onVote}
            />
          ) : (
            <div className="empty" style={{ padding: 32 }}>No active conversation</div>
          )}
        </section>
      </div>
    </div>
  );
}

// Compact row used in the new fixed-height list column.
function CandidateCompactRow({ a, t, active, onClick }) {
  return (
    <button className={`candidate-compact ${active ? "is-active" : ""}`} onClick={onClick}>
      <Avatar name={a.ign} guild={a.guild} />
      <div className="candidate-compact__main">
        <div className="candidate-compact__name">{a.ign}</div>
        <div className="candidate-compact__sub mono">{a.server} · {window.FMT.power(a.power)}</div>
      </div>
      <div className="candidate-compact__right">
        <StatusBadge status={a.status} t={t} />
        <div className="candidate-compact__votes"><VotePills votes={a.votes} /></div>
      </div>
    </button>
  );
}

// Compact profile for the middle column (no chat — chat is its own column).
function CandidateDetailCompact({ applicant, t, lang, role, onChangeStatus, onOpenChat }) {
  const isAdmin = role !== "player" && role !== "visitor";
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
          <KvItem k={t("f_power")} v={window.FMT.power(parseInt(applicant.power) || 0)} accent />
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

        <div className="admin-detail-compact__votes">
          <span className="kv__k">Votes</span>
          <VotePills votes={applicant.votes} />
        </div>
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
// PRINCE DASHBOARD — combined overview + team management
// ============================================================
function SuperAdminScreen({ t, lang, applicants, team, isPrince, onCreateMember, onUpdateMember, onDeleteMember, onRegeneratePassword }) {
  const stats = _pm(() => {
    const groups = { rad: { pending: 0, review: 0, accepted: 0, rejected: 0, totalPower: 0 },
                     mtlh: { pending: 0, review: 0, accepted: 0, rejected: 0, totalPower: 0 } };
    applicants.forEach(a => {
      groups[a.guild][a.status]++;
      if (a.status === "accepted") groups[a.guild].totalPower += a.power;
    });
    return groups;
  }, [applicants]);

  return (
    <main className="container container--wide">
      <div className="eyebrow">{t("super_title")}</div>
      <h1 className="display" style={{ fontSize: 44, marginTop: 8 }}>
        Consolidated view
      </h1>
      <p className="subtle" style={{ marginTop: 8 }}>{t("super_sub")}</p>

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
                  +{window.FMT.power(stats[g].totalPower)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Team management — Prince only */}
      {isPrince && (
        <>
          <h2 className="display" style={{ fontSize: 32, marginTop: 64, marginBottom: 8 }}>
            Team management
          </h2>
          <p className="subtle" style={{ marginBottom: 24 }}>
            Create accounts for R5, R4, Recruiters and assign Prince rights. R5 and R4 only see their guild's applications.
          </p>
          <TeamManagement team={team} onCreate={onCreateMember} onUpdate={onUpdateMember} onDelete={onDeleteMember} onRegeneratePassword={onRegeneratePassword} t={t} />
        </>
      )}

      <h2 className="display" style={{ fontSize: 32, marginTop: 64, marginBottom: 24 }}>
        {t("roster_title")}
      </h2>
      <div className="subtle" style={{ marginBottom: 24, marginTop: -16 }}>{t("roster_sub")}</div>

      <RosterGrid applicants={applicants.filter(a => a.status === "accepted")} t={t} lang={lang} />
    </main>
  );
}

// ============================================================
// TEAM MANAGEMENT  (Prince only)
// ============================================================
function TeamManagement({ team, onCreate, onUpdate, onDelete, onRegeneratePassword, t }) {
  const [adding, setAdding] = _ps(false);
  const [newIgn, setNewIgn] = _ps("");
  const [newRole, setNewRole] = _ps("R4");
  const [newGuild, setNewGuild] = _ps("rad");
  const [editingId, setEditingId] = _ps(null);
  const [credsForId, setCredsForId] = _ps(null);   // currently-revealed credentials row
  const [justCreated, setJustCreated] = _ps(null); // banner after creation: full member with password

  function reset() { setAdding(false); setNewIgn(""); setNewRole("R4"); setNewGuild("rad"); }
  function submit() {
    if (!newIgn.trim()) return;
    const created = onCreate({ ign: newIgn, role: newRole, guild: newGuild });
    reset();
    if (created) {
      setJustCreated(created);
      setCredsForId(created.id);
    }
  }

  function copy(text) {
    if (navigator.clipboard) navigator.clipboard.writeText(text);
  }

  const sorted = [...team].sort((a, b) => {
    const order = { Prince: 0, Recruiter: 1, R5: 2, R4: 3 };
    if (order[a.role] !== order[b.role]) return order[a.role] - order[b.role];
    if ((a.guild || "") !== (b.guild || "")) return (a.guild || "").localeCompare(b.guild || "");
    return a.ign.localeCompare(b.ign);
  });

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div className="row row--between" style={{ padding: "16px 24px", borderBottom: "1px solid var(--line-soft)" }}>
        <div className="eyebrow eyebrow--mute">{team.length} members</div>
        {!adding && (
          <button className="btn btn--primary btn--sm" onClick={() => setAdding(true)}>+ Add member</button>
        )}
      </div>

      {/* One-time credentials banner after creation */}
      {justCreated && (
        <div className="creds-banner">
          <div>
            <div className="eyebrow" style={{ color: "var(--ok)" }}>✓ Account created — share these credentials</div>
            <div style={{ fontSize: 13, marginTop: 8, color: "var(--ink-dim)" }}>
              <strong style={{ color: "var(--ink)" }}>{justCreated.ign}</strong> can sign in with their in-game name and the password below. This is the only time it will be displayed.
            </div>
            <div className="creds-banner__pwd">
              <span className="mono">{justCreated.password}</span>
              <button className="btn btn--ghost btn--sm" onClick={() => copy(justCreated.password)}>Copy password</button>
              <button className="btn btn--ghost btn--sm" onClick={() => copy(`IGN: ${justCreated.ign}\nPassword: ${justCreated.password}`)}>Copy IGN + password</button>
            </div>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={() => setJustCreated(null)}>Dismiss</button>
        </div>
      )}

      {adding && (
        <div className="team-add">
          <Field label="In-game name" required>
            <input className="input" value={newIgn} onChange={e => setNewIgn(e.target.value)} placeholder="Aurelyn" autoFocus />
          </Field>
          <Field label="Role" required>
            <select className="select" value={newRole} onChange={e => setNewRole(e.target.value)}>
              <option value="R5">R5 — Guild Leader</option>
              <option value="R4">R4 — Officer</option>
              <option value="Recruiter">Recruiter</option>
              <option value="Prince">Prince</option>
            </select>
          </Field>
          <Field label="Guild" hint={(newRole === "Prince" || newRole === "Recruiter") ? "Cross-guild (no assignment)" : "—"}>
            <select className="select" value={newGuild} onChange={e => setNewGuild(e.target.value)}
              disabled={newRole === "Prince" || newRole === "Recruiter"}>
              <option value="rad">RAD · The Radiant</option>
              <option value="mtlh">MTLH · Metalheads</option>
            </select>
          </Field>
          <div className="team-add__actions">
            <button className="btn btn--ghost btn--sm" onClick={reset}>Cancel</button>
            <button className="btn btn--primary btn--sm" onClick={submit} disabled={!newIgn.trim()}>Create + generate password</button>
          </div>
        </div>
      )}

      <div className="team-list">
        <div className="team-list__head">
          <div>Member</div>
          <div>Role</div>
          <div>Guild</div>
          <div style={{ textAlign: "right" }}>Actions</div>
        </div>
        {sorted.map(m => (
          <TeamRow key={m.id} member={m}
            isEditing={editingId === m.id}
            credsRevealed={credsForId === m.id}
            onEdit={() => { setEditingId(m.id); setCredsForId(null); }}
            onCancel={() => setEditingId(null)}
            onSave={(patch) => { onUpdate(m.id, patch); setEditingId(null); }}
            onDelete={() => { if (confirm(`Remove ${m.ign} from the team?`)) onDelete(m.id); }}
            onToggleCreds={() => setCredsForId(credsForId === m.id ? null : m.id)}
            onRegenerate={() => {
              if (!confirm(`Generate a new password for ${m.ign}? The old one will stop working.`)) return;
              onRegeneratePassword(m.id);
            }}
            onCopy={copy}
          />
        ))}
      </div>
    </div>
  );
}

function TeamRow({ member, isEditing, credsRevealed, onEdit, onSave, onCancel, onDelete, onToggleCreds, onRegenerate, onCopy }) {
  const [role, setRole] = _ps(member.role);
  const [guild, setGuild] = _ps(member.guild || "rad");
  _pe(() => { setRole(member.role); setGuild(member.guild || "rad"); }, [member.id, isEditing]);

  if (isEditing) {
    return (
      <div className="team-row team-row--editing">
        <div className="row" style={{ gap: 12 }}>
          <Avatar name={member.ign} guild={member.color === "all" ? null : member.color} />
          <span style={{ fontWeight: 600 }}>{member.ign}</span>
        </div>
        <select className="select" value={role} onChange={e => setRole(e.target.value)}>
          <option value="R5">R5</option>
          <option value="R4">R4</option>
          <option value="Recruiter">Recruiter</option>
          <option value="Prince">Prince</option>
        </select>
        <select className="select" value={guild} onChange={e => setGuild(e.target.value)}
          disabled={role === "Prince" || role === "Recruiter"}>
          <option value="rad">RAD</option>
          <option value="mtlh">MTLH</option>
        </select>
        <div className="row row--end" style={{ gap: 8 }}>
          <button className="btn btn--ghost btn--sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn--primary btn--sm" onClick={() => onSave({ role, guild })}>Save</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="team-row">
        <div className="row" style={{ gap: 12, minWidth: 0 }}>
          <Avatar name={member.ign} guild={member.color === "all" ? null : member.color} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{member.ign}</div>
            <div className="mono faint" style={{ fontSize: 11 }}>{member.id}</div>
          </div>
        </div>
        <div>
          <span className={`badge ${member.role === "Prince" ? "badge--pending" : member.role === "Recruiter" ? "badge--review" : "badge--role"}`}>
            {member.role === "Prince" && "★ "}{member.role}
          </span>
        </div>
        <div>
          {member.guild
            ? <GuildBadge guild={member.guild} t={null} />
            : <span className="mono faint" style={{ fontSize: 11 }}>CROSS-GUILD</span>
          }
        </div>
        <div className="row row--end" style={{ gap: 6, flexWrap: "wrap" }}>
          <button className="btn btn--ghost btn--sm" onClick={onToggleCreds} title="Show credentials">
            {credsRevealed ? "Hide" : "Credentials"}
          </button>
          <button className="btn btn--ghost btn--sm" onClick={onEdit}>Edit</button>
          {!member.isPrince && (
            <button className="btn btn--danger btn--sm" onClick={onDelete}>Remove</button>
          )}
        </div>
      </div>
      {credsRevealed && (
        <div className="team-creds">
          <div className="team-creds__row">
            <span className="kv__k" style={{ width: 80 }}>IGN</span>
            <span className="mono" style={{ flex: 1 }}>{member.ign}</span>
            <button className="btn btn--ghost btn--sm" onClick={() => onCopy(member.ign)}>Copy</button>
          </div>
          <div className="team-creds__row">
            <span className="kv__k" style={{ width: 80 }}>Password</span>
            <span className="mono" style={{ flex: 1 }}>{member.password || "—"}</span>
            <button className="btn btn--ghost btn--sm" onClick={() => onCopy(member.password || "")}>Copy</button>
            <button className="btn btn--danger btn--sm" onClick={onRegenerate}>Regenerate</button>
          </div>
        </div>
      )}
    </>
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
                {window.FMT.power(a.power)}
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

Object.assign(window, { PlayerDashboard, AdminDashboard, SuperAdminScreen, RosterGrid });
