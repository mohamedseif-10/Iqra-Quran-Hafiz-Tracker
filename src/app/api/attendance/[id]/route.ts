import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import { getApiAppUser, todayDateString } from "@/lib/auth/student-access";
import type { AttendanceStatus } from "@/components/badges";

const VALID_STATUSES: AttendanceStatus[] = ["present", "absent", "late"];

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PUT /api/attendance/[id] — update single record
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createSupabaseServerComponentClient();
  if (!supabase) return Response.json({ error: "Config missing" }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdminClient();
  if (!admin) return Response.json({ error: "Config missing" }, { status: 500 });

  const appUser = await getApiAppUser(admin, user.id);
  if (!appUser || !appUser.is_active) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { data: existing } = await admin
    .from("attendance")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  if (appUser.role === "teacher") {
    if (existing.teacher_id !== appUser.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    if (existing.attendance_date !== todayDateString()) {
      return Response.json({ error: "يمكن للمحفظ تعديل حضور اليوم فقط" }, { status: 403 });
    }
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return Response.json({ error: "حالة حضور غير صالحة" }, { status: 400 });
    }
    updates.status = body.status;
  }
  if (body.notes !== undefined) updates.notes = body.notes;
  if (appUser.role === "admin" && body.attendance_date) {
    updates.attendance_date = body.attendance_date;
  }

  const { data, error } = await admin
    .from("attendance")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
