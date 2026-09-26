import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, errorMessage, type Segment } from "../api";
import { ConfirmBox } from "../components/ConfirmBox";
import { ArrowLeftIcon, CheckIcon, FlameIcon, SegmentIcon, TrashIcon } from "../components/Icons";
import { isFocusSegment } from "../util";

function lastSevenDayLabels(): string[] {
  const labels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString("de-DE", { weekday: "short" }).replace(".", ""));
  }
  return labels;
}

export function SegmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [segment, setSegment] = useState<Segment | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState(5);
  // Which delete is waiting for confirmation: "segment", a habit id, or nothing.
  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.segments();
      const found = res.segments.find((s) => s.id === id) ?? null;
      setSegment(found);
      setNotFound(found === null);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(habitId: string) {
    setPending(habitId);
    try {
      await api.toggleHabit(habitId);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(null);
    }
  }

  async function addHabit(e: FormEvent) {
    e.preventDefault();
    if (!segment || !title.trim()) return;
    try {
      await api.createHabit(segment.id, title.trim(), target);
      setTitle("");
      setTarget(5);
      setAdding(false);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function removeHabit(habitId: string) {
    setDeleting(true);
    try {
      await api.deleteHabit(habitId);
      setConfirming(null);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  async function removeSegment() {
    if (!segment) return;
    setDeleting(true);
    try {
      await api.deleteSegment(segment.id);
      navigate("/", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setDeleting(false);
    }
  }

  if (notFound) {
    return (
      <div className="page">
        <div className="empty">Diesen Bereich gibt es nicht (mehr).</div>
        <Link to="/" className="btn btn-outline">Zurück zu Home</Link>
      </div>
    );
  }

  const labels = lastSevenDayLabels();
  const habits = segment?.habits ?? [];
  const focus = segment ? isFocusSegment(segment) : false;

  return (
    <div className="page">
      <header className="page-header with-back">
        <Link to="/" className="back-button" aria-label="Zurück zu Home">
          <ArrowLeftIcon size={17} />
        </Link>
        <div className="grow">
          <div className="overline">Bereich</div>
          <h1 className="page-title small">{segment?.name ?? "…"}</h1>
        </div>
        {segment && (
          <div className={focus ? "icon-badge solid" : "icon-badge"}>
            <SegmentIcon icon={segment.icon} size={19} />
          </div>
        )}
      </header>

      {error && <div className="error" role="alert">{error}</div>}

      <div className="week-strip" aria-label="Die letzten 7 Tage">
        {labels.map((label, i) => {
          const done = habits.filter((h) => h.last7[i]).length;
          const state = habits.length > 0 && done === habits.length ? "dot-full" : done > 0 ? "dot-partial" : "dot-none";
          const isToday = i === 6;
          return (
            <div key={i} className="day">
              <span className={isToday ? "day-label today" : "day-label"}>{label}</span>
              <div
                className={`day-dot ${state}${isToday ? " today" : ""}`}
                title={`${done} von ${habits.length} erledigt`}
              />
            </div>
          );
        })}
      </div>

      <h2 className="section-title">Deine Habits</h2>
      <div className="stack">
        {segment && habits.length === 0 && (
          <div className="empty">Noch keine Habits in diesem Bereich. Leg unten dein erstes an.</div>
        )}
        {habits.map((habit) =>
          confirming === habit.id ? (
            <ConfirmBox
              key={habit.id}
              text={`„${habit.title}“ löschen? Der Verlauf geht dabei verloren.`}
              busy={deleting}
              onConfirm={() => removeHabit(habit.id)}
              onCancel={() => setConfirming(null)}
            />
          ) : (
            <div key={habit.id} className="habit-row">
              <button
                type="button"
                className={habit.doneToday ? "check done" : "check"}
                aria-pressed={habit.doneToday}
                aria-label={`${habit.title} heute erledigt`}
                disabled={pending === habit.id}
                onClick={() => toggle(habit.id)}
              >
                {habit.doneToday && <CheckIcon size={14} />}
              </button>
              <div className="grow">
                <div className="habit-title">{habit.title}</div>
                <div className="habit-sub">Ziel: {habit.targetPerWeek}x / Woche</div>
              </div>
              <div className={habit.streak > 0 ? "streak" : "streak muted"}>
                <FlameIcon /> {habit.streak}
              </div>
              <button
                type="button"
                className="icon-button subtle"
                aria-label={`${habit.title} löschen`}
                onClick={() => setConfirming(habit.id)}
              >
                <TrashIcon size={16} />
              </button>
            </div>
          ),
        )}

        {adding ? (
          <form className="card form-card" onSubmit={addHabit}>
            <label htmlFor="habit-title" className="label">Neues Habit</label>
            <input
              id="habit-title"
              className="input"
              placeholder="z.B. 20 Min. Laufen"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
            <label htmlFor="habit-target" className="label">Ziel pro Woche</label>
            <select
              id="habit-target"
              className="input"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>{n === 7 ? "Jeden Tag" : `${n}x pro Woche`}</option>
              ))}
            </select>
            <div className="button-row">
              <button type="button" className="btn btn-outline" onClick={() => setAdding(false)}>Abbrechen</button>
              <button type="submit" className="btn btn-primary">Hinzufügen</button>
            </div>
          </form>
        ) : (
          segment && (
            <button type="button" className="dashed-button" onClick={() => setAdding(true)}>
              + Neues Habit hinzufügen
            </button>
          )
        )}
      </div>

      {segment &&
        (confirming === "segment" ? (
          <div className="bottom-confirm">
            <ConfirmBox
              text={`Bereich „${segment.name}“ mit allen Habits löschen?`}
              confirmLabel="Bereich löschen"
              busy={deleting}
              onConfirm={removeSegment}
              onCancel={() => setConfirming(null)}
            />
          </div>
        ) : (
          <button type="button" className="danger-link" onClick={() => setConfirming("segment")}>
            Bereich löschen
          </button>
        ))}
    </div>
  );
}
