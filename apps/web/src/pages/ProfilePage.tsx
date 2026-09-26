import { useEffect, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { ApiError, api, errorMessage } from "../api";
import { useAuth } from "../auth";
import { Avatar } from "../components/Avatar";
import { ConfirmBox } from "../components/ConfirmBox";
import { ArrowLeftIcon, CameraIcon, LogoutIcon } from "../components/Icons";
import { Toggle } from "../components/Toggle";
import { currentPushEndpoint, disablePushReminders, enablePushReminders, supportsPush } from "../push";

export function ProfilePage() {
  const { user, avatarUrl, updateAvatar, removeAvatar, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasPhoto = Boolean(user?.avatarVersion);

  // Only shown once we know both the browser and the server can actually deliver a push (neither
  // holds in the claude.ai demo, where the reminder still shows up as the in-app banner on Home).
  const [pushAvailable, setPushAvailable] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);

  useEffect(() => {
    if (!supportsPush()) return;
    let cancelled = false;
    Promise.all([api.pushPublicKey().catch(() => ({ publicKey: null })), currentPushEndpoint()]).then(
      ([{ publicKey }, endpoint]) => {
        if (cancelled) return;
        setPushAvailable(Boolean(publicKey));
        setPushEnabled(endpoint !== null);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  async function onTogglePush(next: boolean) {
    setPushBusy(true);
    setPushError(null);
    try {
      if (next) await enablePushReminders();
      else await disablePushReminders();
      setPushEnabled(next);
    } catch (err) {
      setPushError(err instanceof Error ? err.message : "Etwas ist schiefgelaufen. Bitte versuch es erneut.");
    } finally {
      setPushBusy(false);
    }
  }

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await updateAvatar(file);
    } catch (err) {
      // compressAvatar throws plain Errors with viewer-facing text; API failures are ApiErrors.
      setError(err instanceof Error && !(err instanceof ApiError) ? err.message : errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    setBusy(true);
    setError(null);
    try {
      await removeAvatar();
      setConfirming(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header with-back">
        <Link to="/" className="back-button" aria-label="Zurück zu Home">
          <ArrowLeftIcon size={17} />
        </Link>
        <div className="grow">
          <div className="overline">Konto</div>
          <h1 className="page-title small">Profil</h1>
        </div>
      </header>

      {error && <div className="error" role="alert">{error}</div>}

      <section className="card profile-card">
        <div className={busy ? "profile-photo busy" : "profile-photo"}>
          <Avatar size={104} />
          <label htmlFor="avatar-input" className="profile-photo-badge" aria-hidden="true">
            <CameraIcon size={17} />
          </label>
        </div>
        <div className="profile-name">{user?.name}</div>
        <div className="profile-mail">{user?.email}</div>

        <input
          id="avatar-input"
          className="visually-hidden"
          type="file"
          accept="image/*"
          disabled={busy}
          aria-label="Profilbild auswählen"
          onChange={onPick}
        />
        <div className="profile-actions">
          <label htmlFor="avatar-input" className={busy ? "btn btn-primary disabled" : "btn btn-primary"}>
            <CameraIcon size={18} />
            {busy && !confirming ? "Lädt…" : hasPhoto ? "Foto ändern" : "Profilbild hinzufügen"}
          </label>
          {hasPhoto && !confirming && (
            <button type="button" className="btn btn-outline" onClick={() => setConfirming(true)} disabled={busy}>
              Foto entfernen
            </button>
          )}
        </div>
        {confirming && (
          <ConfirmBox
            text="Profilbild wirklich entfernen?"
            confirmLabel="Entfernen"
            busy={busy}
            onConfirm={onRemove}
            onCancel={() => setConfirming(false)}
          />
        )}
        {!hasPhoto && (
          <p className="profile-hint">
            Wähl ein Foto aus deiner Galerie oder mach direkt ein neues. Wir schneiden es quadratisch zu.
          </p>
        )}
        {hasPhoto && !avatarUrl && <p className="profile-hint">Foto wird geladen…</p>}
      </section>

      {pushAvailable && (
        <section className="card reminder-card">
          <div className="reminder-card-row">
            <div className="grow">
              <div className="reminder-card-title">Erinnerungen</div>
              <p className="profile-hint no-margin">
                Ein kurzer Hinweis am Nachmittag oder Abend, wenn noch ein Habit offen ist.
              </p>
            </div>
            <Toggle checked={pushEnabled} onChange={onTogglePush} label="Erinnerungen an oder aus" />
          </div>
          {pushBusy && <p className="profile-hint">Wird eingerichtet…</p>}
          {pushError && (
            <div className="error" role="alert">
              {pushError}
            </div>
          )}
        </section>
      )}

      <button type="button" className="btn btn-outline profile-logout" onClick={logout}>
        <LogoutIcon size={17} /> Abmelden
      </button>
    </div>
  );
}
