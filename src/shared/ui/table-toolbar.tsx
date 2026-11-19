import type { ReactNode } from "react"

/**
 * Barra de herramientas de una vista de lista: a la izquierda los filtros/búsqueda
 * rápidos; a la derecha la acción principal (CTA) y las acciones masivas/export.
 * Un único patrón para que todas las vistas de módulo coloquen sus controles en el
 * mismo sitio (un contador siempre sabe dónde filtrar y dónde crear).
 */
export function TableToolbar({
  children,
  actions,
}: {
  /** Filtros/búsqueda rápidos (izquierda). */
  children?: ReactNode
  /** Acción principal y acciones masivas/export (derecha). */
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  )
}
