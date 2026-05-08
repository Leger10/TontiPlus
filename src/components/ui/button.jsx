
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--primary))] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "primary-gradient text-white hover:brightness-110 shadow-md hover:shadow-[0_4px_15px_rgba(0,102,204,0.4)] border-none",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 hover:shadow-[0_4px_15px_rgba(231,76,60,0.4)] border-none",
        outline:
          "border border-[#4a4a4a] bg-transparent text-[#f5f5f5] hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/10 hover:shadow-[0_4px_15px_rgba(0,102,204,0.15)]",
        secondary:
          "bg-transparent border border-[hsl(var(--primary))] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/10 hover:shadow-[0_4px_15px_rgba(0,102,204,0.2)]",
        ghost: "text-[#f5f5f5] hover:bg-[#2d2d2d] hover:text-[hsl(var(--primary))]",
        link: "text-[hsl(var(--primary))] underline-offset-4 hover:underline",
        premium: "primary-gradient text-white shadow-md hover:shadow-[0_4px_15px_rgba(0,102,204,0.4)] hover:brightness-110 border-none",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
