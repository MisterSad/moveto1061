// Shared UI primitives + small composite components.
// Exposes globals at bottom for cross-script use.

const { useState, useEffect, useRef, useMemo, useLayoutEffect } = React;

// ===== T (i18n helper) =====
function useT(lang) {
  return (k) => (window.I18N[lang] && window.I18N[lang][k]) || k;
}

// ===== Brand glyph =====
function Glyph({ size = 28 }) {
  return (
    <span className="glyph" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      R/M
    </span>
  );
}

// ===== Guild sigil — abstract emblems, NOT logos =====
function GuildSigil({ guild, size = 96, logoUrl = null }) {
  // If a logoUrl is passed dynamically (legacy), we can still use it, 
  // but by default we use the hardcoded images.
  if (guild === "rad") {
    return (
      <img src="rad-logo.png" alt="RAD logo" style={{ width: size, height: size, objectFit: 'cover', display: 'block', borderRadius: '50%' }} />
    );
  }
  if (guild === "mtlh") {
    return (
      <img src="mtlh-logo.png" alt="MTLH logo" style={{ width: size, height: size, objectFit: 'cover', display: 'block', borderRadius: '50%' }} />
    );
  }
  
  return null;
}

// ===== Badge components =====
function GuildBadge({ guild, t }) {
  return (
    <span className={`badge badge--${guild}`}>
      <span className="dot"></span>
      {guild === "rad" ? "RAD · The Radiant" : "MTLH · Metalheads"}
    </span>
  );
}
function StatusBadge({ status, t }) {
  const map = {
    pending: { cls: "pending", label: t("status_pending") },
    review: { cls: "review", label: t("status_review") },
    accepted: { cls: "accepted", label: t("status_accepted") },
    rejected: { cls: "rejected", label: t("status_rejected") },
  };
  const m = map[status] || map.pending;
  return <span className={`badge badge--${m.cls}`}><span className="dot"></span>{m.label}</span>;
}
function RoleBadge({ role }) {
  return <span className="badge badge--role">{role}</span>;
}

// ===== Avatar =====
function Avatar({ name, size = "md", guild }) {
  const initials = (name || "??").split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();
  const cls = `avatar ${size === "lg" ? "avatar--lg" : size === "xl" ? "avatar--xl" : ""} ${guild ? "avatar--" + guild : ""}`;
  return <span className={cls.trim()}>{initials}</span>;
}

// ===== Vote pills =====
function VotePills({ votes }) {
  const yes = votes?.yes?.length || 0;
  const no = votes?.no?.length || 0;
  const ab = votes?.abstain?.length || 0;
  return (
    <span className="votes">
      <span className={`vote-pill ${yes > 0 ? "up" : ""}`}>↑ {yes}</span>
      <span className={`vote-pill ${no > 0 ? "dn" : ""}`}>↓ {no}</span>
      <span className="vote-pill">~ {ab}</span>
    </span>
  );
}

// ===== Lang toggle =====
function LangToggle({ lang, setLang }) {
  return (
    <div className="row row--gap2" style={{ fontFamily: "var(--f-mono)", fontSize: 11 }}>
      <button
        className={lang === "fr" ? "" : "subtle"}
        style={{ color: lang === "fr" ? "var(--gold)" : "var(--ink-mute)" }}
        onClick={() => setLang("fr")}>FR</button>
      <span style={{ color: "var(--ink-mute)" }}>·</span>
      <button
        className={lang === "en" ? "" : "subtle"}
        style={{ color: lang === "en" ? "var(--gold)" : "var(--ink-mute)" }}
        onClick={() => setLang("en")}>EN</button>
    </div>
  );
}

// ===== TopBar =====
function TopBar({ route, setRoute, role, isAdmin, isPrince, lang, setLang, t, onLogout, selfName }) {
  const [open, setOpen] = useState(false);

  // Available routes based on role
  const navs = [];
  if (role === "visitor") {
    navs.push({ k: "landing", label: t("nav_landing") });
  } else if (role === "player") {
    navs.push({ k: "landing", label: t("nav_landing") });
    navs.push({ k: "player", label: t("nav_player") });
  } else if (role === "rad_r5" || role === "rad_r4") {
    navs.push({ k: "landing", label: t("nav_landing") });
    navs.push({ k: "admin/rad", label: "Recrutement RAD" });
    if (role === "rad_r5") navs.push({ k: "guild_settings", label: t("nav_guild_settings") });
  } else if (role === "mtlh_r5" || role === "mtlh_r4") {
    navs.push({ k: "landing", label: t("nav_landing") });
    navs.push({ k: "admin/mtlh", label: "Recrutement MTLH" });
    if (role === "mtlh_r5") navs.push({ k: "guild_settings", label: t("nav_guild_settings") });
  }

  // Add Prince View if applicable
  if (isPrince || isAdmin) {
    // Avoid duplicate if not already added by role
    if (!navs.find(n => n.k === "prince")) {
       navs.push({ k: "prince", label: "Prince View" });
    }
  }

  // Add System Admin if applicable
  if (isAdmin) {
    if (!navs.find(n => n.k === "system")) {
       navs.push({ k: "system", label: "System Admin" });
    }
  }

  function go(k) { setRoute(k); setOpen(false); }

  return (
    <>
      <header className="topbar">
        <div className="topbar__brand">
          <Glyph />
          <span><span style={{ color: "var(--gold)" }}>#1061</span> <span style={{ color: "var(--ink-mute)", fontSize: "0.7em", letterSpacing: "0.2em" }}>APPLICATION</span></span>
        </div>
        <nav className="topbar__nav">
          {navs.map(n => (
            <button key={n.k} className={route === n.k ? "is-active" : ""} onClick={() => setRoute(n.k)}>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="topbar__spacer"></div>
        {role !== "visitor" && (
          <button className="topbar__user" onClick={() => {
            if (role === "player") setRoute("player");
            else if (role === "super") setRoute("super");
            else setRoute("admin");
          }}>
            <Avatar name={selfName} />
            <span style={{ fontSize: 13 }}>{selfName}</span>
          </button>
        )}
        {role === "visitor"
          ? <button className="btn btn--ghost btn--sm" onClick={() => setRoute("login")}>{t("nav_login")}</button>
          : <button className="btn btn--ghost btn--sm" onClick={onLogout}>{t("nav_logout")}</button>
        }
        <button className="topbar__burger" aria-label="Menu" onClick={() => setOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </button>
      </header>

      <div className={`drawer-backdrop ${open ? "is-open" : ""}`} onClick={() => setOpen(false)}></div>
      <aside className={`drawer ${open ? "is-open" : ""}`}>
        <div className="drawer__head">
          <div className="topbar__brand"><Glyph /><span style={{ color: "var(--gold)" }}>#1061</span></div>
          <button className="topbar__burger" aria-label="Close" onClick={() => setOpen(false)} style={{ display: "inline-flex" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>
        <nav className="drawer__nav">
          {navs.map(n => (
            <button key={n.k} className={route === n.k ? "is-active" : ""} onClick={() => go(n.k)}>{n.label}</button>
          ))}
        </nav>
        <div className="drawer__foot">
          {role !== "visitor" && (
            <div className="row" style={{ gap: 10 }}>
              <Avatar name={selfName} />
              <div style={{ fontSize: 13 }}>{selfName}</div>
            </div>
          )}
          {role === "visitor"
            ? <button className="btn btn--primary" onClick={() => go("login")}>{t("nav_login")}</button>
            : <button className="btn btn--ghost" onClick={() => { onLogout(); setOpen(false); }}>{t("nav_logout")}</button>
          }
        </div>
      </aside>
    </>
  );
}

// ===== Stepper =====
function Stepper({ steps, current }) {
  return (
    <div className="stepper">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div className={`stepper__step ${i < current ? "done" : i === current ? "current" : ""}`}>
            <span className="stepper__num">{i < current ? "✓" : String(i + 1).padStart(2, "0")}</span>
            <span>{s}</span>
          </div>
          {i < steps.length - 1 && <span className={`stepper__line ${i < current ? "done" : ""}`}></span>}
        </React.Fragment>
      ))}
    </div>
  );
}

// ===== Field =====
function Field({ label, required, hint, error, children }) {
  return (
    <div className="field">
      <label>{label} {required && <span className="req">*</span>}</label>
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

// ===== Status pill (large) =====
function StatusLarge({ status, t }) {
  const map = {
    pending: { cls: "pending", title: t("status_pending"), desc: t("status_pending_desc") },
    review: { cls: "review", title: t("status_review"), desc: t("status_review_desc") },
    accepted: { cls: "accepted", title: t("status_accepted"), desc: t("status_accepted_desc") },
    rejected: { cls: "rejected", title: t("status_rejected"), desc: t("status_rejected_desc") },
  };
  const m = map[status];
  return (
    <div className={`status-large ${m.cls}`}>
      <span className="status-large__dot"></span>
      <div>
        <div style={{ fontFamily: "var(--f-display)", fontSize: 22 }}>{m.title}</div>
        <div className="subtle" style={{ fontSize: 13, marginTop: 2 }}>{m.desc}</div>
      </div>
    </div>
  );
}

// Export to global scope so other Babel scripts can use them.
Object.assign(window, {
  useT, Glyph, GuildSigil, GuildBadge, StatusBadge, RoleBadge,
  Avatar, VotePills, LangToggle, TopBar, Stepper, Field, StatusLarge,
});
