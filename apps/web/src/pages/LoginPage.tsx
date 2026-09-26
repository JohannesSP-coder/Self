import { useState, type FormEvent } from "react";
import { errorMessage } from "../api";
import { useAuth } from "../auth";
import { AnimeFigure } from "../components/AnimeFigure";
import { IS_DEMO } from "../config";

export function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isRegister = mode === "register";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (isRegister) await register(name.trim(), email.trim(), password);
      else await login(email.trim(), password);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  function switchMode() {
    setMode(isRegister ? "login" : "register");
    setError(null);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-hero">
          <AnimeFigure width={110} />
          <div className="auth-brand">
            <h1 className="wordmark">Meglio</h1>
            <svg width="72" height="10" viewBox="0 0 72 10" aria-hidden="true">
              <path d="M2 8C20 2 52 2 70 8" fill="none" stroke="#D12A24" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        <p className="auth-tagline">Für alle, die jeden Tag ein bisschen besser werden wollen.</p>

        {IS_DEMO && (
          <p className="demo-note">
            Demo-Version: Deine Einträge werden privat in deinem claude.ai-Konto gespeichert. Ein Passwort wird hier
            nicht geprüft.
          </p>
        )}

        <form className="auth-form" onSubmit={onSubmit}>
          {isRegister && (
            <div className="field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                className="input"
                autoComplete="given-name"
                placeholder="Wie sollen wir dich nennen?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="email">E-Mail</label>
            <input
              id="email"
              type="email"
              className="input"
              autoComplete="email"
              placeholder="du@beispiel.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Passwort</label>
            <input
              id="password"
              type="password"
              className="input"
              autoComplete={isRegister ? "new-password" : "current-password"}
              placeholder={isRegister ? "Mindestens 8 Zeichen" : "••••••••"}
              minLength={isRegister ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="error" role="alert">{error}</div>}

          <button type="submit" className="btn btn-primary btn-glow" disabled={busy}>
            {busy ? "Einen Moment…" : isRegister ? "Konto erstellen" : "Einloggen"}
          </button>

          <div className="divider"><span>oder</span></div>

          <button type="button" className="btn btn-outline" onClick={switchMode}>
            {isRegister ? "Ich habe schon ein Konto" : "Neues Konto erstellen"}
          </button>
        </form>

        <p className="auth-legal">
          Mit dem Fortfahren stimmst du unseren Nutzungsbedingungen &amp; der Datenschutzerklärung zu.
        </p>
      </div>
    </div>
  );
}
