import {
  Users,
  GraduationCap,
  BookOpen,
  BarChart3,
  Award,
  type LucideIcon,
} from "lucide-react";
import type { AppRole } from "@/domain/types";

export type Role = AppRole;

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export const navItems: NavItem[] = [
  {
    label: "التقارير",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    label: "الطلاب",
    href: "/admin/students",
    icon: Users,
  },
  {
    label: "المحفظون",
    href: "/admin/teachers",
    icon: GraduationCap,
    adminOnly: true,
  },
  {
    label: "الإجازات",
    href: "/admin/ijazat",
    icon: BookOpen,
  },
];

export function navItemsForRole(role: Role): NavItem[] {
  return navItems.filter((item) => !item.adminOnly || role === "admin");
}

export function teacherNavItems(): NavItem[] {
  return [
    {
      label: "التقارير",
      href: "/teacher/reports",
      icon: BarChart3,
    },
    { label: "الطلاب", href: "/teacher/students", icon: Users },
    {
      label: "تسجيل جلسة",
      href: "/teacher/session/new",
      icon: BookOpen,
    },
    {
      label: "منح إجازة",
      href: "/teacher/ijazat/new",
      icon: Award,
    },
  ];
}

export function getNavItems(role: Role): NavItem[] {
  return role === "admin" ? navItemsForRole(role) : teacherNavItems();
}
