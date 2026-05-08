
import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-2 shadow-sm",
  {
    variants: {
      variant: {
        default:
          "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-white hover:brightness-110",
        secondary:
          "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-white hover:brightness-110",
        destructive:
          "border-[hsl(var(--destructive))] bg-[hsl(var(--destructive))] text-white animate-pulse-subtle hover:brightness-110",
        outline: "border-[#4a4a4a] text-white bg-[#2d2d2d]",
        paye: "border-[hsl(var(--status-paid))] bg-[hsl(var(--status-paid))] text-white hover:brightness-110",
        retard: "border-[hsl(var(--destructive))] bg-[hsl(var(--destructive))] text-white animate-pulse-subtle hover:brightness-110",
        attente: "border-[#4a4a4a] bg-[#4a4a4a] text-white hover:brightness-110",
        prochain: "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-white font-bold hover:brightness-110",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}) {
  return (<div className={cn(badgeVariants({ variant }), className)} {...props} />);
}

export { Badge, badgeVariants }
