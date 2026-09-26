import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage, type Tracker } from "../api";
import { ChevronRightIcon, LockIcon, ShieldIcon } from "../components/Icons";
import { blockerSummary, formatShortDate } from "../util";

type Feedback = { kind: "good" | "reset"; text: string };

export function UrgesPage() {
  const [trackers, setTrackers] = useState<Tracker[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});
  const [confirmingRelapse, setConfirmingRelapse] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.urges();
      setTrackers(res.trackers);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function resist(id: string) {
    setBusy(id);
    try {
      await api.resist(id);
      setFeedback((f) => ({ ...f, [id]: { kind: "good", text: "Stark! Notiert – weiter so." } }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function relapse(id: string) {
    setBusy(id);
    try {
      await api.relapse(id);
      setConfirmingRelapse(null);
      setFeedback((f) => ({ ...f, [id]: { kind: "reset", text: "Rückfall notiert – morgen ist ein neuer Tag." } }));
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function addTracker(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await api.createTracker(newName.trim());
      setNewName("");
      setAdding(false);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const activeBlockers = trackers?.filter((t) => blockerSummary(t.blocker) !== null).length ?? 0;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Sucht-Tracker</h1>
          <p className="page-sub">Jeder Tag zählt.</p>
        </div>
      </header>

      {error && <div className="error" role="alert">{error}</div>}

      {trackers && trackers.length > 0 && (
        <div className={activeBlockers > 0 ? "blocker-summary active" : "blocker-summary"}>
          <div className={activeBlockers > 0 ? "icon-badge solid" : "icon-badge"}>
            <LockIcon size={19} />
          </div>
          <div className="grow">
            <div className="segment-name">
              App-Blocker
              {activeBlockers > 0 && <span className="pill">AKTIV</span>}
            </div>
            <div className="segment-sub">
              {activeBlockers > 0
                ? `Aktiv für ${activeBlockers} von ${trackers.length} Trackern`
                : "Sperr Apps & Seiten, die dich triggern – pro Tracker einstellbar"}
            </div>
          </div>
        </div>
      )}

      <div className="stack roomy">
        {trackers === null && !error && <div className="muted">Lädt…</div>}
        {trackers?.length === 0 && !adding && (
          <div className="empty">
            Noch kein Tracker. Leg einen an für ein Verhalten, das du in den Griff bekommen willst – z.B. Pornos,
            Social Media oder Rauchen.
          </div>
        )}

        {trackers?.map((t) => {
          const summary = blockerSummary(t.blocker);
          const fb = feedback[t.id];
          return (
            <section key={t.id} className="tracker-card" aria-label={t.name}>
              <div className="tracker-head">
                <div>
                  <div className="tracker-name">{t.name}</div>
                  <div className="tracker-since">sauber seit {formatShortDate(t.streakStartAt)}</div>
                </div>
                <div className="icon-badge"><ShieldIcon size={19} /></div>
              </div>

              <div className="tracker-streak">
                <span className="streak-number">{t.streakDays}</span>
                <span className="streak-unit">{t.streakDays === 1 ? "Tag" : "Tage"}</span>
              </div>

              <Link to={`/urges/${t.id}/blocker`} className="blocker-row">
                <LockIcon size={14} />
                <span className="grow">{summary ? `Gesperrt: ${summary}` : "Kein Blocker – jetzt einrichten"}</span>
                <ChevronRightIcon size={15} />
              </Link>

              {fb && (
                <div className={fb.kind === "good" ? "feedback good" : "feedback reset"} role="status">
                  {fb.text}
                </div>
              )}

              {confirmingRelapse === t.id ? (
                <div className="confirm-box">
                  <div className="confirm-text">Streak auf 0 setzen? Das ist okay – ehrlich sein zählt.</div>
                  <div className="button-row">
                    <button type="button" className="btn btn-outline" onClick={() => setConfirmingRelapse(null)}>
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={busy === t.id}
                      onClick={() => relapse(t.id)}
                    >
                      Ja, Rückfall
                    </button>
                  </div>
                </div>
              ) : (
                <div className="button-row">
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={busy === t.id}
                    onClick={() => resist(t.id)}
                  >
                    Drang widerstanden
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => setConfirmingRelapse(t.id)}>
                    Rückfall
                  </button>
                </div>
              )}
            </section>
          );
        })}

        {adding ? (
          <form className="card form-card" onSubmit={addTracker}>
            <label htmlFor="tracker-name" className="label">Was willst du in den Griff bekommen?</label>
            <input
              id="tracker-name"
              className="input"
              placeholder="z.B. Social Media (abends)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              required
            />
            <div className="button-row">
              <button type="button" className="btn btn-outline" onClick={() => setAdding(false)}>Abbrechen</button>
              <button type="submit" className="btn btn-primary">Tracker anlegen</button>
            </div>
          </form>
        ) : (
          trackers && (
            <button type="button" className="dashed-button" onClick={() => setAdding(true)}>
              + Neuen Tracker hinzufügen
            </button>
          )
        )}
      </div>
    </div>
  );
}
