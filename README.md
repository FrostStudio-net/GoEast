# GoEast Booking Manager

Internal operations application for managing GoEast cruise-tour bookings, daily schedules, resources, customers, printable day sheets, and CSV exports.

The frontend is built with React, TypeScript, and Vite. Authentication and operational data are provided by Supabase. This is an internal admin application and does not provide public signup or public booking functionality.

## Local setup

Requirements:

- Node.js 20 or newer
- npm
- Access to the GoEast Supabase project

Install dependencies:

```bash
npm install
```

Copy the environment template:

```bash
cp .env.example .env.local
```

Add the Supabase project URL and browser-safe anonymous/publishable key to `.env.local`, then start the application:

```bash
npm run dev
```

`.env.local` is ignored by Git. Never place a Supabase service-role key or another server secret in a `VITE_` variable because Vite embeds these variables in the browser bundle.

## Environment variables

The application requires:

```text
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

Only the Supabase anonymous/publishable browser key belongs in the frontend. Missing configuration stops the application with a clear configuration error.

## Supabase setup

For a new Supabase project:

1. Open the Supabase SQL Editor.
2. Run `supabase/migrations/202609240001_initial_schema.sql`.
3. Optionally run `supabase/seed.sql` to add the GoEast example data.
4. In Authentication → Users, create the first user with email and password.
5. Copy that user’s UUID and authorize it with:

```sql
insert into public.admin_users (user_id)
values ('AUTH-USER-UUID');
```

The seed can be run before or after the first admin is created. It contains operational example data and does not create authentication users.

### Admin authorization

All operational tables have Row Level Security enabled. Their policies call `public.is_admin()` and allow access only when `auth.uid()` exists in `public.admin_users`.

- Anonymous users cannot access operational data.
- Authenticated users without an `admin_users` row see an access-denied screen and remain blocked by RLS.
- Admin users can select, insert, update, and delete operational rows according to the migration policies.
- Resource history is normally retained by deactivating tours, vehicles, and staff rather than deleting referenced rows.

Do not weaken RLS or expose the service-role key to the frontend.

## Commands

```bash
npm run dev      # Start the Vite development server
npm run build    # Type-check and create the production build
npm run lint     # Run Oxlint
npm run preview  # Preview the production build locally
```

Before deployment, run:

```bash
npm run build
npm run lint
git diff --check
```

The production output is written to `dist/`.

## Vercel deployment

The repository includes `vercel.json` with the SPA rewrite required for direct navigation to routes such as `/bookings/:bookingId` and `/schedule`.

1. Push the repository to GitHub, GitLab, or Bitbucket.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Keep the detected framework as **Vite**.
4. Use `npm run build` as the build command and `dist` as the output directory.
5. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under Project Settings → Environment Variables for Production and Preview as appropriate.
6. Deploy and verify login, a direct booking-detail URL, `/schedule?date=YYYY-MM-DD`, printing, and CSV download.

For the production domain, add `bookings.goeast.is` under Project Settings → Domains. Configure the DNS record exactly as Vercel instructs—typically a CNAME for `bookings` pointing to Vercel’s provided target—then wait for DNS and TLS verification.

## Operational checks before broader rollout

- Create one test booking and edit it from another browser session.
- Verify a non-admin authenticated user receives access denied and cannot query tables through the Supabase API.
- Print both day-sheet variants on the printers used by operations.
- Open CSV exports in the spreadsheet software used by the team.
- Confirm production and preview deployments use the intended Supabase project.
