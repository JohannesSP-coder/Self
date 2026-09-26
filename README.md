# Meglio

Self-Improvement-App für junge, ambitionierte Menschen: Lebensbereiche mit Habits und Streaks, Journal,
Sucht-Tracker mit App-Blocker-Einstellungen und ein KI-Life-Coach auf Basis von Claude.

## Aufbau

| Ordner | Inhalt |
| --- | --- |
| `apps/server` | API: Express + TypeScript, Prisma (SQLite in der Entwicklung), JWT-Login, Claude-Coach |
| `apps/web` | Website: React + Vite + TypeScript, Design aus dem Mockup (Schwarz/Rot) |
| `apps/mobile` | Native App: Expo + Expo Router + TypeScript, dieselbe API wie die Website |

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

### Push-Erinnerungen aktivieren

Ohne weitere Einrichtung zeigt Meglio Erinnerungen als Banner in der App (funktioniert auch in der
claude.ai-Demo). Für echte Push-Benachrichtigungen ein VAPID-Schlüsselpaar erzeugen und in
`apps/server/.env` eintragen:

```bash
npx web-push generate-vapid-keys
```

`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` und `VAPID_CONTACT_EMAIL` setzen, Server neu starten. Danach
lässt sich der Schalter "Erinnerungen" auf `/profil` aktivieren.

## Native App (apps/mobile)

```bash
cp apps/mobile/.env.example apps/mobile/.env   # EXPO_PUBLIC_API_URL ggf. auf die LAN-IP deines Rechners setzen
pnpm dev:mobile
```

Dann im Terminal `w` für die Web-Vorschau drücken, oder die Expo-Go-App auf dem Handy den QR-Code
scannen lassen (dafür braucht `EXPO_PUBLIC_API_URL` die LAN-IP des Rechners, nicht `localhost`).
Kamera, Foto-Bibliothek und Profilbild funktionieren in Expo Go direkt. Für echte Push-Benachrichtigungen
braucht es zusätzlich ein EAS-Projekt (`npx eas-cli init`) und einen Development Build
(`npx expo run:ios` / `npx expo run:android`), da Expo Go seit SDK 53 keinen Remote-Push mehr unterstützt.

Die App deckt dieselben Funktionen wie die Website ab (Onboarding, Bereiche, Beweisfotos per Kamera
oder Galerie, Journal, Sucht-Tracker, App-Blocker-Einstellungen, Coach, Profilbild, Erinnerungen).
Genau wie bei der Website ist der App-Blocker nur die Konfigurationsoberfläche: echtes Sperren von
Apps auf dem Gerät bräuchte zusätzlich die iOS Screen-Time-/Family-Controls-Berechtigung bzw. einen
Android Accessibility Service – ein eigenes, deutlich größeres natives Projekt mit Store-Freigabe.

## Funktionen der Website

- Registrierung und Login; neue Nutzer sehen einmalig das Onboarding zu Fitness, Erholung und Schlaf
- Home mit Tagesstatistik und Lebensbereichen (Fitness, Mindset, Schlaf als Fokus, Finanzen + eigene)
- Bereichsseite mit Habits abhaken, Streaks, Wochenübersicht, Habits anlegen und löschen
- Journal mit Stimmung (1–5)
- Sucht-Tracker: Drang widerstanden, Rückfall (mit Bestätigung), Tracker anlegen
- App-Blocker-Einstellungen pro Tracker: Zeitplan, Apps, Erwachsenen-Filter, eigene Webseiten, Wartezeit
- Coach-Chat, der Bereiche, Streaks, Journal und Blocker-Versuche des Nutzers kennt
- Erinnerungen: kurzer Hinweis auf Home, wenn nachmittags/abends/nachts noch ein Habit offen ist
  (Sport, Mindset/Finanzen, Schlaf), optional auch als echte Push-Benachrichtigung

Das eigentliche Sperren von Apps und Webseiten ist im Browser nicht möglich; es muss in einer nativen
Handy-App umgesetzt werden (iOS Screen Time API mit Family-Controls-Berechtigung, unter Android Accessibility
Service bzw. VPN-Filter). Die Website speichert die Einstellungen dafür.

## Produktion

- `pnpm build:web` erzeugt statische Dateien in `apps/web/dist` (z. B. für Vercel oder Netlify).
  `VITE_API_URL` beim Build auf die öffentliche API-Adresse setzen.
- `pnpm build:server` baut die API; für den Betrieb `DATABASE_URL` auf PostgreSQL umstellen
  (`provider` in `apps/server/prisma/schema.prisma`) und einen starken `JWT_SECRET` setzen.
- Schriften werden mit der App ausgeliefert (kein Nachladen von Google-Servern).
