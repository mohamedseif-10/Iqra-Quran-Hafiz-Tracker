# Plan 04 — Sessions & Attendance

**Goal:** Teachers record daily memorization sessions and daily attendance for their assigned
students, with a fast, low-tap mobile-friendly UI.

**Depends on:** 03.

**Design references:** §4.5 (sessions), §4.6 (attendance), §6.2 (session recording),
§6.3 (attendance), §7 (Sessions/Attendance endpoints), §8.0 (UX), §8.6 (forms).

## YOUR ACTIONS (manual)
- None.

## Tasks
### Session recording (§6.2)
1. `/teacher/session/new` form following the exact flow in §6.2:
   student dropdown (assigned only) → date (default today) → type buttons
   (حفظ جديد / مراجعة / تسميع) → searchable surah dropdown (`٣٦ - يس`) → from/to ayah numeric
   inputs → **live Arabic preview** ("سورة يس من الآية ٢٠ إلى الآية ٣٥") → rating buttons
   (ممتاز / جيد / ضعيف) → notes → save.
2. Validation (§6.2): required fields; `from_ayah ≤ to_ayah`; `to_ayah ≤ surah.total_ayahs`;
   Arabic error messages.
3. `POST /api/sessions` (create), plus `PUT`/`DELETE` (own session or admin). On any
   create/update/delete, **trigger the student summary recalculation hook** (implemented in
   Plan 05 — call a stub now named `recalculateStudentSummary(studentId)` and wire it fully in 05).
4. Session history: fill the **الجلسات** tab on the student profile (date, type badge, surah +
   ayah range, rating badge, notes) with filters (type, date range). Use
   `GET /api/students/:id/sessions`.
5. Remember the **last surah used per student** to prefill next time (§8.0 sensible defaults).

### Attendance (§6.3)
6. `/teacher/attendance`: single screen listing all assigned students for today; per student a
   large 3-state toggle حاضر / غائب / متأخر (default حاضر); optional per-student note; one
   "حفظ الكل" button. (`POST /api/attendance/bulk`)
7. Business rules (§6.3): one row per student per day (upsert on `(student_id, date)`); teacher
   may edit **today only**; admin may edit any date (`PUT /api/attendance/:id`).
8. Fill the **الحضور** tab on the student profile: history + attendance-rate stats.

## Acceptance criteria
- A teacher records a session in ≤ 5 taps; the live preview and validation work in Arabic.
- Sessions appear immediately in the student's الجلسات tab with correct badges.
- Attendance for the whole group is submitted from one screen; re-submitting today updates
  (not duplicates); past dates are locked for teachers.
- `GET /api/sessions` and attendance endpoints are role-scoped (assigned students only).

## Notes for the implementer
- Surah list and ayah maxima come from the `surahs` table seeded in Plan 02.
- Do not compute the juz progress here — that is Plan 05. Just store sessions accurately.
