import * as React from "react";
import { cn } from "@/lib/utils";

export function CcislsgCrest({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative inline-flex h-14 w-14 shrink-0 items-center justify-center",
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/ccislsg-logo.png"
        alt="CCISLSG Official Logo"
        className="h-full w-full select-none object-contain drop-shadow-sm"
        draggable={false}
      />
    </div>
  );
}
