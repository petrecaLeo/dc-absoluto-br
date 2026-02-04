import { type ButtonHTMLAttributes, forwardRef } from "react"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline"
  size?: "sm" | "md" | "lg"
}

const variantStyles = {
  primary: "bg-dc-blue hover:bg-dc-blue/90 text-white",
  secondary: "bg-dc-red hover:bg-dc-red/90 text-white",
  outline: "border-2 border-dc-blue text-dc-blue hover:bg-dc-blue/10",
}

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-bold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-dc-blue focus:ring-offset-2 focus:ring-offset-dc-dark disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer uppercase"

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      />
    )
  },
)

Button.displayName = "Button"
