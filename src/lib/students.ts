/** Level thresholds per §6.1.1 */
export type Level = "beginner" | "intermediate" | "advanced" | "completed";

export interface LevelInfo {
  level: Level;
  label: string;
}

export function getLevelInfo(memorizedJuzCount: number): LevelInfo {
  if (memorizedJuzCount >= 30) return { level: "completed", label: "خاتم" };
  if (memorizedJuzCount >= 15) return { level: "advanced", label: "متقدم" };
  if (memorizedJuzCount >= 5) return { level: "intermediate", label: "متوسط" };
  return { level: "beginner", label: "مبتدئ" };
}

export function countsFromInitialMemorization(
  rows: Array<{ status: string }>
): { memorized_juz_count: number; ijaza_juz_count: number } {
  return {
    memorized_juz_count: rows.length,
    ijaza_juz_count: rows.filter((r) => r.status === "with_ijaza").length,
  };
}

export function validateInitialMemorization(
  rows: Array<{ juz_number: number; status: string; sheikh_name?: string | null }>
): string | null {
  for (const row of rows) {
    if (row.status === "with_ijaza" && !row.sheikh_name?.trim()) {
      return `يرجى إدخال اسم الشيخ للجزء ${row.juz_number}`;
    }
  }
  return null;
}

/** Plan 05 will implement full recalculation; stub updates last_session_date only. */
export async function recalculateStudentSummary(
  admin: import("@supabase/supabase-js").SupabaseClient,
  studentId: string
): Promise<void> {
  const { data: latest } = await admin
    .from("sessions")
    .select("session_date")
    .eq("student_id", studentId)
    .order("session_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  await admin
    .from("students")
    .update({ last_session_date: latest?.session_date ?? null })
    .eq("id", studentId);
}

export const levelBgMap: Record<Level, string> = {
  completed: "bg-[#dcfce7] text-[#166534]",
  advanced: "bg-[#dbeafe] text-[#1e40af]",
  intermediate: "bg-[#fef9c3] text-[#854d0e]",
  beginner: "bg-[#f3f4f6] text-[#374151]",
};
