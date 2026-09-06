"use server";

import { redirect } from "next/navigation";

import {
  roleHomePath,
  usernameToEmail,
  type LoginActionState,
} from "@/lib/auth/shared";
import { getAppUserByAuthId } from "@/lib/auth/session";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return {
      errorMessage: "من فضلك أدخل اسم المستخدم وكلمة المرور.",
    };
  }

  const supabase = await createSupabaseServerActionClient();

  if (!supabase) {
    return {
      errorMessage: "إعدادات Supabase غير مكتملة. أضف القيم إلى ملف .env.local أولاً.",
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });

  if (error || !data.user) {
    return {
      errorMessage: "اسم المستخدم أو كلمة المرور غير صحيحين.",
    };
  }

  const appUser = await getAppUserByAuthId(supabase, data.user.id);

  if (!appUser) {
    await supabase.auth.signOut();
    return {
      errorMessage: "تم تسجيل الدخول لكن لا يوجد ملف مستخدم مرتبط بهذا الحساب.",
    };
  }

  if (!appUser.isActive) {
    await supabase.auth.signOut();
    return {
      errorMessage: "هذا الحساب غير نشط حالياً.",
    };
  }

  redirect(roleHomePath(appUser.role));
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerActionClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/login");
}
