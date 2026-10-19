# Backend

Express and MongoDB API for the RPS app.

## Stack

- Node.js
- Express
- MongoDB with Mongoose
- JWT auth
- Multer uploads
- Node cron jobs

## Layout

```text
backend/
├── controllers/
├── routes/
├── models/
├── middleware/
├── utils/
├── jobs/
├── scripts/
├── seeders/
├── public/
│   └── assets/
│       └── avatars/
├── uploads/
└── index.js
```

## Conventions

- Use `kebab-case` for routes and URL paths.
- Use `camelCase` for functions, variables, and helper files.
- Keep feature-specific code close to the feature that uses it.
- Put static files under `public/assets/<purpose>/`, not at the root of `public/`.

## Runtime Notes

- `backend/index.js` serves API routes, backend static assets, and uploaded files. The production frontend is built and served by the root Nginx image.
- `backend/public/assets/avatars/default-avatar.png` is the shared avatar fallback.
- `backend/routes/games.js` contains the RPS, spinner, casino, puzzle, and click-frenzy routes.

## Account notifications

Ops supplies the shared notification runtime and protected profile through its
controller-managed mounts. The mailer is a semantic adapter; account token
creation, expiry, verification and action-link routing stay in this application.
Missing mounts fail delivery without falling back to app-owned SMTP settings or
templates. Admin health reports configuration readiness only and does not send
a message or claim SMTP connectivity.

The ordinary backend tests verify the semantic adapter without external mounts.
For the shared-runtime integration check, build the notification bundle from
Ops, set `RPS_NOTIFICATION_TEST_BUNDLE` to that generated directory, and run
`npm --prefix backend test`. This uses synthetic profiles and a stub sender;
it never sends mail to a provider. The existing SMTP compatibility check uses
only a local loopback fixture.
