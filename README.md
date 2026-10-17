# Consultation Booking

A web app for booking consultations with lecturers, with separate workspaces for students,
lecturers and administrators.

- [User Guide](docs/UserGuide.md)
- [Developer Guide](docs/DeveloperGuide.md)

## Local development

Requires Node.js 24 and Docker.

```sh
npm install
npx supabase start          # local database and auth; prints the keys for .env.local
cp .env.example .env.local  # then fill in the values
npm run dev                 # http://127.0.0.1:3000
```

## Checks

```sh
npm run lint && npm run typecheck && npm test && npm run check:spec
npm run test:db    # needs `npx supabase start`
npm run test:e2e
```
