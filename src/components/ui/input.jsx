
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-[#4a4a4a] bg-[#2d2d2d] px-3 py-2 text-sm text-[#f5f5f5] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[#808080] shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--primary))] focus-visible:border-[hsl(var(--primary))] focus-visible:shadow-[0_0_15px_rgba(0,102,204,0.15)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props} />
  )
})
Input.displayName = "Input"

export { Input }
