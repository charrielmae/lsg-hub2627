import * as React from "react";
import { cn } from "@/lib/utils";

export function CcislsgCrest({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative inline-flex h-12 w-12 items-center justify-center rounded-xl border border-ccis-ink/20 bg-gradient-to-br from-ccis-primary via-ccis-secondary to-ccis-orange shadow-sm",
        className
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        className="h-7 w-7 text-ccis-ink"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 4L33 11.5V28.5L20 36L7 28.5V11.5L20 4Z"
          fill="#FBF4C3"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M20 10L27.5 14.3V25.7L20 30L12.5 25.7V14.3L20 10Z"
          fill="#FAC864"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle cx="20" cy="20" r="3.5" fill="#FF8113" />
      </svg>
    </div>
  );
}
