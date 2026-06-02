
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns a Tailwind bg-color class string based on a progress percentage.
 * Used for budget bars, credit card usage, loans, etc.
 */
export function getProgressColor(progress: number): string {
  if (progress > 85) return "bg-destructive";
  if (progress > 60) return "bg-amber-500";
  return "bg-primary";
}

/**
 * Returns a hex/hsl color string for use in recharts/SVG contexts.
 */
export function getProgressColorHex(progress: number): string {
  if (progress > 85) return "hsl(var(--destructive))";
  if (progress > 60) return "#f59e0b"; // amber-500
  return "hsl(var(--primary))";
}
