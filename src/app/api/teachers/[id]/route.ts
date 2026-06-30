import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/teachers/[id]
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createSupabaseServerComponentClient();
  if (!supabase) return Response.json({ error: "Config missing" }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: appUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (appUser?.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

  const admin = createSupabaseAdminClient();
  if (!admin) return Response.json({ error: "Config missing" }, { status: 500 });

  const { data: teacher, error } = await admin
    .from("users")
    .select("id, name, username, phone, gender, can_view_all_genders, is_active, created_at")
    .eq("id", id)
    .eq("role", "teacher")
    .maybeSingle();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!teacher) return Response.json({ error: "Not found" }, { status: 404 });

  // Current assigned students
  const { data: assignments } = await admin
    .from("teacher_student_assignments")
    .select("student_id, start_date, students(id, name, gender, memorized_juz_count, is_active)")
    .eq("teacher_id", id)
    .is("end_date", null)
    .order("start_date");

  return Response.json({ teacher, assignments: assignments ?? [] });
}

// PUT /api/teachers/[id] — admin only; update is_active or can_view_all_genders
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createSupabaseServerComponentClient();
  if (!supabase) return Response.json({ error: "Config missing" }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: appUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (appUser?.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const allowedFields = ["is_active", "can_view_all_genders", "name", "phone"];
  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field];
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return Response.json({ error: "Config missing" }, { status: 500 });

  const { data, error } = await admin
    .from("users")
    .update(updates)
    .eq("id", id)
    .eq("role", "teacher")
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
