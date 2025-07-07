import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-base font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-target",
  {
    variants: {
      variant: {
        primary: "bg-primary-blue text-white hover:bg-primary-blue-dark hover:-translate-y-0.5",
        secondary: "bg-white text-primary-blue border border-primary-blue hover:bg-primary-blue hover:text-white",
        success: "bg-prairie-green text-white hover:bg-prairie-green-dark hover:-translate-y-0.5",
        outline: "border border-gray-200 bg-white hover:bg-gray-50",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2 text-sm",
        lg: "h-14 px-8 py-4 text-lg",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }