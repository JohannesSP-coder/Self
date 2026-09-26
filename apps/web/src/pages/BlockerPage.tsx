import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, errorMessage, type BlockRule, type Tracker } from "../api";
import { ConfirmBox } from "../components/ConfirmBox";
import { ArrowLeftIcon, LockIcon, TrashIcon } from "../components/Icons";
import { Toggle } from "../components/Toggle";

const APPS: BlockRule[] = [
  { kind: "app", target: "instagram", label: "Instagram" },
  { kind: "app", target: "tiktok", label: "TikTok" },
  { kind: "app", target: "snapchat", label: "Snapchat" },
  { kind: "app", target: "youtube", label: "YouTube" },
  { kind: "app", target: "x", label: "X" },
  { kind: "app", target: "reddit", label: "Reddit" },
];

const ADULT: BlockRule = { kind: "category", target: "adult", label: "Erwachsenen-Inhalte" };
const DELAYS = [0, 5, 15, 30, 60];

function ruleKey(r: BlockRule): string {
  return `${r.kind}:${r.target}`;
}

/** Accepts "https://www.example.com/path" and returns "example.com", or null if it doesn't look like a domain. */
function normalizeDomain(input: string): string | null {
  const host = input
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/^www\./, "")
    .split(/[/?#]/)[0];
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) ? host : null;
}

export function BlockerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tracker, setTracker] = useState<Tracker | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [scheduled, setScheduled] = useState(true);
  const [from, setFrom] = useState("21:00");
  const [until, setUntil] = useState("07:00");
  const [delay, setDelay] = useState(15);
  const [rules, setRules] = useState<BlockRule[]>([]);
  const [domainInput, setDomainInput] = useState("");
  const [domainError, setDomainError] = useState<string | null>(null);

  useEffect(() => {
    api
      .urges()
      .then((res) => {
        const t = res.trackers.find((x) => x.id === id) ?? null;
        setTracker(t);
        setNotFound(t === null);
        if (!t) return;
        const b = t.blocker;
        setEnabled(b.enabled);
        setScheduled(b.from !== null);
        if (b.from) setFrom(b.from);
        if (b.until) setUntil(b.until);
        setDelay(b.unlockDelayMinutes);
        setRules(b.rules);
      })
      .catch((err) => setError(errorMessage(err)));
  }, [id]);

  const has = (r: BlockRule) => rules.some((x) => ruleKey(x) === ruleKey(r));
  const setRule = (r: BlockRule, on: boolean) => {
    setSavedAt(null);
    setRules((prev) => (on ? [...prev.filter((x) => ruleKey(x) !== ruleKey(r)), r] : prev.filter((x) => ruleKey(x) !== ruleKey(r))));
  };
  const websites = rules.filter((r) => r.kind === "website");

  function change<T>(setter: (v: T) => void) {
    return (v: T) => {
      setSavedAt(null);
      setter(v);
    };
  }

  function addDomain(e: FormEvent) {
    e.preventDefault();
    const domain = normalizeDomain(domainInput);
    if (!domain) {
      setDomainError("Bitte eine Domain wie beispiel.de eingeben.");
      return;
    }
    setRule({ kind: "website", target: domain, label: domain }, true);
    setDomainInput("");
    setDomainError(null);
  }

  function stepDelay(dir: 1 | -1) {
    const next = dir === 1 ? DELAYS.find((d) => d > delay) : [...DELAYS].reverse().find((d) => d < delay);
    if (next !== undefined) change(setDelay)(next);
  }

  async function save() {
    if (!tracker) return;
    setSaving(true);
    setError(null);
    try {
      await api.saveBlocker(tracker.id, {
        enabled,
        from: scheduled ? from : null,
        until: scheduled ? until : null,
        unlockDelayMinutes: delay,
        rules,
      });
      setSavedAt(Date.now());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function deleteTracker() {
    if (!tracker) return;
    setDeleting(true);
    try {
      await api.deleteTracker(tracker.id);
      navigate("/urges", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setDeleting(false);
    }
  }

  if (notFound) {
    return (
      <div className="page">
        <div className="empty">Diesen Tracker gibt es nicht (mehr).</div>
        <Link to="/urges" className="btn btn-outline">Zurück</Link>
      </div>
    );
  }

  const appCount = APPS.filter(has).length;

  return (
    <div className="page">
      <header className="page-header with-back">
        <Link to="/urges" className="back-button" aria-label="Zurück zum Sucht-Tracker">
          <ArrowLeftIcon size={17} />
        </Link>
        <div className="grow">
          <h1 className="page-title small">App-Blocker</h1>
          <div className="page-sub">für „{tracker?.name ?? "…"}“</div>
        </div>
      </header>

      {error && <div className="error" role="alert">{error}</div>}

      <div className={enabled ? "master-card on" : "master-card"}>
        <div className={enabled ? "icon-badge solid" : "icon-badge"}><LockIcon size={20} /></div>
        <div className="grow">
          <div className="segment-name">{enabled ? "Blocker ist aktiv" : "Blocker ist aus"}</div>
          <div className="segment-sub">
            {enabled
              ? `${scheduled ? `${from}–${until} Uhr` : "Rund um die Uhr"} · ${rules.length} Sperren`
              : "Nichts wird gesperrt"}
          </div>
        </div>
        <Toggle checked={enabled} onChange={change(setEnabled)} label="Blocker an oder aus" />
      </div>

      <div className={enabled ? "blocker-sections" : "blocker-sections dimmed"}>
        <section className="card">
          <h2 className="card-eyebrow">Wann sperren?</h2>
          <div className="segmented" role="radiogroup" aria-label="Zeitraum">
            <button type="button" role="radio" aria-checked={!scheduled} className={!scheduled ? "selected" : ""} onClick={() => change(setScheduled)(false)}>
              Immer
            </button>
            <button type="button" role="radio" aria-checked={scheduled} className={scheduled ? "selected" : ""} onClick={() => change(setScheduled)(true)}>
              Zeitplan
            </button>
          </div>
          {scheduled && (
            <div className="time-row">
              <label htmlFor="from">Von</label>
              <input id="from" type="time" className="input time" value={from} onChange={(e) => change(setFrom)(e.target.value)} required />
              <label htmlFor="until">bis</label>
              <input id="until" type="time" className="input time" value={until} onChange={(e) => change(setUntil)(e.target.value)} required />
            </div>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <h2 className="card-eyebrow">Apps</h2>
            <span className="muted small">{appCount} gesperrt</span>
          </div>
          {APPS.map((app) => (
            <div key={app.target} className="list-row">
              <div className="app-initial" aria-hidden="true">{app.label.charAt(0)}</div>
              <div className="grow list-row-title">{app.label}</div>
              <Toggle checked={has(app)} onChange={(on) => setRule(app, on)} label={`${app.label} sperren`} />
            </div>
          ))}
        </section>

        <section className="card">
          <h2 className="card-eyebrow">Webseiten</h2>
          <div className="list-row no-border">
            <div className="grow">
              <div className="list-row-title">Erwachsenen-Inhalte</div>
              <div className="segment-sub">Filter für Pornoseiten in allen Browsern</div>
            </div>
            <Toggle checked={has(ADULT)} onChange={(on) => setRule(ADULT, on)} label="Erwachsenen-Filter" />
          </div>
          {websites.map((site) => (
            <div key={site.target} className="list-row">
              <div className="grow list-row-title">{site.label}</div>
              <button type="button" className="icon-button subtle" aria-label={`${site.label} entfernen`} onClick={() => setRule(site, false)}>
                <TrashIcon size={15} />
              </button>
            </div>
          ))}
          <form className="inline-form" onSubmit={addDomain}>
            <label htmlFor="domain" className="visually-hidden">Webseite hinzufügen</label>
            <input
              id="domain"
              className="input"
              placeholder="Eigene Seite, z.B. reddit.com"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
            />
            <button type="submit" className="btn btn-outline compact">Hinzufügen</button>
          </form>
          {domainError && <div className="field-error">{domainError}</div>}
        </section>

        <section className="card">
          <h2 className="card-eyebrow">Notfall-Entsperren</h2>
          <p className="card-text">
            Entsperren geht nur mit Wartezeit, damit der erste Impuls vorbeigeht. Dein Coach fragt danach nach, was
            los war.
          </p>
          <div className="stepper">
            <button type="button" aria-label="Wartezeit verkürzen" onClick={() => stepDelay(-1)} disabled={delay <= DELAYS[0]}>−</button>
            <span>{delay === 0 ? "Keine Wartezeit" : `${delay} Min. Wartezeit`}</span>
            <button type="button" aria-label="Wartezeit verlängern" onClick={() => stepDelay(1)} disabled={delay >= DELAYS[DELAYS.length - 1]}>+</button>
          </div>
        </section>
      </div>

      <div className="note">
        Die Sperre selbst greift in der Meglio-App auf deinem Handy. Hier legst du fest, was gesperrt wird – die
        Einstellungen werden mit deinem Konto synchronisiert.
      </div>

      <div className="save-bar">
        <button type="button" className="btn btn-primary" onClick={save} disabled={saving || !tracker}>
          {saving ? "Speichert…" : savedAt ? "Gespeichert" : "Einstellungen speichern"}
        </button>
      </div>

      {confirmingDelete ? (
        <div className="bottom-confirm">
          <ConfirmBox
            text={`Tracker „${tracker?.name ?? ""}“ mit Verlauf und Blocker löschen?`}
            confirmLabel="Tracker löschen"
            busy={deleting}
            onConfirm={deleteTracker}
            onCancel={() => setConfirmingDelete(false)}
          />
        </div>
      ) : (
        <button type="button" className="danger-link" onClick={() => setConfirmingDelete(true)}>
          Tracker löschen
        </button>
      )}
    </div>
  );
}
