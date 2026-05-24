// Chat component — used in both player dashboard and admin detail view.
// Participants = R5/R4 of the applicant's guild + the applicant.

const { useState: cuState, useEffect: cuEffect, useRef: cuRef, useMemo: cuMemo } = React;

function ChatPanel({ applicant, currentUserId, t, lang, onVote, onSend }) {
  const data = window.MOCK_DATA;
  const members = data.membersOf(applicant.guild);
  const participants = [
    ...members,
    { id: applicant.id, ign: applicant.ign, role: "Applicant", color: applicant.guild },
  ];
  const memberMap = useMemo(() => {
    const m = {};
    members.forEach(x => m[x.id] = x);
    m[applicant.id] = { id: applicant.id, ign: applicant.ign, role: "Applicant", color: applicant.guild };
    return m;
  }, [applicant.id]);

  const messages = applicant.chat || [];
  const [draft, setDraft] = cuState("");
  const [typing, setTyping] = cuState(false);   // someone else typing (simulated)
  const scrollerRef = cuRef(null);

  cuEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [messages.length, typing]);

  // Simulate a typing indicator that comes and goes
  cuEffect(() => {
    let cancel = false;
    const cycle = () => {
      if (cancel) return;
      const isAdmin = currentUserId.startsWith("u_");
      // pretend the *other* side is typing once every ~12s
      setTimeout(() => {
        if (cancel) return;
        setTyping(true);
        setTimeout(() => { if (!cancel) setTyping(false); }, 2400);
        cycle();
      }, 8000 + Math.random() * 6000);
    };
    cycle();
    return () => { cancel = true; };
  }, [applicant.id, currentUserId]);

  function send() {
    if (!draft.trim()) return;
    onSend(applicant.id, { id: "m" + Date.now(), authorId: currentUserId, text: draft.trim(), ts: new Date().toISOString() });
    setDraft("");
  }

  // Group messages by day
  const grouped = useMemo(() => {
    const groups = [];
    let lastDay = "";
    messages.forEach(m => {
      const day = m.ts ? m.ts.slice(0, 10) : "";
      if (day !== lastDay) {
        groups.push({ day, items: [] });
        lastDay = day;
      }
      groups[groups.length - 1].items.push(m);
    });
    return groups;
  }, [messages]);

  return (
    <div className="chat">
      <div className="chat__head">
        <div className="row row--between">
          <div>
            <div className="chat__title">{t("internal_chat")}</div>
            <div className="chat__sub">
              {t("chat_with")} — {participants.map(p => p.ign).join(" · ")}
            </div>
          </div>
          <div className="chat__participants" title={participants.map(p => p.ign).join(", ")}>
            {participants.slice(0, 5).map(p => (
              <Avatar key={p.id} name={p.ign} guild={p.color} />
            ))}
          </div>
        </div>
      </div>

      <div className="chat__messages" ref={scrollerRef}>
        {grouped.length === 0 && (
          <div className="empty" style={{ padding: 32 }}>
            {lang === "fr" ? "Aucun message pour l'instant" : "No messages yet"}
          </div>
        )}
        {grouped.map((g, gi) => (
          <React.Fragment key={gi}>
            <div className="chat__day">{window.FMT.dayLabel(g.day, lang)}</div>
            {g.items.map(m => (
              <ChatMessage
                key={m.id}
                msg={m}
                memberMap={memberMap}
                isSelf={m.authorId === currentUserId}
                t={t} lang={lang}
                onVote={(v) => onVote(applicant.id, m.id, v, currentUserId)}
                currentUserId={currentUserId}
              />
            ))}
          </React.Fragment>
        ))}
        {typing && (
          <div className="typing">
            <Avatar name={applicant.id === currentUserId ? participants[0].ign : applicant.ign} size="sm" />
            <span className="typing__dots"><span></span><span></span><span></span></span>
            <span>{applicant.id === currentUserId ? participants[0].ign : applicant.ign} {t("typing")}…</span>
          </div>
        )}
      </div>

      <div className="chat__composer">
        <textarea
          rows={1}
          placeholder={t("type_message")}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
          }}
        />
        <button className="btn btn--primary btn--sm" onClick={send} disabled={!draft.trim()}>
          {t("send")}
        </button>
      </div>
    </div>
  );
}

function ChatMessage({ msg, memberMap, isSelf, t, lang, onVote, currentUserId }) {
  if (msg.type === "system") {
    return (
      <div className="msg is-system" style={{ justifyContent: "center" }}>
        <div className="msg__bubble" style={{ borderRadius: 999, padding: "6px 16px" }}>
          {msg.text} · {window.FMT.time(msg.ts, lang)}
        </div>
      </div>
    );
  }
  if (msg.type === "vote") {
    const v = msg.votes || { yes: [], no: [], abstain: [] };
    const myVote = ["yes", "no", "abstain"].find(k => v[k]?.includes(currentUserId));
    const isAdmin = currentUserId.startsWith("u_");
    return (
      <div className="msg is-vote">
        <div className="msg__bubble" style={{ maxWidth: 520 }}>
          <div className="row row--between" style={{ marginBottom: 8 }}>
            <div>
              <div className="eyebrow">{lang === "fr" ? "Vote ouvert" : "Vote open"}</div>
              <div style={{ fontFamily: "var(--f-display)", fontSize: 18, marginTop: 4 }}>{msg.question}</div>
            </div>
            <span className="mono" style={{ fontSize: 11, color: "var(--ink-mute)" }}>{window.FMT.time(msg.ts, lang)}</span>
          </div>
          <div className="row" style={{ gap: 16, fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--ink-dim)" }}>
            <span>↑ {(v.yes || []).length} {t("vote_yes")}</span>
            <span>↓ {(v.no || []).length} {t("vote_no")}</span>
            <span>~ {(v.abstain || []).length} {t("vote_abstain")}</span>
          </div>
          {isAdmin && (
            <div className="msg__vote-bar">
              <button className={"up " + (myVote === "yes" ? "active" : "")} onClick={() => onVote("yes")}>↑ {t("vote_yes")}</button>
              <button className={"dn " + (myVote === "no" ? "active" : "")} onClick={() => onVote("no")}>↓ {t("vote_no")}</button>
              <button className={"ab " + (myVote === "abstain" ? "active" : "")} onClick={() => onVote("abstain")}>~ {t("vote_abstain")}</button>
            </div>
          )}
          {myVote && (
            <div className="mono" style={{ marginTop: 8, fontSize: 11, color: "var(--gold)" }}>
              {t("you_voted")} · {t("vote_" + myVote)}
            </div>
          )}
        </div>
      </div>
    );
  }
  const author = memberMap[msg.authorId]
    || (window.MOCK_DATA.memberById && window.MOCK_DATA.memberById(msg.authorId))
    || { ign: "Unknown", role: "" };
  const isApplicant = msg.authorId && !msg.authorId.startsWith("u_");
  return (
    <div className={`msg ${isSelf ? "is-self" : ""}`}>
      <Avatar name={author.ign} guild={isApplicant ? author.color : author.color} />
      <div>
        <div className="msg__head" style={isSelf ? { justifyContent: "flex-end" } : {}}>
          <span className="msg__name">{author.ign}</span>
          {!isApplicant && <span className="msg__role" style={{ color: "var(--gold)" }}>· {author.role}</span>}
          {isApplicant && <span className="msg__role" style={{ color: "var(--ink-mute)" }}>· {lang === "fr" ? "Candidat" : "Applicant"}</span>}
          <span className="msg__time">{window.FMT.time(msg.ts, lang)}</span>
        </div>
        <div className="msg__bubble">{msg.text}</div>
      </div>
    </div>
  );
}

Object.assign(window, { ChatPanel });
