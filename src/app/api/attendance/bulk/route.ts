import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import {
  canAccessStudent,
  getApiAppUser,
  todayDateString,
} from "@/lib/auth/student-access";
import type { AttendanceStatus } from "@/components/badges";

const VALID_STATUSES: AttendanceStatus[] = ["present", "absent", "late"];

interface BulkRecord {
  student_id: string;
  status: AttendanceStatus;
  notes?: string | null;
}

// POST /api/attendance/bulk — upsert attendance for one day
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerComponentClient();
  if (!supabase) return Response.json({ error: "Config missing" }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdminClient();
  if (!admin) return Response.json({ error: "Config missing" }, { status: 500 });

  const appUser = await getApiAppUser(admin, user.id);
  if (!appUser || !appUser.is_active) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (appUser.role !== "teacher" && appUser.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const attendanceDate: string = body.attendance_date ?? todayDateString();
  const records: BulkRecord[] = Array.isArray(body.records) ? body.records : [];

  if (records.length === 0) {
    return Response.json({ error: "لا توجد سجلات حضور" }, { status: 400 });
  }

  // Teachers may only submit for today
  if (appUser.role === "teacher" && attendanceDate !== todayDateString()) {
    return Response.json({ error: "يمكن للمحفظ تعديل حضور اليوم فقط" }, { status: 403 });
  }

  for (const rec of records) {
    if (!rec.student_id || !VALID_STATUSES.includes(rec.status)) {
      return Response.json({ error: "بيانات حضور غير صالحة" }, { status: 400 });
    }
    if (!(await canAccessStudent(admin, appUser, rec.student_id))) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const rows = records.map((rec) => ({
    student_id: rec.student_id,
    teacher_id: appUser.id,
    attendance_date: attendanceDate,
    status: rec.status,
    notes: rec.notes ?? null,
  }));

  const { data, error } = await admin
    .from("attendance")
    .upsert(rows, { onConflict: "student_id,attendance_date" })
    .select();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}
