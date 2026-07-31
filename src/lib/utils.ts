import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a Date as a YYYY-MM-DD string (A4: single source for this pattern). */
export function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Today's date as a YYYY-MM-DD string, in the Africa/Cairo timezone.
 * Uses en-CA locale which outputs ISO-style dates (YYYY-MM-DD).
 */
export function todayDateString(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
}
