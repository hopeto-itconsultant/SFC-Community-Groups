# SFC Community Groups

Mobile-first app for Community Groups management and reporting, on Next.js and Supabase (database, logins and photo storage).
The `prototype` branch keeps the original static demo and its dummy data for reference.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000 and sign in with a mobile number and password. To try it on a phone on the same Wi-Fi, run `npm run dev -- -H 0.0.0.0` and open `http://<your-computer-ip>:3000`.

## Database (Supabase)

One-time setup (needs the [Supabase CLI](https://supabase.com/docs/guides/cli)):

1. Create a Supabase project for development (and a separate one for production).
2. Copy `.env.example` to `.env.local` and fill in the dev project's URL and keys.
3. `supabase login` (with the account that owns the project) then `supabase link --project-ref <dev-project-ref>`.
4. `npm run db:push` – applies the migrations in `supabase/migrations/`.
5. `npm run create-admin` – creates the first Admin login (name, mobile number, password). Runs once.
6. `npm run import-groups` – optional: imports the real groups, leader rosters and group photos from the prototype (`data/groups.ts`, `data/users.ts`, `public/groups/`). Runs once, into an empty database.
7. `npm run db:types` – regenerates `lib/database.types.ts` from the linked database. Re-run after every schema change.

Change the schema only through new migrations (`supabase migration new <name>`), never by editing tables in the dashboard.

## Logins

Everyone signs in with their mobile number and a password; there are no SMS codes. The Admin creates logins in the app: **Groups > a group > Leaders & logins**, where they can add a leader or assistant leader, set up their login (a readable password is suggested) and reset a forgotten password.

## Rules

- **Fellowship reports:** up to 3 photos, and the fellowship date must be within the last 7 days.
- **Groups:** Admin can add a group, and can close a group instead of deleting it (its past reports are kept). Admin and the group's leaders can edit the group's profile and photo; only Admin changes how often it meets.
- **Next fellowship plans:** Admin and the group's leaders can edit or cancel an upcoming plan from its detail page.
- **Access:** leaders and assistant leaders see only their own group; the Admin sees everything. This is enforced by the database's access rules (`supabase/migrations/*_access_rules.sql`), not only by the screens.

## Where things live

- `lib/data-access.ts` – all reads from Supabase, used by Server Components; `lib/report-rules.ts` – pure rules shared with Client Components
- `lib/actions/` – Server Actions for everything that saves (sign in/out, reports, groups, leaders and logins)
- `lib/auth.ts` – the signed-in user; `proxy.ts` – keeps the login session fresh and sends signed-out visitors to the login page
- `app/photos/` – serves private photos from Supabase Storage to signed-in users who may see them
- `components/PhotoPicker.tsx` + `lib/compress-image.ts` – photo selection; photos are resized (and HEIC converted) in the browser before upload
- `supabase/migrations/` – database schema; `scripts/` – `create-admin` and `import-groups`
- `app/(app)/` – signed-in screens (Home, My Group, Groups, Reports, New Report forms, More), plus Add Group (`groups/new`), Edit Group (`groups/[id]/edit`), Leaders & logins (`groups/[id]/people`) and Edit Plan (`reports/[id]/edit`)

## Your assets

- **Logo:** replace `public/brand/logo.jpg` (or change `LOGO_SRC` in `lib/brand.ts`).
- **Group photos:** upload them in the app (Edit Group). `public/groups/` only holds the photos used by `npm run import-groups`.
- **HEIC photos (iPhone):** the app converts them on upload. For `public/groups/`, run `npm run images` to convert `.heic` files there to JPGs.
