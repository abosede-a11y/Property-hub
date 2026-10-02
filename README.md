# Property Hub

A property listings platform: customers can browse listings, create an
account, manage their profile, and leave reviews on properties.

Sprint 1 covers two High Level Requirements from the spec:
- **Customer Account** — sign up, sign in, sign out, reset password, manage profile
- **Review** — leave reviews (with moderation), view ratings and reviews on a listing

A minimal **listings** model is included underneath these so there are real
properties to browse and review (not in the original HLR spreadsheet, but
needed for Account and Review to be usable). Newsletter subscription and
mortgage provider info (HLR 3 and 4) are not built yet — next sprints.

## Stack

- Backend: Node.js/Express, PostgreSQL (`pg`, no ORM), JWT auth, Resend for email
- Frontend: React + Vite + Tailwind CSS, React Router
- Hosting: Neon (Postgres) → GitHub → Render (backend) → Vercel (frontend)

This matches the Pure Insurance and Elite Pro Academy projects, so the
deploy steps below are the same shape as those.

## Local development

### 1. Backend

```
cd backend
cp .env.example .env      # fill in DATABASE_URL and JWT_SECRET
npm install
npm run migrate           # creates tables
npm run seed               # demo accounts + sample listings
npm run dev                 # http://localhost:4000
```

Demo accounts after seeding:
- Admin: `admin@propertyhub.test` / `Demo1234!`
- Customer (verified): `demo@propertyhub.test` / `Demo1234!`
- Customer (unverified, to test the verification gate): `unverified@propertyhub.test` / `Demo1234!`

### 2. Frontend

```
cd frontend
cp .env.example .env.local   # VITE_API_URL=http://localhost:4000
npm install
npm run dev                   # http://localhost:5173
```

## Sending real email (optional)

Without `RESEND_API_KEY` set, verification and reset links are returned
directly in the API response (`devVerifyUrl` / `devResetUrl`) and shown
on-screen, so the flow is testable without any email setup.

To send real email:
1. Sign up at resend.com and verify a sending domain (or reuse one you've
   already verified for another project — Resend accounts aren't limited to
   one project).
2. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` (e.g. `Property Hub <hello@yourdomain.com>`).
3. Until a domain is verified, Resend's testing address `onboarding@resend.dev`
   can only send to your own Resend account email — set `RESEND_FROM_EMAIL`
   to a verified domain to send to anyone else.

If Resend is configured but a send genuinely fails (bad key, unverified
domain), the raw link is **not** exposed on-screen — that only happens when
no provider is configured at all. Check the server logs for the real error.

## Deploying

### Database (Neon)
1. Create a new Neon project and copy the pooled connection string.
2. Run `npm run migrate` locally against it once (with `DATABASE_URL`
   pointed at Neon), or run it as a one-off from Render after first deploy.

### Backend (Render)
1. Push this repo to GitHub.
2. New Web Service on Render → connect the repo.
3. **Root directory: `backend`** (this is the step that trips people up —
   Render needs to know the backend isn't at the repo root).
4. Build command: `npm install`. Start command: `npm start`.
5. Environment variables: `DATABASE_URL` (Neon), `JWT_SECRET` (any long
   random string), `FRONTEND_URL` (your Vercel URL, once you have it —
   **must include `https://` and no trailing slash**, or CORS will fail),
   `RESEND_API_KEY` / `RESEND_FROM_EMAIL` (optional).
6. After first deploy, run `npm run migrate` and `npm run seed` — either as
   a Render shell command, or locally with `DATABASE_URL` pointed at Neon.

### Frontend (Vercel)
1. New Project on Vercel → import the repo → **root directory: `frontend`**.
2. Environment variable `VITE_API_URL` = your Render backend URL (no
   trailing slash). Set it as a **Plain** value, not Secret — a Secret env
   var can't be edited later without deleting and recreating it.
3. Deploy. Then go back to Render and set `FRONTEND_URL` to this Vercel URL.

### Common issues (seen on the previous two projects, likely to recur here)
- **CORS errors in the browser console**: `FRONTEND_URL` on Render doesn't
  exactly match the Vercel URL (missing `https://`, has a trailing slash,
  or is stale after a Vercel domain change).
- **"No matching version" on `npm install`**: registry cache issue — clear
  with `npm cache clean --force` and retry.
- **Resend "testing emails" error in Render logs**: you're sending from
  `onboarding@resend.dev` to an address that isn't your own Resend account
  email. Point `RESEND_FROM_EMAIL` at a verified domain instead.

## API overview

- `POST /api/auth/register`, `/verify-email`, `/resend-verification`,
  `/login`, `/logout`, `/forgot-password`, `/reset-password`
- `GET /api/auth/me`, `PATCH /api/auth/profile` (email change requires
  `currentPassword`), `PATCH /api/auth/password`
- `GET /api/listings`, `GET /api/listings/:id` (filters: `city`,
  `propertyType`, `listingType`, `minBedrooms`)
- `POST/PATCH/DELETE /api/listings` — admin only, for managing listings
- `GET/POST /api/listings/:id/reviews`, `GET /api/reviews/mine`,
  `PATCH/DELETE /api/reviews/:id`
- `GET/PATCH /api/admin/reviews` — admin moderation (approve/reject)

## What's next

- Newsletter subscription (HLR 3) and mortgage provider info (HLR 4)
- Admin UI for managing listings (currently API-only, seeded via script)
