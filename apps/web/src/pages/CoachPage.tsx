import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ApiError, api, errorMessage, type CoachMessage } from "../api";
import { useAuth } from "../auth";
import { ChatIcon, SendIcon } from "../components/Icons";

const SUGGESTIONS = ["Wie schlafe ich besser?", "Ich hatte heute einen Rückfall", "Plan für diese Woche"];

/** Renders **bold** spans and keeps line breaks; everything else stays plain text. */
function renderText(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
  );
}

export function CoachPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CoachMessage[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await api.coachConversation();
      setMessages(res.messages);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending, streamText]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || sending) return;
    setError(null);
    setDraft("");
    setSending(true);
    const optimistic: CoachMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...(prev ?? []), optimistic]);
    try {
      const res = await api.sendCoachMessage(message, setStreamText);
      setMessages((prev) => [...(prev ?? []), res.message]);
    } catch (err) {
      setError(errorMessage(err));
      // 400/503 are rejected before the server stores the message, so give the text back to retry.
      if (err instanceof ApiError && (err.status === 400 || err.status === 503)) setDraft(message);
      await load();
    } finally {
      setSending(false);
      setStreamText("");
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(draft);
  }

  const empty = messages !== null && messages.length === 0;

  return (
    <div className="chat-page">
      <header className="chat-header">
        <div className="chat-avatar"><ChatIcon size={17} /></div>
        <div>
          <h1 className="chat-title">Dein Coach</h1>
          <div className="chat-sub">kennt deine Streaks &amp; Journal-Einträge</div>
        </div>
      </header>

      <div className="chat-scroll" aria-live="polite">
        {messages === null && !error && <div className="muted center">Lädt…</div>}
        {empty && (
          <>
            <div className="bubble-row">
              <div className="bubble">
                Hey {user?.name}! Ich bin dein Coach. Ich kenne deine Bereiche, Streaks und Journal-Einträge und
                helfe dir, dranzubleiben. Womit fangen wir an?
              </div>
            </div>
            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" className="suggestion" onClick={() => send(s)} disabled={sending}>
                  {s}
                </button>
              ))}
            </div>
          </>
        )}
        {messages?.map((m) => (
          <div key={m.id} className={m.role === "user" ? "bubble-row user" : "bubble-row"}>
            <div className={m.role === "user" ? "bubble user" : "bubble"}>{renderText(m.content)}</div>
          </div>
        ))}
        {sending && (
          <div className="bubble-row">
            {streamText ? (
              <div className="bubble">{renderText(streamText)}</div>
            ) : (
              <div className="bubble typing" aria-label="Coach schreibt">
                <span /><span /><span />
              </div>
            )}
          </div>
        )}
        {error && <div className="error" role="alert">{error}</div>}
        <div ref={endRef} />
      </div>

      <form className="chat-input" onSubmit={onSubmit}>
        <label htmlFor="coach-input" className="visually-hidden">Nachricht an deinen Coach</label>
        <input
          id="coach-input"
          className="input pill-input"
          placeholder="Schreib deinem Coach…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={4000}
          autoComplete="off"
        />
        <button type="submit" className="send-button" aria-label="Senden" disabled={sending || !draft.trim()}>
          <SendIcon />
        </button>
      </form>
    </div>
  );
}
