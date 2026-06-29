# Plan 03 — Students, Teachers & Assignments

**Goal:** Full management of teachers and students, multi-teacher assignment (add/remove),
gender scoping, initial-memorization capture, and the filterable/paginated student list.

**Depends on:** 02.

**Design references:** §3 (permissions), §4.1–4.3, §4.8, §6.1 (profile), §6.1.1 (list/filters),
§6.10 (assignment), §7 (Students/Teachers/Assignments endpoints).

## YOUR ACTIONS (manual)
- None. (You may optionally create a few real teacher accounts via the UI once it works.)

## Tasks
### Teachers (admin only)
1. `/admin/teachers` list + `/admin/teachers/new` create form: name, username, password,
   phone, **gender** (required), and the `can_view_all_genders` toggle. (§4.1)
2. `/admin/teachers/[id]`: teacher profile + their current students. Allow toggling
   `is_active` and `can_view_all_genders`.
3. On teacher creation, also create the Supabase auth user (synthetic email from username,
   Plan 02 helper) and the `users` row.

### Students
4. `/admin/students/new` (and `/teacher/students/new`): create student — name, gender,
   birth_date, guardian_name, guardian_phone, enrollment_date, notes. (§4.2)
   - **Teacher self-add:** force `gender` = teacher's gender (unless `can_view_all_genders`)
     and auto-create an active assignment to that teacher. (§3.2)
5. **Initial memorization** section in the create/edit form (§6.1 + §4.8): 30-juz grid; each
   checked juz gets status حفظ / إجازة; if إجازة, require sheikh name. Persist to
   `initial_memorization`.
6. `/admin/students/[id]` and `/teacher/students/[id]`: profile per §6.1 (show current
   teacher chips, level badge, memorized/ijaza counts, status, notes). Tabs scaffold:
   التقدم / الجلسات / الحضور / الإجازات (content filled by later plans).
7. `/admin/students/[id]/edit`: edit student info; allow editing notes by an assigned teacher.

### Assignments (multi-teacher)
8. `/admin/assignments` per §6.10: table of students with current teacher chips; "إضافة محفظ"
   adds a new active assignment (gender + duplicate-active guards from §4.3); removing a chip
   sets `end_date = today`.
9. Assignment history view in the student profile (assignments tab).

### List, search & filters (§6.1.1)
10. Implement `GET /api/students` with: `search, gender, level, min_juz, max_juz, has_ijaza,
    age_min, age_max, teacher_id, is_active, last_active_days, sort_by, page`. Role-scope it
    (teacher sees only assigned students). Paginate (page size 25).
11. Build the students list UI with a filter bar (gender, level, juz range, has-ijaza, age
    range, teacher [admin only], status, last-activity) + search box + sort + pagination.
    Derive the **level** label from `memorized_juz_count` using the thresholds in §6.1.1.

## Acceptance criteria
- Admin can create teachers (with gender) and students; a teacher can self-add a same-gender
  student and is auto-assigned to them.
- A student can have two teachers at once; adding a duplicate active teacher is rejected;
  removing one keeps the other and preserves history.
- Gender scoping holds: a male teacher cannot see/add female students unless
  `can_view_all_genders` is on.
- The student list filters and sorts correctly and is paginated; level labels match §6.1.1.
- Initial memorization is saved and visible on the profile.

## Notes for the implementer
- `memorized_juz_count` / `ijaza_juz_count` / `last_session_date` are filled by Plan 05's
  recalculation. For now, initial memorization may seed `memorized_juz_count` (count of juz
  rows) so filters have data; Plan 05 will make it authoritative.
- Enforce gender + role checks on the server, not just in the UI.
