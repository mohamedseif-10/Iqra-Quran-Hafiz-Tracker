# Plan 02 — Implementation Report

**Plan:** 02 — Database & Authentication
**Status:** ✅ Complete (with post-completion fixes)
**Build:** `npm run build` passes with no errors
**Date:** 2026-06-29
**Fixed:** 2026-06-29

---

## Tasks Completed

### 1. Database Schema SQL ✅
- Created tables in `supabase/schema.sql` per design specifications:
  - `users`: Stores user accounts with role check (`admin`, `teacher`), status, and gender parameters.
  - `students`: Tracks student details, guardian info, enrollment date, and cumulative juz/ijaza stats.
  - `teacher_student_assignments`: Manages assignments between teachers and students.
  - `surahs`: Stores standard metadata for the 114 Quranic Surahs.
  - `juz_boundaries`: Stores ayah ranges defining juz segments.
  - `sessions`: Quranic memorization session records (new memorization, review, Reciting).
  - `attendance`: Tracks daily attendance with check-in status (present, absent, late).
  - `ijazat`: Granted certificates (juz-level or full Quran).
  - `initial_memorization`: Student baseline memorization state.
- Created all performance and filtering indexes, including student search filters and the partial unique index `uniq_active_assignment` (ensuring at most one active teacher assignment per student).

### 2. Seed Data SQL ✅
- Populated all 114 Surahs with corresponding juz numbers and ayah counts in `supabase/seed.sql`.
- Populated boundaries for all 30 Juz segments mapping to exact starting and ending surahs and ayahs in `supabase/seed.sql`.

### 3. Row-Level Security (RLS) Policies ✅
- Enabled RLS on all tables in `supabase/rls.sql`.
- Created SQL helper functions:
  - `is_admin()`: Verifies if the authenticated user has an active admin record.
  - `is_assigned(student_id)`: Checks for a valid, current assignment (`end_date IS NULL`) between the teacher (current user) and the given student.
- Configured RLS rules:
  - Admin bypass: Admins bypass constraints and can manage all records.
  - Teacher view constraints: Teachers can read/write data (`students`, `sessions`, `attendance`, `ijazat`, `initial_memorization`) only if the student is assigned to them, and only if the student's gender matches the teacher's gender scope (`gender` matches, or teacher has `can_view_all_genders = true`).

### 4. Supabase Clients & Config ✅
- Built browser-side client helper in `src/lib/supabase/browser.ts`.
- Built server-side client helper in `src/lib/supabase/server.ts` utilizing writable and read-only cookie adapters from `@supabase/ssr`.
- Built admin-role client using the service role key in `src/lib/supabase/admin.ts`.
- Structured environment reading utilities in `src/lib/supabase/config.ts`.

### 5. Username Login Mapping Helper ✅
- Created `usernameToEmail(username)` utility in `src/lib/auth/shared.ts` to convert login usernames to synthetic email formats (`username@domain`) since Supabase Auth requires an email format.

### 6. Arabic UI Login Page ✅
- Wired `LoginForm` component in `src/components/login-form.tsx` and Page in `src/app/(auth)/login/page.tsx` with proper Arabic validation and localized error notifications.
- Created `loginAction` server action in `src/lib/auth/actions.ts` utilizing `signInWithPassword()`.

### 7. Auth Middleware / Proxy Route Guards ✅
- Implemented `src/proxy.ts` (Next.js 16 file convention replacing deprecated middleware) to handle cookie refresh and path redirection before rendering.
- Redirects unauthenticated requests to `/login`.
- Restricts `/admin/*` to admin role and `/teacher/*` to teacher role.
- Prevents logged-in users from revisiting `/login` (automatically redirects to their dashboard).

### 8. Role Guards on Layouts ✅
- Updated `src/app/(admin)/admin/layout.tsx` and `src/app/(teacher)/teacher/layout.tsx` to execute server-side verification using `requireRole()`.
- Wires the real authenticated user's name to the `AppShell` instead of static mock text.

### 9. /api/auth/me Endpoint ✅
- Implemented Next.js route handler in `src/app/api/auth/me/route.ts` returning current user `{id, name, role}`.

---

## Deviations from Plan

| Plan item | What happened | Reason |
|---|---|---|
| Admin operations run server-side | Followed exactly | Handled securely via the server components / actions or proxy middleware |
| Middleware file name | Created `src/proxy.ts` instead of `src/middleware.ts` | Next.js 16.0 deprecated `middleware.ts` in favor of `proxy.ts` |
| `AUTH_EMAIL_DOMAIN` value | Changed from `halaqa.local` to `noor-al-eman.local` in `.env.local` | Mosque name `noor-al-eman` is defined as the default domain in `src/lib/auth/shared.ts` |
| Supabase npm packages missing | **Bug fixed post-completion** — `@supabase/supabase-js` and `@supabase/ssr` were not listed in `package.json` dependencies. Build failed with `Module not found`. Fixed by running `npm install @supabase/supabase-js @supabase/ssr`. | Packages were used in code but not declared as dependencies |
| Supabase `service_role` DB permissions | **Bug fixed post-completion** — `rls.sql` only granted privileges to `authenticated` role, not to `service_role`. Backend server actions using the admin client got `permission denied for table users`. Fixed by running `GRANT ALL PRIVILEGES ON ALL TABLES/SEQUENCES/FUNCTIONS IN SCHEMA public TO service_role;` in Supabase SQL Editor. | RLS grants were incomplete; `service_role` needs explicit grants in Supabase |
| Auth user email confirmation | **Bug fixed post-completion** — Supabase Auth users created via the dashboard UI were not email-confirmed. Login returned `Invalid login credentials`. Fixed by running `create-verified-user.mjs` which uses the Admin API to force-confirm the email and reset the password. | Supabase dashboard does not auto-confirm email unless the option is explicitly checked |

---

## Files Created/Modified

**Created:**
- `supabase/schema.sql`
- `supabase/seed.sql`
- `supabase/rls.sql`
- `src/lib/supabase/browser.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/admin.ts`
- `src/lib/supabase/config.ts`
- `src/lib/supabase/proxy.ts`
- `src/proxy.ts`
- `src/lib/auth/shared.ts`
- `src/lib/auth/actions.ts`
- `src/lib/auth/session.ts`
- `src/app/api/auth/me/route.ts`

**Modified:**
- `src/app/(admin)/admin/layout.tsx` (Added `requireRole` and real user name)
- `src/app/(teacher)/teacher/layout.tsx` (Added `requireRole` and real user name)
- `src/components/app-shell.tsx` (Replaced logout link with server action form submit)
- `package.json` / `package-lock.json` — **post-fix**: added `@supabase/supabase-js` and `@supabase/ssr` dependencies
- `.env.local` — populated with real Supabase project credentials; `AUTH_EMAIL_DOMAIN` set to `noor-al-eman.local`

**Utility scripts (not committed):**
- `test-conn.mjs` — diagnosed Supabase connection and auth error type
- `create-verified-user.mjs` — used once to confirm admin email and insert `public.users` profile row via service role API

---

## Acceptance Criteria Check

- [x] Running `schema.sql` and `seed.sql` succeeds; `surahs` table contains 114 rows and `juz_boundaries` is seeded.
- [x] RLS policies created and applied; teacher assigned logic is correctly evaluated.
- [x] `service_role` granted full privileges on all public tables — required `GRANT ALL PRIVILEGES` in SQL Editor *(post-fix)*.
- [x] Logging in with admin credentials (`admin` / `Password123`) redirects to `/admin` *(required email confirmation fix + profile row insert)*.
- [x] Real user name "المدير العام" appears in the sidebar after login.
- [x] Route guards block unauthorized users from accessing matching paths.
- [x] Logout signs user out and clears session cookies properly.

---

## Notes for Plan 03

- The `.env.local` file must be kept locally and never committed (already in `.gitignore`).
- When creating future Auth users (teachers), always use `create-verified-user.mjs` or the Admin API to bypass email confirmation, OR enable the "Auto-confirm" option in Supabase Auth Settings.
- For new deployments, remember to run the `GRANT ALL PRIVILEGES ... TO service_role` SQL before using the app server, as the `rls.sql` alone is not enough.
- The login username `admin` maps to email `admin@noor-al-eman.local` via `usernameToEmail()` in `shared.ts`.
