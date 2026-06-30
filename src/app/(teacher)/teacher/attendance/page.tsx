import { requireRole } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAssignedStudentIds, todayDateString } from "@/lib/auth/student-access";
import { AttendanceForm } from "@/components/attendance-form";
import type { AttendanceStatus } from "@/components/badges";

export const metadata = { title: "الحضور | أقرأ" };

export default async function TeacherAttendancePage() {
  const user = await requireRole("teacher");

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return <div className="text-destructive">خطأ في الاتصال</div>;
  }

  const today = todayDateString();
  const studentIds = await getAssignedStudentIds(admin, user.id);

  const { data: teacherUser } = await admin
    .from("users")
    .select("gender, can_view_all_genders")
    .eq("id", user.id)
    .maybeSingle();

  let studentsQuery = admin
    .from("students")
    .select("id, name, is_active")
    .in("id", studentIds.length > 0 ? studentIds : ["00000000-0000-0000-0000-000000000000"])
    .order("name");

  if (teacherUser && !teacherUser.can_view_all_genders) {
    studentsQuery = studentsQuery.eq("gender", teacherUser.gender);
  }

  const { data: students } = await studentsQuery;

  const { data: existing } = await admin
    .from("attendance")
    .select("student_id, status, notes")
    .eq("attendance_date", today)
    .eq("teacher_id", user.id)
    .in("student_id", studentIds.length > 0 ? studentIds : ["00000000-0000-0000-0000-000000000000"]);

  const existingRecords = (existing ?? []).map((r) => ({
    student_id: r.student_id,
    status: r.status as AttendanceStatus,
    notes: r.notes,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">الحضور</h2>
        <p className="text-sm text-muted-foreground">تسجيل حضور الطلاب اليومي</p>
      </div>

      <AttendanceForm
        students={students ?? []}
        today={today}
        existingRecords={existingRecords}
      />
    </div>
  );
}
