import "server-only";

import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  roleHomePath,
  type AppRole,
  type AppUser,
} from "@/lib/auth/shared";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

interface AppUserRow {
  id: string;
  name: string;
  username: string;
  role: AppRole;
  is_active: boolean;
}

export async function getAppUserByAuthId(
  supabase: SupabaseClient,
  authUserId: string
): Promise<AppUser | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, username, role, is_active")
    .eq("id", authUserId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const appUser = data as AppUserRow;

  return {
    id: appUser.id,
    name: appUser.name,
    username: appUser.username,
    role: appUser.role,
    isActive: appUser.is_active,
  };
}

export async function getCurrentAppUser(): Promise<AppUser | null> {
  const supabase = await createSupabaseServerComponentClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return getAppUserByAuthId(supabase, user.id);
}

export async function requireRole(requiredRole: AppRole): Promise<AppUser> {
  const user = await getCurrentAppUser();

  if (!user || !user.isActive) {
    redirect("/login");
  }

  if (user.role !== requiredRole) {
    redirect(roleHomePath(user.role));
  }

  return user;
}
