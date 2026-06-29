# Plan 02 — Database & Authentication

**Goal:** A Supabase project with the full schema, seed data, RLS policies, and a working
username/password login that redirects by role (admin → `/admin`, teacher → `/teacher`).

**Depends on:** 01.

**Design references:** §3 (roles), §4 (all tables), §9 (seeds), §10.2 (Supabase setup + RLS),
§10.3 (env vars).

## YOUR ACTIONS (manual) — do these first
1. Go to https://supabase.com, sign up, and **create a new project** (pick a region near you;
   save the database password).
2. From the project: **Settings → API**, copy and give the agent:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (keep this secret — server only)
3. After the agent provides the schema SQL, you (or the agent, if you grant SQL access) run it
   in **Supabase → SQL Editor**. Then run the seed SQL.
4. Create the **first admin** user: **Auth → Users → Add user** (email + password). Use an
   email like `admin@halaqa.local`. Tell the agent the email so it can insert the matching
   `users` row (role = 'admin').

## Tasks
1. Add the Supabase client setup: a browser client (anon key) and a server client
   (service role key, server-only). Put env vars in `.env.local` (values from YOUR ACTIONS).
2. Write the **schema migration** SQL exactly per §4: tables `users`, `students`,
   `teacher_student_assignments`, `surahs`, `juz_boundaries`, `sessions`, `attendance`,
   `ijazat`, `initial_memorization`, plus all indexes (incl. the student filter indexes and
   the partial unique index `uniq_active_assignment`). Save it as `supabase/schema.sql`.
3. Write the **seed** SQL from §9.0 (114 surahs) and §9.1 (juz_boundaries) →
   `supabase/seed.sql`.
4. **Username login mapping:** Supabase Auth is email-based. Implement a helper that maps a
   username to a synthetic email `"<username>@" + AUTH_EMAIL_DOMAIN` for sign-in and account
   creation. (design §4.1 note, §10.3)
5. Build the **login page** (`/login`): username + password, Arabic UI, friendly Arabic error
   messages. On success, read the user's `role` from the `users` table and redirect.
6. **Auth middleware / route guards:** protect `/admin/*` (admin only) and `/teacher/*`
   (teacher only). Unauthenticated → `/login`. Wire the real role into the Plan 01 sidebar.
7. **RLS policies** per §10.2:
   - Create the SQL helper `is_assigned(student_id)` → true if the current auth user has an
     active assignment row for that student (`end_date IS NULL`).
   - Teachers: SELECT a student's rows (students/sessions/attendance/ijazat/initial_memo) when
     `is_assigned` is true; INSERT/UPDATE only for assigned students; respect gender scoping
     (`can_view_all_genders`).
   - Admin operations run server-side with the service role key.
8. Add a tiny **/api/auth/me** equivalent (server action or route) returning `{id,name,role}`.

## Acceptance criteria
- Running `schema.sql` then `seed.sql` succeeds; `surahs` has 114 rows and `juz_boundaries`
  has all segments.
- Logging in with the admin credentials lands on `/admin`; a teacher account lands on
  `/teacher`.
- Visiting an admin route as a teacher (or logged out) is blocked/redirected.
- RLS verified: a teacher can only read students they are assigned to (test with the SQL
  editor using a teacher's auth context, or via the app once Plan 03 exists).

## Notes for the implementer
- Do NOT expose the service role key to the client/browser bundle.
- Keep the username→email rule in one shared function so login and account creation agree.
- Enforce permissions on the server too; RLS is the safety net, not the only gate.
