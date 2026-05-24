// Guild settings — editable by R5 of each guild. Saving propagates to landing.

const _gs = React.useState;

function calcAvg(total, members) {
  if (!total || !members) return "—";
  const avg = total / members;
  if (avg >= 1000000000) return (avg / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  if (avg >= 1000000) return (avg / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (avg >= 1000) return (avg / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return Math.floor(avg).toString();
}

function GuildSettingsScreen({ t, lang, guild, settings, onSave }) {
  const [form, setForm] = _gs(settings);
  const [saved, setSaved] = _gs(false);

  // Sync form when settings change externally (i.e. on guild switch or remote update)
  React.useEffect(() => { setForm(settings); }, [guild, settings]);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setSaved(false); }
  function setReq(i, v) {
    setForm(f => {
      const arr = [...(f.reqEn || ["", "", ""])];
      arr[i] = v;
      return { ...f, reqEn: arr, req: arr };
    });
    setSaved(false);
  }

  const c = guild;
  const guildName = guild === "rad" ? "RAD · The Radiant" : "MTLH · Metalheads";

  // True if any field in form differs from the saved settings
  const isDirty = React.useMemo(() => {
    if (!form || !settings) return false;
    return JSON.stringify(form) !== JSON.stringify(settings);
  }, [form, settings]);

  function manualSave() {
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  }

  function discardChanges() {
    setForm(settings);
    setSaved(false);
  }

  return (
    <main className="container">
      <div className="row row--between" style={{ marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div className="eyebrow">Guild settings</div>
          <h1 className="display" style={{ fontSize: 42, marginTop: 8 }}>
            <span style={{ color: `var(--${c})` }}>{guildName}</span>
          </h1>
          <div className="subtle" style={{ marginTop: 4 }}>
            Changes are applied to the landing page after you click <strong style={{ color: "var(--ink)" }}>Save</strong>.
          </div>
        </div>
        <div className="row row--gap2" style={{ alignItems: "center" }}>
          {saved && (
            <span className="mono" style={{ color: "var(--ok)", fontSize: 12, letterSpacing: "0.14em" }}>
              ✓ SAVED
            </span>
          )}
          {isDirty && !saved && (
            <span className="mono" style={{ color: "var(--warn)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}>
              ● Unsaved
            </span>
          )}
          {isDirty && (
            <button className="btn btn--ghost btn--sm" onClick={discardChanges}>Discard</button>
          )}
          <button className="btn btn--primary" onClick={manualSave} disabled={!isDirty}>Save</button>
        </div>
      </div>

      <div className="card">
        <div className="card__head">
          <div className="card__title">Statistics</div>
          <span className="mono faint" style={{ fontSize: 11 }}>SHOWN ON LANDING</span>
        </div>
        <div className="grid-resp-3" style={{ gap: 20 }}>
          <Field label={t("stat_members")} required>
            <input className="input mono" type="number" min="0" value={form?.members ?? ""}
              onChange={e => {
                const m = parseInt(e.target.value) || 0;
                setForm(f => {
                  const nf = { ...f, members: m };
                  nf.avg_power = calcAvg(nf.total_power, nf.members);
                  return nf;
                });
                setSaved(false);
              }} />
          </Field>
          <Field label="Total Power" required hint="e.g. 1500000000">
            <input className="input mono" type="number" min="0" value={form?.total_power ?? ""}
              onChange={e => {
                const tp = parseInt(e.target.value) || 0;
                setForm(f => {
                  const nf = { ...f, total_power: tp };
                  nf.avg_power = calcAvg(nf.total_power, nf.members);
                  return nf;
                });
                setSaved(false);
              }} />
          </Field>
          <Field label={t("stat_open_slots")} required>
            <input className="input mono" type="number" min="0" value={form?.slots ?? ""}
              onChange={e => set("slots", parseInt(e.target.value) || 0)} />
          </Field>
          <Field label={t("stat_avg_power")} hint="Calculated automatically">
            <input className="input mono" value={form?.avg_power || form?.avgPower || ""} disabled style={{ background: "var(--bg-1)", cursor: "not-allowed", color: "var(--ink-dim)" }} />
          </Field>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card__head">
          <div className="card__title">{t("requirements")}</div>
          <span className="mono faint" style={{ fontSize: 11 }}>3 MAX</span>
        </div>
        <div className="col col--gap4">
          {[0, 1, 2].map(i => (
            <input key={i} className="input" placeholder={`Requirement ${i + 1}`}
              value={form?.reqEn?.[i] || ""}
              onChange={e => setReq(i, e.target.value)} />
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card__head">
          <div className="card__title">Pitch</div>
        </div>
        <Field label="Presentation" hint="2-3 sentences shown on the landing page">
          <textarea className="textarea" rows={5}
            value={form?.pitchEn || ""}
            onChange={e => {
              const v = e.target.value;
              setForm(f => ({ ...f, pitchEn: v, pitch: v }));
              setSaved(false);
            }} />
        </Field>
      </div>

      <div className="card" style={{ marginTop: 24, background: "var(--bg-1)" }}>
        <div className="row row--between" style={{ marginBottom: 16 }}>
          <div className="eyebrow eyebrow--mute">Preview — what visitors will see</div>
          {isDirty && (
            <span className="mono faint" style={{ fontSize: 10, letterSpacing: "0.14em" }}>
              (PREVIEW · NOT YET LIVE)
            </span>
          )}
        </div>
        <div style={{ color: `var(--${c})` }}>
          <div className="display" style={{ fontSize: 24, color: "var(--ink)" }}>{guildName}</div>
          <div className="row" style={{ gap: 32, marginTop: 16, flexWrap: "wrap" }}>
            <div><div className="kv__k">{t("stat_members")}</div><div className="display" style={{ fontSize: 22, color: `var(--${c})` }}>{form?.members ?? "—"}</div></div>
            <div><div className="kv__k">Total Power</div><div className="display" style={{ fontSize: 22, color: `var(--${c})` }}>{calcAvg(form?.total_power, 1)}</div></div>
            <div><div className="kv__k">{t("stat_avg_power")}</div><div className="display" style={{ fontSize: 22, color: `var(--${c})` }}>{form?.avgPower || form?.avg_power || "—"}</div></div>
            <div><div className="kv__k">{t("stat_open_slots")}</div><div className="display" style={{ fontSize: 22, color: `var(--${c})` }}>{form?.slots ?? "—"}</div></div>
          </div>
          <ul style={{ marginTop: 16, paddingLeft: 0, listStyle: "none", color: "var(--ink-dim)", fontSize: 14 }}>
            {(form?.reqEn || []).map((r, i) =>
              r ? <li key={i} style={{ padding: "4px 0" }}><span style={{ color: `var(--${c})`, fontFamily: "var(--f-mono)", fontSize: 11, marginRight: 8 }}>0{i + 1}</span>{r}</li> : null
            )}
          </ul>
          <p className="subtle" style={{ marginTop: 12, fontStyle: "italic" }}>{form?.pitchEn}</p>
        </div>
      </div>
    </main>
  );
}

Object.assign(window, { GuildSettingsScreen });
