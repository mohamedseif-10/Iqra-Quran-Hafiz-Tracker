# Plan 03 — Implementation Report

**Plan:** 03 — Students, Teachers & Assignments
**Status:** ✅ Complete (with post-completion fixes)
**Build:** `npm run build` passes with no errors
**Date:** 2026-06-29
**Fixed:** 2026-06-29

---

## Tasks Completed

### 1. Teachers List + Create Form ✅
- `/admin/teachers` — table listing all teachers with name, username, gender, phone, active student count, and active/inactive status badge.
- `/admin/teachers/new` — create form with name, username, password, phone, gender (required), and `can_view_all_genders` toggle.
- `POST /api/teachers` — creates Supabase Auth user + `users` row; rolls back Auth user if DB insert fails.

### 2. Teacher Profile + Toggles ✅
- `/admin/teachers/[id]` — teacher info card (username, phone, gender, join date) and current assigned students table with links to student profiles.
- `teacher-profile-actions.tsx` — client toggles for `is_active` and `can_view_all_genders`.
- `PUT /api/teachers/[id]` — admin-only update of toggle fields.

### 3. Supabase Auth on Teacher Creation ✅
- Uses `usernameToEmail()` from Plan 02 (`src/lib/auth/shared.ts`).
- `admin.auth.admin.createUser()` with `email_confirm: true`.
- Same UUID used for Auth user and `public.users` row.

### 4. Student Create (Admin + Teacher Self-Add) ✅
- `/admin/students/new` and `/teacher/students/new` — shared `NewStudentForm` component.
- Fields: name, gender, birth_date, guardian_name, guardian_phone, enrollment_date, notes.
- **Teacher self-add:** UI forces gender when `!can_view_all_genders`; server rejects gender mismatch; auto-creates active `teacher_student_assignments` row on `POST /api/students`.
- `POST /api/students` — role-scoped; validates required fields and gender rules.

### 5. Initial Memorization (Create + Edit) ✅
- `InitialMemorizationGrid` — 30-juz grid with حفظ / إجازة status; sheikh name required for إجازة (client + server validation).
- Create: collapsible section in `NewStudentForm`; persists to `initial_memorization`; seeds `memorized_juz_count` and `ijaza_juz_count`.
- Edit (admin): same grid in `EditStudentForm`; `PUT /api/students/[id]` replaces `initial_memorization` rows and recalculates counts.
- Profile: read-only grid shown in **التقدم** tab when data exists.
- Helpers in `src/lib/students.ts`: `countsFromInitialMemorization()`, `validateInitialMemorization()`.

### 6. Student Profiles + Tabs ✅
- `/admin/students/[id]` and `/teacher/students/[id]` — full profile per §6.1:
  - Guardian info, age, enrollment date, notes
  - Level badge, memorized/ijaza counts, progress bar
  - Current teacher chips
- `StudentProfileTabs` — interactive tabs: التقدم / الجلسات / الحضور / الإجازات (+ الإسناد for admin).
- Teacher route enforces assignment + gender scoping (404 if unauthorized).
- Sessions / attendance / ijazat tabs show placeholders for Plan 04–05.

### 7. Student Edit (Admin + Teacher Notes) ✅
- `/admin/students/[id]/edit` — full edit form (all fields + initial memorization + `is_active` toggle).
- `/teacher/students/[id]/edit` — **notes only**; message explains other fields require admin.
- `PUT /api/students/[id]` — admin can update all fields + `initial_memorization`; teacher restricted to `notes` only with assignment + gender guards.

### 8. Assignments Page (Add / Remove) ✅
- `/admin/assignments` — table of active students with current teacher chips, search, add-teacher modal, remove chip (sets `end_date = today`).
- `POST /api/assignments` — gender guard + duplicate-active rejection (409 Arabic message).
- `POST /api/assignments/[id]/end` — admin-only; sets `end_date` to today.
- `AssignmentsClient` — gender-filtered teacher picker; eligible teachers exclude already-assigned.

### 9. Assignment History on Student Profile ✅
- `GET /api/students/[id]/assignments` — admin-only; returns full history (active + ended).
- Admin student profile **الإسناد** tab — table with teacher name (linked), start date, end date, active/ended status.

### 10. `GET /api/students` API ✅
- Query params: `search`, `gender`, `level`, `min_juz`, `max_juz`, `has_ijaza`, `age_min`, `age_max`, `teacher_id`, `is_active`, `last_active_days`, `last_activity`, `sort_by`, `page`.
- Page size 25; role-scoped (teacher sees assigned students only + gender filter).
- `teacher_id` filter admin-only.
- Level thresholds via `getLevelInfo()` in `src/lib/students.ts` (0–4 مبتدئ, 5–14 متوسط, 15–29 متقدم, 30 خاتم).
- `last_activity`: `7`, `30`, or `inactive` (no session in 30+ days or null).

### 11. Students List UI ✅
- `StudentsListClient` — shared by admin and teacher list pages.
- Search (debounced 400ms), sort dropdown, collapsible filter panel.
- Filters: gender, level, status, has_ijaza, teacher (admin only), juz range (min/max), age range (min/max), last activity.
- Pagination (25/page) with Arabic page indicator.
- `LevelBadge` component for derived level labels.

---

## Deviations from Plan

| Plan item | What happened | Reason |
|---|---|---|
| Button label "إضافة محفظ" | Implemented as "إسناد محفظ" | Minor Arabic wording difference; same functionality |
| Assignments page shows all students | Only **active** students (`is_active: true`) | Practical default for assignment management |
| Tab buttons non-interactive (initial) | Replaced with interactive `StudentProfileTabs` | Completed during Plan 03 finish pass |
| `last_active_days` only in API | Added `last_activity` param with `inactive` option | Design §6.1.1 specifies inactive filter; cleaner UX than raw day count |
| `memorized_juz_count` authoritative source | Seeded from initial memorization on create/edit | Per plan note; Plan 05 will make session-based recalculation authoritative |
| Teacher edit initially allowed all fields | **Fixed** — restricted to notes only (UI + server) | Plan task 7 specifies notes-only for assigned teachers |

---

## Bugs Fixed During Implementation

| Bug | Symptom | Fix |
|---|---|---|
| Server Component passing `onChange` to Client Component | Student profile crashed after create: "Event handlers cannot be passed to Client Component props" | Made `onChange` optional when `readOnly` on `InitialMemorizationGrid`; removed noop handler from server pages |
| Ambiguous `users` FK join on assignments | Assignment saved in DB but UI showed "no teacher assigned"; duplicate assign returned 409 | Disambiguated join to `users!teacher_student_assignments_teacher_id_fkey(id, name)` in all assignment queries |
| Search icon overlapping placeholder text (RTL) | Magnifying glass covered Arabic placeholder in search bars | Icon: `start-3`; input: `!ps-9` (logical padding overrides `.input-field` shorthand) |

---

## Files Created/Modified

**Created:**
- `src/app/(admin)/admin/teachers/new/page.tsx`
- `src/app/(admin)/admin/teachers/[id]/page.tsx`
- `src/app/(admin)/admin/teachers/[id]/teacher-profile-actions.tsx`
- `src/app/(admin)/admin/students/new/page.tsx`
- `src/app/(admin)/admin/students/[id]/page.tsx`
- `src/app/(admin)/admin/students/[id]/edit/page.tsx`
- `src/app/(admin)/admin/students/[id]/edit/edit-student-form.tsx`
- `src/app/(admin)/admin/students/students-list-client.tsx`
- `src/app/(admin)/admin/assignments/assignments-client.tsx`
- `src/app/(teacher)/teacher/students/new/page.tsx`
- `src/app/(teacher)/teacher/students/[id]/page.tsx`
- `src/app/(teacher)/teacher/students/[id]/edit/page.tsx`
- `src/app/api/teachers/route.ts`
- `src/app/api/teachers/[id]/route.ts`
- `src/app/api/students/route.ts`
- `src/app/api/students/[id]/route.ts`
- `src/app/api/students/[id]/assignments/route.ts`
- `src/app/api/assignments/route.ts`
- `src/app/api/assignments/[id]/end/route.ts`
- `src/components/new-student-form.tsx`
- `src/components/initial-memorization-grid.tsx`
- `src/components/level-badge.tsx`
- `src/components/student-profile-tabs.tsx`
- `src/lib/students.ts`

**Modified:**
- `src/app/(admin)/admin/teachers/page.tsx` — real teacher list with student counts
- `src/app/(admin)/admin/students/page.tsx` — wired to `StudentsListClient`
- `src/app/(admin)/admin/assignments/page.tsx` — real assignments data + client
- `src/app/(teacher)/teacher/students/page.tsx` — wired to `StudentsListClient`
- `src/app/globals.css` — shared form primitives (`.input-field`, `.btn-primary`, etc.)

**Utility scripts (not committed):**
- `test-conn.mjs` — used to diagnose Supabase connection and ambiguous FK join error
- `create-verified-user.mjs` — from Plan 02; reused for test accounts

---

## Acceptance Criteria Check

- [x] Admin can create teachers (with gender) and students
- [x] Teacher can self-add a same-gender student and is auto-assigned to them
- [x] A student can have two teachers at once
- [x] Adding a duplicate active teacher is rejected (409)
- [x] Removing one teacher keeps the other and preserves history (`end_date` set; visible in الإسناد tab)
- [x] Gender scoping enforced on list, create, profile, assignments, and teacher edit
- [x] Student list filters, sorts, and paginates correctly; level labels match §6.1.1
- [x] Initial memorization saved on create, editable on admin edit, visible on profile
- [x] `npm run build` passes

---

## Notes for Plan 04

- Profile tabs **الجلسات** and **الحضور** are scaffolded with placeholders — Plan 04 fills these.
- `memorized_juz_count` / `ijaza_juz_count` / `last_session_date` are seeded from initial memorization for now; Plan 05 recalculation will make session data authoritative.
- When joining `teacher_student_assignments` to `users`, always use the disambiguated FK: `users!teacher_student_assignments_teacher_id_fkey` (table has both `teacher_id` and `created_by` FKs to `users`).
- Pass serializable props only from Server Components to Client Components — never pass functions like `onChange` from server pages; use `readOnly` mode or move interactivity into a Client Component.
- `StudentsListClient` is shared between admin and teacher routes via `role` prop — teacher list is pre-scoped by API.
