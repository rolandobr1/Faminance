import { PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-lg font-semibold font-headline text-primary whitespace-nowrap",
        className
      )}
    >
      <PiggyBank className="h-6 w-6" />
      <span>Faminance</span>
    </div>
  );
}
