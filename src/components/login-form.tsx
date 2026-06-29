"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  initialLoginActionState,
  type LoginActionState,
} from "@/lib/auth/shared";
import { loginAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<LoginActionState, FormData>(
    loginAction,
    initialLoginActionState
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="username" className="text-sm font-medium">
          اسم المستخدم
        </label>
        <Input id="username" name="username" placeholder="أدخل اسم المستخدم" />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          كلمة المرور
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="أدخل كلمة المرور"
        />
      </div>

      {state.errorMessage ? (
        <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {state.errorMessage}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
