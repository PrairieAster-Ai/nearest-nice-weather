import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-3", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "flex items-center space-x-3 p-4 rounded-xl border-2 border-gray-200 hover:border-primary-blue-light hover:bg-blue-50 transition-all duration-200 min-h-[56px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2 data-[state=checked]:bg-primary-blue data-[state=checked]:text-white data-[state=checked]:border-primary-blue",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex-shrink-0 w-4 h-4 rounded-full border-2 border-current flex items-center justify-center">
        <div className="w-2 h-2 bg-current rounded-full" />
      </RadioGroupPrimitive.Indicator>
      {children}
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }