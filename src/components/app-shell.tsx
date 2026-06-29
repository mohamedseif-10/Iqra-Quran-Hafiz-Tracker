"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, BookOpenText } from "lucide-react";

import { cn } from "@/lib/utils";
import { type Role, getNavItems } from "@/lib/nav";
import { signOutAction } from "@/lib/auth/actions";

interface AppShellProps {
  role: Role;
  username?: string;
  children: React.ReactNode;
}

export function AppShell({ role, username, children }: AppShellProps) {
  const pathname = usePathname();
  const items = getNavItems(role);
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "أقرأ";

  const isActive = (href: string) =>
    href === `/${role}`
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      {/* Desktop sidebar (right side in RTL) */}
      <aside className="hidden w-60 shrink-0 border-l border-border bg-card md:flex md:flex-col">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <BookOpenText className="size-7 text-primary" />
          <span className="text-xl font-bold text-primary">{appName}</span>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {items.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="size-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="mb-2 flex items-center gap-2 px-3 text-sm text-muted-foreground">
            <span className="font-medium">{username ?? "—"}</span>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
            >
              <LogOut className="size-5 shrink-0" />
              <span>تسجيل الخروج</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
          <h1 className="text-base font-bold">
            {items.find((i) => isActive(i.href))?.label ?? appName}
          </h1>
          <span className="text-sm text-muted-foreground md:hidden">
            {appName}
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-border bg-card md:hidden">
        {items.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
