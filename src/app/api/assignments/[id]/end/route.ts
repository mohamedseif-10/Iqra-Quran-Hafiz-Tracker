import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/assignments/[id]/end — set end_date = today (remove teacher from student)
export async function POST(_req: NextRequest, { params }: RouteContext) {
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

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await admin
    .from("teacher_student_assignments")
    .update({ end_date: today })
    .eq("id", id)
    .is("end_date", null)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data) return Response.json({ error: "Assignment not found or already ended" }, { status: 404 });

  return Response.json(data);
}
