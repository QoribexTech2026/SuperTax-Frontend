import { cn } from "@/shared/lib/utils"

import type { HTMLAttributes } from "react"

export type Tone = "neutral" | "info" | "success" | "warning" | "danger"

const TONES: Record<Tone, string> = {
  neutral: "bg-secondary text-secondary-foreground",
  info: "bg-accent text-accent-foreground",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-destructive/15 text-destructive",
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        TONES[tone],
        className,
      )}
      {...props}
    />
  )
}
