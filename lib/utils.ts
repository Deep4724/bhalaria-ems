import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility to merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility to calculate duration from time strings
// lib/utils.ts
export function calculateDuration(clockIn: string, clockOut: string): string {
  try {
    const [inHours, inMinutes] = clockIn.split(":").map(Number);
    const [outHours, outMinutes] = clockOut.split(":").map(Number);

    const start = new Date();
    start.setHours(inHours, inMinutes, 0, 0);
    const end = new Date();
    end.setHours(outHours, outMinutes, 0, 0);

    const diff = (end.getTime() - start.getTime()) / 60000; // difference in minutes
    if (diff < 0) return "Invalid";

    const h = Math.floor(diff / 60);
    const m = Math.floor(diff % 60);
    return `${h}h ${m}m`;
  } catch {
    return "-";
  }
}
