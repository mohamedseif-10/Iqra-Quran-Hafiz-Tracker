import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/students/[id]/assignments — full assignment history (admin only)
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
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

  const { data: student } = await admin.from("students").select("id").eq("id", id).maybeSingle();
  if (!student) return Response.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await admin
    .from("teacher_student_assignments")
    .select("id, teacher_id, start_date, end_date, users!teacher_student_assignments_teacher_id_fkey(id, name)")
    .eq("student_id", id)
    .order("start_date", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const history = (data ?? []).map((a) => {
    const u = a.users as unknown as { id: string; name: string } | null;
    return {
      id: a.id,
      teacher_id: a.teacher_id,
      teacher_name: u?.name ?? "",
      start_date: a.start_date,
      end_date: a.end_date,
      is_active: a.end_date === null,
    };
  });

  return Response.json(history);
}
