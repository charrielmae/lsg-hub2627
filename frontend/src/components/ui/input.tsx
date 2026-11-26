import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md border border-ccis-ink/20 bg-white/90 px-3.5 py-2 text-sm text-ccis-ink shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:font-subtext placeholder:text-xs placeholder:text-ccis-espresso/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ccis-orange focus-visible:border-ccis-orange disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
