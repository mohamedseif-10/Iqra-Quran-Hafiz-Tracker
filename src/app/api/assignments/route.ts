import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

// GET /api/assignments — active assignments table (admin)
export async function GET() {
  const supabase = await createSupabaseServerComponentClient();
  if (!supabase) return Response.json({ error: "Config missing" }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdminClient();
  if (!admin) return Response.json({ error: "Config missing" }, { status: 500 });

  const { data: appUser } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (appUser?.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await admin
    .from("students")
    .select(
      "id, name, gender, memorized_juz_count, is_active, teacher_student_assignments!inner(id, teacher_id, start_date, end_date, users!teacher_student_assignments_teacher_id_fkey(id, name))"
    )
    .is("teacher_student_assignments.end_date", null)
    .order("name");

  // Also include students with NO active assignments (for admin to assign)
  const { data: allStudents } = await admin
    .from("students")
    .select("id, name, gender, memorized_juz_count, is_active")
    .order("name");

  // Fetch all active assignments grouped
  const { data: allAssignments } = await admin
    .from("teacher_student_assignments")
    .select("id, teacher_id, student_id, start_date, users!teacher_student_assignments_teacher_id_fkey(id, name)")
    .is("end_date", null);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Build map: student_id -> [teachers]
  const assignmentMap: Record<string, Array<{ id: string; teacher_id: string; teacher_name: string; start_date: string }>> = {};
  for (const a of allAssignments ?? []) {
    if (!assignmentMap[a.student_id]) assignmentMap[a.student_id] = [];
    const u = a.users as unknown as { id: string; name: string } | null;
    assignmentMap[a.student_id].push({
      id: a.id,
      teacher_id: a.teacher_id,
      teacher_name: u?.name ?? "",
      start_date: a.start_date,
    });
  }

  const result = (allStudents ?? []).map((s) => ({
    ...s,
    teachers: assignmentMap[s.id] ?? [],
  }));

  return Response.json(result);
}

// POST /api/assignments — add a teacher to a student (admin only)
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerComponentClient();
  if (!supabase) return Response.json({ error: "Config missing" }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdminClient();
  if (!admin) return Response.json({ error: "Config missing" }, { status: 500 });

  const { data: appUser } = await admin
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (appUser?.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { teacher_id, student_id } = body;
  if (!teacher_id || !student_id) {
    return Response.json({ error: "teacher_id and student_id required" }, { status: 400 });
  }

  // Gender guard: teacher gender must match student gender (unless can_view_all_genders)
  const { data: teacher } = await admin
    .from("users")
    .select("id, gender, can_view_all_genders, is_active")
    .eq("id", teacher_id)
    .eq("role", "teacher")
    .maybeSingle();

  const { data: student } = await admin
    .from("students")
    .select("id, gender")
    .eq("id", student_id)
    .maybeSingle();

  if (!teacher || !student) return Response.json({ error: "Teacher or student not found" }, { status: 404 });
  if (!teacher.is_active) return Response.json({ error: "Teacher is inactive" }, { status: 400 });

  if (!teacher.can_view_all_genders && teacher.gender !== student.gender) {
    return Response.json({ error: "Gender mismatch — teacher cannot be assigned to student of different gender" }, { status: 400 });
  }

  // Duplicate-active guard (unique index handles it at DB level, but give a friendly error)
  const { data: existing } = await admin
    .from("teacher_student_assignments")
    .select("id")
    .eq("teacher_id", teacher_id)
    .eq("student_id", student_id)
    .is("end_date", null)
    .maybeSingle();

  if (existing) {
    return Response.json({ error: "هذا المحفظ مسند لهذا الطالب بالفعل" }, { status: 409 });
  }

  const { data, error } = await admin
    .from("teacher_student_assignments")
    .insert({
      teacher_id,
      student_id,
      start_date: new Date().toISOString().split("T")[0],
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}
