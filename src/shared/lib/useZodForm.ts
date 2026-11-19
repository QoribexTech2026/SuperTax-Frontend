import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, type FieldValues, type UseFormProps, type UseFormReturn } from "react-hook-form"

import type { z } from "zod"

/**
 * `useForm` de react-hook-form con validación zod ya enchufada. El esquema zod
 * puede reflejar las reglas de Pydantic del backend, así la validación de cliente
 * y servidor no se desincroniza.
 *
 * Se tipa con `z.input` (lo que se registra) y `z.output` (lo validado que llega
 * a `onSubmit`): con `z.coerce` ambos difieren, y RHF v7 lo modela con su tercer
 * genérico `TTransformedValues`.
 */
export function useZodForm<S extends z.ZodType<FieldValues, FieldValues>>(
  schema: S,
  options?: Omit<UseFormProps<z.input<S>, unknown, z.output<S>>, "resolver">,
): UseFormReturn<z.input<S>, unknown, z.output<S>> {
  return useForm<z.input<S>, unknown, z.output<S>>({
    ...options,
    resolver: zodResolver(schema),
  })
}
