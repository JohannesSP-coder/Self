import { useEffect, useState, type FormEvent } from "react";
import { api, errorMessage, type JournalEntry } from "../api";
import { ConfirmBox } from "../components/ConfirmBox";
import { PlusIcon, TrashIcon } from "../components/Icons";
import { formatEntryDate } from "../util";

export function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [mood, setMood] = useState(4);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api
      .journal()
      .then((res) => setEntries(res.entries))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  function closeComposer() {
    setComposerOpen(false);
    setDraft("");
    setMood(4);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSaving(true);
    try {
      const res = await api.createEntry(draft.trim(), mood);
      setEntries((prev) => [res.entry, ...(prev ?? [])]);
      closeComposer();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(entry: JournalEntry) {
    setDeleting(true);
    try {
      await api.deleteEntry(entry.id);
      setEntries((prev) => prev?.filter((e) => e.id !== entry.id) ?? null);
      setConfirming(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Journal</h1>
        <button
          type="button"
          className="round-button"
          aria-label={composerOpen ? "Eintrag verwerfen" : "Neuer Eintrag"}
          aria-expanded={composerOpen}
          onClick={() => (composerOpen ? closeComposer() : setComposerOpen(true))}
        >
          <PlusIcon size={18} />
        </button>
      </header>

      {error && <div className="error" role="alert">{error}</div>}

      {composerOpen && (
        <form className="card form-card" onSubmit={save}>
          <label htmlFor="journal-body" className="visually-hidden">Eintrag</label>
          <textarea
            id="journal-body"
            className="input textarea"
            placeholder="Was beschäftigt dich heute?"
            rows={5}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            required
          />
          <div className="label" id="mood-label">Stimmung</div>
          <div className="mood-picker" role="radiogroup" aria-labelledby="mood-label">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={mood === v}
                className={mood === v ? "mood selected" : "mood"}
                onClick={() => setMood(v)}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="button-row">
            <button type="button" className="btn btn-outline" onClick={closeComposer}>Verwerfen</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Speichert…" : "Speichern"}
            </button>
          </div>
        </form>
      )}

      <div className="stack">
        {entries === null && !error && <div className="muted">Lädt…</div>}
        {entries?.length === 0 && !composerOpen && (
          <div className="empty">
            Noch keine Einträge. Schreib auf, was dich heute beschäftigt – dein Coach liest mit und kann besser
            auf dich eingehen.
          </div>
        )}
        {entries?.map((entry) => (
          <article key={entry.id} className="journal-entry">
            <div className="journal-meta">
              <span className="journal-date">{formatEntryDate(entry.createdAt)}</span>
              <div className="journal-meta-right">
                {entry.mood !== null && <span className="chip">Stimmung {entry.mood}/5</span>}
                <button
                  type="button"
                  className="icon-button subtle"
                  aria-label="Eintrag löschen"
                  onClick={() => setConfirming(entry.id)}
                >
                  <TrashIcon size={15} />
                </button>
              </div>
            </div>
            <p className="journal-body">{entry.body}</p>
            {confirming === entry.id && (
              <ConfirmBox
                text="Diesen Eintrag löschen?"
                busy={deleting}
                onConfirm={() => remove(entry)}
                onCancel={() => setConfirming(null)}
              />
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
