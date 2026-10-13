# SFC Community Groups – Prototype

Mobile-first UI prototype for Community Groups management and reporting.
No database, no real login: all data is static mock data, and submitted forms are shown back but not saved.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000. To try it on a phone on the same Wi-Fi, run `npm run dev -- -H 0.0.0.0` and open `http://<your-computer-ip>:3000`.

## Database (Supabase)

The live app is being built on `main`. The screens still use the mock data; the database below is set up but not used by the app yet. The database starts empty; the `prototype` branch keeps the original static demo and its dummy data for reference.

One-time setup (needs the [Supabase CLI](https://supabase.com/docs/guides/cli)):

1. Create a Supabase project for development (and a separate one for production).
2. Copy `.env.example` to `.env.local` and fill in the dev project's URL and keys.
3. `supabase login` (with the account that owns the project) then `supabase link --project-ref <dev-project-ref>`.
4. `npm run db:push` – applies the migrations in `supabase/migrations/`.
5. `npm run create-admin` – creates the first Admin login (name, mobile number with country code, password). Runs once; the Admin adds everyone else from the app.
6. `npm run db:types` – regenerates `lib/database.types.ts` from the linked database. Re-run after every schema change.

Change the schema only through new migrations (`supabase migration new <name>`), never by editing tables in the dashboard.

## Demo users

Pick any user on the login screen: Admin, every group leader, and every assistant leader.

## Prototype rules

- **Meeting frequency:** Men's meets monthly; every other group meets every 2 months. Fixed in `data/groups.ts` for now; Admin will be able to change it in the live version.
- **Fellowship reports:** up to 3 photos, and the fellowship date must be within the last 7 days.
- **Groups:** Admin can add a group, and can close a group instead of deleting it (its past reports are kept). Admin and the group's leaders can edit the group's profile and photo.
- **Next fellowship plans:** Admin and the group's leaders can edit or cancel an upcoming plan from its detail page.
- None of these changes are saved: each screen shows the result with a "Prototype: not saved" note.

## Where things live

- `data/` – mock data (`groups.ts`, `users.ts`, `reports.ts`) and types (`types.ts`)
- `lib/data-access.ts` – the only place screens read data from; replace with Supabase queries later
- `components/PhotoPicker.tsx` – photo selection/preview; swap in Supabase Storage upload later
- `supabase/migrations/` – database schema; `scripts/create-admin.mjs` – creates the first Admin login
- `app/(app)/` – signed-in screens (Home, My Group, Groups, Reports, New Report forms, More), plus Add Group (`groups/new`), Edit Group (`groups/[id]/edit`) and Edit Plan (`reports/[id]/edit`)

## Your assets

- **Logo:** replace `public/brand/logo.jpg` (or change `LOGO_SRC` in `lib/brand.ts`).
- **Group photos:** put files in `public/groups/` named by group id (e.g. `womens-cg.jpg`) and set `photo: "/groups/womens-cg.jpg"` on the group in `data/groups.ts`. Groups without a photo show initials.
- **HEIC photos (iPhone):** drop `.heic` files into `public/groups/` and run `npm run images`. They are converted to resized JPGs (most browsers can't show HEIC) and the originals are moved to `assets-source/groups/`.
