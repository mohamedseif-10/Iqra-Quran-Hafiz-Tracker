import { NextResponse } from "next/server";

import { getCurrentAppUser } from "@/lib/auth/session";
import type { AuthMeResponse } from "@/lib/auth/shared";

export async function GET() {
  const user = await getCurrentAppUser();

  if (!user || !user.isActive) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body: AuthMeResponse = {
    id: user.id,
    name: user.name,
    role: user.role,
  };

  return NextResponse.json(body);
}
