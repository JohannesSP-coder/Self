import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage, type Segment, type Tracker } from "../api";
import { useAuth } from "../auth";
import { ChatIcon, ChevronRightIcon, FlameIcon, LogoutIcon, SEGMENT_ICONS, SegmentIcon } from "../components/Icons";
import { isFocusSegment } from "../util";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "Guten Morgen";
  if (hour < 18) return "Hallo";
  return "Guten Abend";
}

export function HomePage() {
  const { user, logout } = useAuth();
  const [segments, setSegments] = useState<Segment[] | null>(null);
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [lastMood, setLastMood] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("star");

  const load = useCallback(async () => {
    try {
      const [s, u, j] = await Promise.all([api.segments(), api.urges(), api.journal()]);
      setSegments(s.segments);
      setTrackers(u.trackers);
      setLastMood(j.entries[0]?.mood ?? null);
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addSegment(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await api.createSegment(newName.trim(), newIcon);
      setNewName("");
      setNewIcon("star");
      setAdding(false);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const habits = segments?.flatMap((s) => s.habits) ?? [];
  const doneToday = habits.filter((h) => h.doneToday).length;
  const cleanDays = trackers.length > 0 ? Math.max(...trackers.map((t) => t.streakDays)) : null;
  const today = new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="overline">{today}</div>
          <h1 className="page-title">
            {greeting()}, {user?.name}
          </h1>
        </div>
        <div className="avatar-menu">
          <button
            type="button"
            className="avatar"
            aria-label="Konto-Menü"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {user?.name.charAt(0).toUpperCase()}
          </button>
          {menuOpen && (
            <div className="menu" role="menu">
              <div className="menu-mail">{user?.email}</div>
              <button type="button" role="menuitem" className="menu-item" onClick={logout}>
                <LogoutIcon size={16} /> Abmelden
              </button>
            </div>
          )}
        </div>
      </header>

      {error && <div className="error" role="alert">{error}</div>}

      <div className="stat-row">
        <div className="stat">
          <div className="stat-value">{segments ? `${doneToday}/${habits.length}` : "–"}</div>
          <div className="stat-label">Habits heute</div>
        </div>
        <div className="stat">
          <div className="stat-value">
            {cleanDays !== null && <span className="flame"><FlameIcon size={15} /></span>}
            {cleanDays ?? "–"}
          </div>
          <div className="stat-label">Tage sauber</div>
        </div>
        <div className="stat">
          <div className="stat-value">{lastMood ? `${lastMood}/5` : "–"}</div>
          <div className="stat-label">Stimmung</div>
        </div>
      </div>

      <div className="section-head">
        <h2>Deine Bereiche</h2>
        <button type="button" className="link-button" onClick={() => setAdding(!adding)}>
          {adding ? "Abbrechen" : "+ Neu"}
        </button>
      </div>

      {adding && (
        <form className="card form-card" onSubmit={addSegment}>
          <label htmlFor="segment-name" className="label">Name des Bereichs</label>
          <input
            id="segment-name"
            className="input"
            placeholder="z.B. Ernährung, Karriere, Beziehungen"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
            required
          />
          <div className="label">Symbol</div>
          <div className="icon-picker">
            {Object.entries(SEGMENT_ICONS).map(([key, { label }]) => (
              <button
                key={key}
                type="button"
                className={newIcon === key ? "icon-choice selected" : "icon-choice"}
                aria-label={label}
                aria-pressed={newIcon === key}
                onClick={() => setNewIcon(key)}
              >
                <SegmentIcon icon={key} size={20} />
              </button>
            ))}
          </div>
          <button type="submit" className="btn btn-primary">Bereich anlegen</button>
        </form>
      )}

      <div className="stack">
        {segments === null && !error && <div className="muted">Lädt…</div>}
        {segments?.length === 0 && (
          <div className="empty">Noch keine Bereiche. Leg deinen ersten an, z.B. Fitness oder Schlaf.</div>
        )}
        {segments?.map((segment) => {
          const done = segment.habits.filter((h) => h.doneToday).length;
          const streak = Math.max(0, ...segment.habits.map((h) => h.streak));
          const focus = isFocusSegment(segment);
          return (
            <Link key={segment.id} to={`/bereiche/${segment.id}`} className={focus ? "segment-card focus" : "segment-card"}>
              <div className={focus ? "icon-badge solid" : "icon-badge"}>
                <SegmentIcon icon={segment.icon} size={21} />
              </div>
              <div className="segment-text">
                <div className="segment-name">
                  {segment.name}
                  {focus && <span className="pill">FOKUS</span>}
                </div>
                <div className="segment-sub">
                  {segment.habits.length} {segment.habits.length === 1 ? "Habit" : "Habits"} · {done} heute erledigt
                </div>
              </div>
              <div className={streak > 0 ? "streak" : "streak muted"}>
                <FlameIcon /> {streak}
              </div>
            </Link>
          );
        })}
      </div>

      <Link to="/coach" className="coach-banner">
        <div className="coach-banner-icon"><ChatIcon size={19} /></div>
        <div className="grow">
          <div className="coach-banner-title">Brauchst du einen Impuls?</div>
          <div className="coach-banner-sub">Frag deinen Coach</div>
        </div>
        <ChevronRightIcon size={18} />
      </Link>
    </div>
  );
}
