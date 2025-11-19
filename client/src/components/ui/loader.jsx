import { cn } from "@/lib/utils"

export function Loader({ className, size = "default" }) {
  const sizeClasses = {
    sm: "h-4 w-4 border",
    default: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-2",
  }

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-muted border-t-primary",
        sizeClasses[size],
        className
      )}
    />
  )
}

