# Snow Arena

Nowoczesny blog o sportach zimowych (Vue 3 + Vite + Firebase).

## Setup

```sh
npm install
cp .env.example .env
```

W `.env` ustaw klucze `VITE_FIREBASE_*`.

`VITE_ADMIN_EMAILS` jest opcjonalne i służy jako fallback dla roli admina
(docelowo zalecane jest użycie custom claims `admin: true` po stronie Firebase).

## Uruchomienie

```sh
npm run dev
```

## Build produkcyjny

```sh
npm run build
```

## Ustawienie roli admin (Firebase custom claim)

1. Pobierz klucz Service Account JSON z Firebase Console.
2. Ustaw zmienne środowiskowe i uruchom:

```sh
export GOOGLE_APPLICATION_CREDENTIALS="/sciezka/do/service-account.json"
ADMIN_EMAIL="twoj_email_admina@example.com" npm run set-admin-claim
```

## Automatyczna synchronizacja medali i kalendarza (Cortina 2026)

Skrypt pobiera dane JSON i aktualizuje kolekcje `medals` oraz `events` w Firestore.

```sh
export GOOGLE_APPLICATION_CREDENTIALS="/sciezka/do/service-account.json"
MEDALS_SOURCE_URL="https://twoj-serwer/medals.json" \
EVENTS_SOURCE_URL="https://twoj-serwer/events.json" \
npm run sync-cortina-data
```

Obsługiwane formaty:
- `MEDALS_SOURCE_URL`: `[{ code, country, flag, gold, silver, bronze }]` lub `{ medals: [...] }`
- `EVENTS_SOURCE_URL`: `[{ id?, title, sport, date, time, icon }]` lub `{ events: [...] }`

## Darmowa synchronizacja z Wikipedii (best-effort)

Skrypt pobiera:
- medal table z `2026 Winter Olympics medal table`
- harmonogram konkurencji z podstron dyscyplin `...at the 2026 Winter Olympics`
- oznacza wydarzenia medalowe i buduje dzienne podsumowania w `daily_medal_events`

```sh
export GOOGLE_APPLICATION_CREDENTIALS="/sciezka/do/service-account.json"
npm run sync-cortina-wikipedia
```
