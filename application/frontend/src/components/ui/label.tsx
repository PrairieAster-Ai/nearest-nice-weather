import * as React from "react"
import { cn } from "@/lib/utils"

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "flex-1 font-medium cursor-pointer text-base",
      className
    )}
    {...props}
  />
))
Label.displayName = "Label"

export { Label }