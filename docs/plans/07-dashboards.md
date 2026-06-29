# Plan 07 — Dashboards (Admin + Teacher)

**Goal:** The admin halaqah-wide dashboard (stats, alerts, charts) and the teacher daily
dashboard.

**Depends on:** 05 (needs progress/summary data; reports from 06 are optional links).

**Design references:** §6.8 (admin dashboard), §6.9 (teacher dashboard),
§7 (Admin Dashboard endpoints).

## YOUR ACTIONS (manual)
- None.

## Tasks
### Admin dashboard `/admin` (§6.8)
1. `GET /api/admin/stats`: total active students (split male/female), total teachers, sessions
   this week, attendance rate this week, ratings distribution this month, per-teacher
   (student count + average rating), ijazat granted this month, top 5 students this month.
2. `GET /api/admin/alerts`: students absent ≥ 7 days; students with no session this week.
3. UI: summary cards row, alerts section, charts (daily sessions last 30 days bar; ratings pie;
   per-teacher progress bars), bottom section (ijazat this month, top students). Use a light
   chart lib compatible with the stack (e.g. Recharts).

### Teacher dashboard `/teacher` (§6.9)
4. Header "مرحباً [name]" + Arabic date; quick cards (my students / today's sessions / today's
   attendance); "today's students" list with a quick attendance toggle; last 5 sessions; a
   prominent "تسجيل جلسة جديدة" CTA.

## Acceptance criteria
- Admin dashboard numbers match the underlying data; charts render in RTL with Arabic labels.
- Alerts correctly list absent / session-less students.
- Teacher dashboard shows only that teacher's students and lets them jump into recording fast.

## Notes for the implementer
- Keep dashboard queries efficient; prefer the cached `students` summary columns (Plan 05) and
  simple aggregates over recomputing progress for every student on each load.
