# Plan 05 — Quran Progress Map, Ijazat & Summary Recalculation

**Goal:** The visual 30-juz progress map computed correctly from `juz_boundaries`, ijazat
management, and the authoritative `recalculateStudentSummary` that keeps the cached student
columns (used by filters) in sync.

**Depends on:** 04.

**Design references:** §4.1.1/§4.4.1 (juz_boundaries), §4.7 (ijazat), §4.8
(initial_memorization), §6.4 (progress map + calc logic), §6.5 (ijazat), §6.1.1 (level), §7.

## YOUR ACTIONS (manual)
- None.

## Tasks
### Progress computation (the core algorithm — implement carefully, §6.4)
1. Implement `computeJuzProgress(studentId)` returning, per juz 1–30:
   `{ juz, coveragePercent, color, hasIjaza }`. Follow §6.4 exactly:
   - Load segments from `juz_boundaries` for the juz; `juz_total_ayahs` = Σ(to−from+1).
   - From `sessions`, **intersect** each session's (surah, from..to) with the juz's segments
     of the same surah; from `initial_memorization`, treat a present juz as fully covered.
   - **UNION** covered ranges per surah before counting (never sum raw lengths).
   - `coverage% = covered / juz_total_ayahs * 100`.
   - Color: green if ijaza (table) or initial `with_ijaza`; else blue if ≥70% and not
     weak-dominant; yellow if some coverage but <70% / ≥30% weak / no session in 30 days;
     gray if zero. (§6.4 table)
2. Add **unit tests** for `computeJuzProgress` covering the key edge cases:
   - A surah spanning multiple juz (e.g. Al-Baqarah across juz 1–3).
   - Overlapping review ranges (coverage must not exceed 100%).
   - A juz fully covered by `initial_memorization`.
   - An ijaza overriding color to green.

### Progress map UI (§6.4)
3. Render the 30-block grid (color + juz number + coverage %). On click, expand to show
   surahs in the juz, per-surah coverage bars, last session date, and the session list.
4. Wire it into the student profile **التقدم** tab; reuse on teacher/admin views.

### Ijazat (§6.5)
5. `/teacher/ijazat/new` and admin `/admin/ijazat`: grant ijaza (type juz/full_quran, juz
   number when type=juz, sheikh name required, date, notes). Enforce who-can-grant rules
   (§6.5): teacher → assigned students; admin → any + historical.
6. `DELETE /api/ijazat/:id` (admin revoke). Show ijazat as badges/cards in the profile
   **الإجازات** tab and on the progress map (green + star).

### Summary recalculation (makes filters authoritative)
7. Implement `recalculateStudentSummary(studentId)`:
   - `memorized_juz_count` = # juz where `computeJuzProgress` color is blue OR green
     (i.e. coverage ≥70% or has ijaza). (matches §4.2 / §6.1.1)
   - `ijaza_juz_count` = # juz with a formal ijaza (full_quran counts as 30).
   - `last_session_date` = max session date.
   - Write these onto the `students` row.
8. Call `recalculateStudentSummary` after every create/update/delete of a session, ijaza, or
   initial_memorization (replace the Plan 04 stub). Backfill all existing students once.

## Acceptance criteria
- The progress map matches hand-checked examples (including Al-Baqarah spanning juz 1–3).
- Coverage never exceeds 100% even with many overlapping review sessions.
- Granting an ijaza turns the juz green and increments `ijaza_juz_count`.
- After recording sessions, `memorized_juz_count` / `last_session_date` update, and the
  Plan 03 list filters by level / juz count reflect the new values.
- Unit tests for `computeJuzProgress` pass.

## Notes for the implementer
- Keep `computeJuzProgress` a pure function (inputs → result) so it is testable and reused by
  both the map and `recalculateStudentSummary`.
- Recalculation should be idempotent and safe to run for one student at a time.
