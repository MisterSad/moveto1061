// Chat component — used in both player dashboard and admin detail view.

const { useState: cuState, useEffect: cuEffect, useRef: cuRef, useMemo: cuMemo } = React;

function ChatPanel({ applicant, currentUserId, t, lang }) {
  const [messages, setMessages] = cuState([]);
  const [draft, setDraft] = cuState("");
  const scrollerRef = cuRef(null);

  function fetchChat() {
    window.supabaseClient.from('messages')
      .select('*, profiles(ign, role, guild), votes(user_id, choice)')
      .eq('application_id', applicant.id).order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setMessages(data); });
  }

  cuEffect(() => {
    fetchChat();
    const ch = window.supabaseClient.channel('chat-' + applicant.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `application_id=eq.${applicant.id}` }, () => fetchChat())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => fetchChat())
      .subscribe();
    return () => { window.supabaseClient.removeChannel(ch); };
  }, [applicant.id]);

  cuEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [messages.length]);

  function send() {
    if (!draft.trim()) return;
    window.supabaseClient.from('messages').insert({
      application_id: applicant.id,
      author_id: currentUserId,
      type: 'chat',
      text: draft.trim()
    }).then(() => { setDraft(""); });
  }

  function startVote() {
    window.supabaseClient.from('messages').insert({
      application_id: applicant.id,
      author_id: currentUserId,
      type: 'vote',
      question: 'Accept ' + applicant.ign + '?'
    });
  }

  function onVote(messageId, choice) {
    window.supabaseClient.from('votes').upsert({
      message_id: messageId,
      user_id: currentUserId,
      choice
    }).then(() => fetchChat());
  }

  // Group messages by day
  const grouped = cuMemo(() => {
    const groups = [];
    let lastDay = "";
    messages.forEach(m => {
      const day = m.created_at ? m.created_at.slice(0, 10) : "";
      if (day !== lastDay) {
        groups.push({ day, items: [] });
        lastDay = day;
      }
      groups[groups.length - 1].items.push(m);
    });
    return groups;
  }, [messages]);

  // Is current user an admin? 
  // We can guess based on if they have a role other than player_new/player
  // But wait, the current user role isn't passed here directly. We know they are admin if they are not the applicant
  // Actually, we can check if they are the applicant.
  const isApplicant = currentUserId === applicant.user_id;

  return (
    <div className="chat">
      <div className="chat__head">
        <div className="row row--between">
          <div>
            <div className="chat__title">{t("internal_chat")}</div>
            <div className="chat__sub">
              {t("chat_with")} — {applicant.ign} {isApplicant ? "" : "& Officers"}
            </div>
          </div>
          {!isApplicant && (
             <button className="btn btn--ghost btn--sm" onClick={startVote}>Open Vote</button>
          )}
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
            <div className="chat__day">{window.FMT?.dayLabel ? window.FMT.dayLabel(g.day, lang) : g.day}</div>
            {g.items.map(m => (
              <ChatMessage
                key={m.id}
                msg={m}
                isSelf={m.author_id === currentUserId}
                isAdmin={!isApplicant}
                t={t} lang={lang}
                onVote={(v) => onVote(m.id, v)}
                currentUserId={currentUserId}
              />
            ))}
          </React.Fragment>
        ))}
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

function ChatMessage({ msg, isSelf, isAdmin, t, lang, onVote, currentUserId }) {
  if (msg.type === "system") {
    return (
      <div className="msg is-system" style={{ justifyContent: "center" }}>
        <div className="msg__bubble" style={{ borderRadius: 999, padding: "6px 16px" }}>
          {msg.text} · {window.FMT?.time ? window.FMT.time(msg.created_at, lang) : msg.created_at}
        </div>
      </div>
    );
  }
  if (msg.type === "vote") {
    const rawVotes = msg.votes || [];
    const v = {
      yes: rawVotes.filter(x => x.choice === 'yes').map(x => x.user_id),
      no: rawVotes.filter(x => x.choice === 'no').map(x => x.user_id),
      abstain: rawVotes.filter(x => x.choice === 'abstain').map(x => x.user_id)
    };
    const myVote = ["yes", "no", "abstain"].find(k => v[k]?.includes(currentUserId));
    
    return (
      <div className="msg is-vote">
        <div className="msg__bubble" style={{ maxWidth: 520 }}>
          <div className="row row--between" style={{ marginBottom: 8 }}>
            <div>
              <div className="eyebrow">{lang === "fr" ? "Vote ouvert" : "Vote open"}</div>
              <div style={{ fontFamily: "var(--f-display)", fontSize: 18, marginTop: 4 }}>{msg.question}</div>
            </div>
            <span className="mono" style={{ fontSize: 11, color: "var(--ink-mute)" }}>{window.FMT?.time ? window.FMT.time(msg.created_at, lang) : msg.created_at}</span>
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
  
  const author = msg.profiles || { ign: "Unknown", role: "", guild: null };
  const isApplicantMsg = author.role === "player" || author.role === "player_new";

  return (
    <div className={`msg ${isSelf ? "is-self" : ""}`}>
      <Avatar name={author.ign} guild={author.guild} />
      <div>
        <div className="msg__head" style={isSelf ? { justifyContent: "flex-end" } : {}}>
          <span className="msg__name">{author.ign}</span>
          {!isApplicantMsg && <span className="msg__role" style={{ color: "var(--gold)" }}>· {author.role}</span>}
          {isApplicantMsg && <span className="msg__role" style={{ color: "var(--ink-mute)" }}>· {lang === "fr" ? "Candidat" : "Applicant"}</span>}
          <span className="msg__time">{window.FMT?.time ? window.FMT.time(msg.created_at, lang) : msg.created_at}</span>
        </div>
        <div className="msg__bubble">{msg.text}</div>
      </div>
    </div>
  );
}

Object.assign(window, { ChatPanel });
