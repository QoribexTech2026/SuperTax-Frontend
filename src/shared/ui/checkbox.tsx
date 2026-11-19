import { cn } from "@/shared/lib/utils"

import type { InputHTMLAttributes } from "react"

/**
 * Casilla del sistema de diseño: input nativo estilado con los tokens (color de
 * acento primario, borde del sistema, anillo de foco visible). Reemplaza los
 * `<input type="checkbox">` crudos para que selección, foco y color sean
 * uniformes en toda la plataforma.
 */
export function Checkbox({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn(
        "size-4 shrink-0 cursor-pointer rounded border-input accent-[var(--primary)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}
