import { CalendarDays } from "lucide-react"

import { formatPeriodo } from "@/shared/lib/format"
import { useActivePeriodo } from "@/shared/stores/activePeriodo"
import { Select } from "@/shared/ui/select"

/** Últimos N periodos (AAAAMM) desde el mes anterior hacia atrás. */
function ultimosPeriodos(cantidad: number): string[] {
  const out: string[] = []
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - 1)
  for (let i = 0; i < cantidad; i++) {
    out.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`)
    d.setMonth(d.getMonth() - 1)
  }
  return out
}

const PERIODOS = ultimosPeriodos(18)

/**
 * Selector de periodo tributario global (contexto, junto a estudio/empresa).
 * Prefija el periodo al crear conciliaciones SIRE y el rango por defecto en
 * Correos; cada vista puede cambiarlo. Se oculta en móvil para no saturar.
 */
export function PeriodoSwitcher() {
  const periodo = useActivePeriodo((s) => s.periodo)
  const setPeriodo = useActivePeriodo((s) => s.setPeriodo)
  return (
    <div className="hidden items-center gap-1.5 sm:flex">
      <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
      <Select
        aria-label="Periodo tributario"
        className="w-auto"
        value={periodo ?? ""}
        onChange={(e) => setPeriodo(e.target.value || null)}
      >
        <option value="">Sin fijar</option>
        {PERIODOS.map((p) => (
          <option key={p} value={p}>
            {formatPeriodo(p)}
          </option>
        ))}
      </Select>
    </div>
  )
}
