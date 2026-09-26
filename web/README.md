# Badminton Court Booking — web application

The browser client for the Session 5 assignment. It is one of several
possible clients of the same service; it holds no rules of its own.

## Running it

```bash
cp .env.example .env.local   # then fill in the addresses
npm install
npm run dev                  # http://localhost:5173
```

It needs two things already running:

- the service, from `../service` (`npm start`)
- Keycloak, from `../infra` (`docker compose -f docker-compose.auth.yml up`)

The service must list this application's origin in `CORS_ALLOWED_ORIGINS`,
and the Keycloak client must list `<origin>/callback` as a redirect URI.
Both are per-origin: a deployment on a new address needs both updated.

## Shape

```text
src/
├── services/api.js     the only file that calls fetch — base URL, the
│                       Authorization header, error translation
├── auth/               Keycloak adapter and the session context
└── views/              one screen per address, four states each
```

Configuration comes from the environment (`.env.example` lists it). Nothing
here is secret: Vite inlines every `VITE_`-prefixed variable into the bundle,
where any visitor can read it.
