import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import { getApiAppUser, getAssignedStudentIds, todayDateString } from "@/lib/auth/student-access";
import type { AttendanceStatus } from "@/components/badges";

const VALID_STATUSES: AttendanceStatus[] = ["present", "absent", "late"];

// GET /api/attendance — list with date range filter
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerComponentClient();
  if (!supabase) return Response.json({ error: "Config missing" }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdminClient();
  if (!admin) return Response.json({ error: "Config missing" }, { status: 500 });

  const appUser = await getApiAppUser(admin, user.id);
  if (!appUser || !appUser.is_active) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? todayDateString();
  const dateFrom = searchParams.get("date_from") ?? date;
  const dateTo = searchParams.get("date_to") ?? date;

  let query = admin
    .from("attendance")
    .select("id, student_id, teacher_id, attendance_date, status, notes, students(id, name)")
    .gte("attendance_date", dateFrom)
    .lte("attendance_date", dateTo)
    .order("attendance_date", { ascending: false });

  if (appUser.role === "teacher") {
    const ids = await getAssignedStudentIds(admin, appUser.id);
    if (ids.length === 0) return Response.json([]);
    query = query.in("student_id", ids).eq("teacher_id", appUser.id);
  }

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data ?? []);
}
