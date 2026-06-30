import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export interface ApiAppUser {
  id: string;
  role: "admin" | "teacher";
  gender: string;
  can_view_all_genders: boolean;
  is_active: boolean;
}

export async function getApiAppUser(
  admin: SupabaseClient,
  authUserId: string
): Promise<ApiAppUser | null> {
  const { data } = await admin
    .from("users")
    .select("id, role, gender, can_view_all_genders, is_active")
    .eq("id", authUserId)
    .maybeSingle();
  return data as ApiAppUser | null;
}

export async function getAssignedStudentIds(
  admin: SupabaseClient,
  teacherId: string
): Promise<string[]> {
  const { data } = await admin
    .from("teacher_student_assignments")
    .select("student_id")
    .eq("teacher_id", teacherId)
    .is("end_date", null);
  return (data ?? []).map((a) => a.student_id);
}

export async function canAccessStudent(
  admin: SupabaseClient,
  appUser: ApiAppUser,
  studentId: string
): Promise<boolean> {
  const { data: student } = await admin
    .from("students")
    .select("id, gender")
    .eq("id", studentId)
    .maybeSingle();

  if (!student) return false;
  if (appUser.role === "admin") return true;

  if (!appUser.can_view_all_genders && student.gender !== appUser.gender) {
    return false;
  }

  const { data: assign } = await admin
    .from("teacher_student_assignments")
    .select("id")
    .eq("teacher_id", appUser.id)
    .eq("student_id", studentId)
    .is("end_date", null)
    .maybeSingle();

  return !!assign;
}

export function todayDateString(): string {
  return new Date().toISOString().split("T")[0];
}
