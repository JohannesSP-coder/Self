import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Segment } from "../api";
import { pickReminder } from "../reminders";
import { BellIcon, CloseIcon } from "./Icons";

const DISMISS_KEY = "meglio_dismissed_reminder";

function readDismissed(): string | null {
  try {
    return localStorage.getItem(DISMISS_KEY);
  } catch {
    return null;
  }
}

function writeDismissed(id: string): void {
  try {
    localStorage.setItem(DISMISS_KEY, id);
  } catch {
    // Storage can be unavailable (private mode); the banner just reappears next render.
  }
}

/**
 * A short, timed nudge for whatever's still open today — the exact same logic that decides push
 * reminders (see ../reminders.ts), so this also works where real push doesn't, e.g. the claude.ai
 * demo. Dismissing it remembers the reminder's id (stable for the rest of its time slot), so it
 * stays gone until the next slot or the next day brings a new one.
 */
export function ReminderBanner({ segments }: { segments: Segment[] | null }) {
  const [now, setNow] = useState(() => new Date());
  const [dismissedId, setDismissedId] = useState(readDismissed);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!segments) return null;
  const reminder = pickReminder(now, segments);
  if (!reminder || reminder.id === dismissedId) return null;

  return (
    <Link to={`/bereiche/${reminder.segmentId}`} className="reminder-banner">
      <div className="reminder-banner-icon">
        <BellIcon size={18} />
      </div>
      <div className="grow">
        <div className="reminder-banner-title">{reminder.title}</div>
        <div className="reminder-banner-body">{reminder.body}</div>
      </div>
      <button
        type="button"
        className="reminder-banner-close"
        aria-label="Erinnerung verwerfen"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          writeDismissed(reminder.id);
          setDismissedId(reminder.id);
        }}
      >
        <CloseIcon size={15} />
      </button>
    </Link>
  );
}
