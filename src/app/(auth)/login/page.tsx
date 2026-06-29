import { BookOpenText } from "lucide-react";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { getCurrentAppUser } from "@/lib/auth/session";
import { roleHomePath } from "@/lib/auth/shared";

export default async function LoginPage() {
  const user = await getCurrentAppUser();

  if (user?.isActive) {
    redirect(roleHomePath(user.role));
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
      <div className="mb-8 flex flex-col items-center gap-2">
        <BookOpenText className="size-12 text-primary" />
        <h1 className="text-2xl font-bold text-primary">أقرأ</h1>
        <p className="text-sm text-muted-foreground">
          تطبيق متابعة حلقة تحفيظ القرآن الكريم
        </p>
      </div>

      <LoginForm />
    </div>
  );
}
