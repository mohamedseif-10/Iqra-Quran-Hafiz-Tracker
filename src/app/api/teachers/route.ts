import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import { usernameToEmail } from "@/lib/auth/shared";

// GET /api/teachers — admin only
export async function GET() {
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

  const { data, error } = await admin
    .from("users")
    .select("id, name, username, phone, gender, can_view_all_genders, is_active, created_at")
    .eq("role", "teacher")
    .order("name");

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

// POST /api/teachers — admin only; creates auth user + users row
export async function POST(request: NextRequest) {
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
  const { name, username, password, phone, gender, can_view_all_genders } = body;

  if (!name || !username || !password || !gender) {
    return Response.json({ error: "name, username, password, gender are required" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return Response.json({ error: "Config missing" }, { status: 500 });

  const email = usernameToEmail(username);

  // Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return Response.json({ error: authError?.message ?? "Auth creation failed" }, { status: 400 });
  }

  // Create users row (same UUID as auth user)
  const { data: newUser, error: userError } = await admin.from("users").insert({
    id: authData.user.id,
    name,
    username: username.trim().toLowerCase(),
    role: "teacher",
    phone: phone ?? null,
    gender,
    can_view_all_genders: can_view_all_genders ?? false,
    is_active: true,
  }).select().single();

  if (userError) {
    // Roll back auth user
    await admin.auth.admin.deleteUser(authData.user.id);
    return Response.json({ error: userError.message }, { status: 500 });
  }

  return Response.json(newUser, { status: 201 });
}
