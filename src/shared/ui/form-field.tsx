import { cloneElement, isValidElement, useId } from "react"

import { Label } from "@/shared/ui/label"

import type { ReactElement, ReactNode } from "react"

interface FormFieldProps {
  label: string
  htmlFor?: string
  error?: string
  hint?: string
  /** Marca el campo como obligatorio (asterisco junto a la etiqueta). */
  required?: boolean
  children: ReactNode
}

/**
 * Fila de formulario: etiqueta + control + mensaje de error o ayuda. El control
 * se conecta con react-hook-form en el padre (ver `useZodForm`). El error tiene
 * prioridad sobre la ayuda. Para accesibilidad, cablea `aria-invalid` y
 * `aria-describedby` en el control (clonándolo) apuntando al mensaje, de modo que
 * el lector de pantalla asocie el error/ayuda con el campo.
 */
export function FormField({ label, htmlFor, error, hint, required, children }: FormFieldProps) {
  const msgId = `${useId()}-msg`
  const describe = error || hint ? msgId : undefined

  const control =
    isValidElement(children) && describe
      ? cloneElement(children as ReactElement<Record<string, unknown>>, {
          "aria-invalid": error ? true : undefined,
          "aria-describedby": describe,
        })
      : children

  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      {control}
      {error ? (
        <p id={msgId} className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={msgId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
