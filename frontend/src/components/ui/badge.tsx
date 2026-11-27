import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 font-subtext text-[11px] uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-ccis-ink/15 bg-ccis-primary text-ccis-ink",
        secondary:
          "border-transparent bg-ccis-secondary text-white",
        orange:
          "border-transparent bg-ccis-orange text-white",
        cream:
          "border-ccis-ink/20 bg-ccis-cream text-ccis-ink",
        outline: "border-ccis-ink/30 text-ccis-ink",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
