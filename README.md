# Meglio

Self-Improvement-App für junge, ambitionierte Menschen: Lebensbereiche mit Habits und Streaks, Journal,
Sucht-Tracker mit App-Blocker-Einstellungen und ein KI-Life-Coach auf Basis von Claude.

## Aufbau

| Ordner | Inhalt |
| --- | --- |
| `apps/server` | API: Express + TypeScript, Prisma (SQLite in der Entwicklung), JWT-Login, Claude-Coach |
| `apps/web` | Website: React + Vite + TypeScript, Design aus dem Mockup (Schwarz/Rot) |

## Lokal starten

Voraussetzungen: Node.js 22 und pnpm.

```bash
pnpm install

# Backend einrichten
cp apps/server/.env.example apps/server/.env   # JWT_SECRET setzen, optional ANTHROPIC_API_KEY
cd apps/server && npx prisma migrate dev && cd ../..

# In zwei Terminals:
pnpm dev:server   # API auf http://localhost:4000
pnpm dev:web      # Website auf http://localhost:5173
```

Die Website leitet `/api` im Entwicklungsmodus automatisch an das Backend weiter.

### Coach aktivieren

Der Coach braucht einen Anthropic-API-Key (https://console.anthropic.com). Trag ihn in `apps/server/.env` als
`ANTHROPIC_API_KEY` ein und starte den Server neu. Ohne Key läuft alles andere normal, der Coach meldet dann
"gerade nicht verfügbar". Jede Coach-Nachricht verursacht API-Kosten.

## Funktionen der Website

- Registrierung und Login; neue Nutzer sehen einmalig das Onboarding zu Fitness, Erholung und Schlaf
- Home mit Tagesstatistik und Lebensbereichen (Fitness, Mindset, Schlaf als Fokus, Finanzen + eigene)
- Bereichsseite mit Habits abhaken, Streaks, Wochenübersicht, Habits anlegen und löschen
- Journal mit Stimmung (1–5)
- Sucht-Tracker: Drang widerstanden, Rückfall (mit Bestätigung), Tracker anlegen
- App-Blocker-Einstellungen pro Tracker: Zeitplan, Apps, Erwachsenen-Filter, eigene Webseiten, Wartezeit
- Coach-Chat, der Bereiche, Streaks, Journal und Blocker-Versuche des Nutzers kennt

Das eigentliche Sperren von Apps und Webseiten ist im Browser nicht möglich; es muss in einer nativen
Handy-App umgesetzt werden (iOS Screen Time API mit Family-Controls-Berechtigung, unter Android Accessibility
Service bzw. VPN-Filter). Die Website speichert die Einstellungen dafür.

## Produktion

- `pnpm build:web` erzeugt statische Dateien in `apps/web/dist` (z. B. für Vercel oder Netlify).
  `VITE_API_URL` beim Build auf die öffentliche API-Adresse setzen.
- `pnpm build:server` baut die API; für den Betrieb `DATABASE_URL` auf PostgreSQL umstellen
  (`provider` in `apps/server/prisma/schema.prisma`) und einen starken `JWT_SECRET` setzen.
- Schriften werden mit der App ausgeliefert (kein Nachladen von Google-Servern).
