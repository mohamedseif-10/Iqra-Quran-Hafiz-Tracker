import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

// GET /api/surahs — all 114 surahs for dropdowns
export async function GET() {
  const supabase = await createSupabaseServerComponentClient();
  if (!supabase) return Response.json({ error: "Config missing" }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdminClient();
  if (!admin) return Response.json({ error: "Config missing" }, { status: 500 });

  const { data, error } = await admin
    .from("surahs")
    .select("id, name_arabic, juz_number, total_ayahs")
    .order("id");

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data ?? []);
}
