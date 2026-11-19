/**
 * Formateadores centrales de presentación (moneda, periodo tributario, fechas).
 * Un único lugar para que toda la plataforma muestre cifras y fechas igual, y
 * para no repetir `Intl.NumberFormat`/`slice`/`toLocaleDateString` por celda.
 */

const MONEDA = new Intl.NumberFormat("es-PE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * Importe con separador de miles y 2 decimales fijos (es-PE: `1,234.50`). Un
 * valor ausente o no numérico devuelve `null` para que el llamador decida cómo
 * mostrar la ausencia (p. ej. un guión), sin inventar un `0` engañoso.
 */
export function formatMoney(amount: string | number | null | undefined): string | null {
  if (amount === null || amount === undefined || amount === "") return null
  const n = typeof amount === "number" ? amount : Number(String(amount).trim())
  if (!Number.isFinite(n)) return null
  return MONEDA.format(n)
}

/** Periodo tributario `AAAAMM` → `AAAA/MM`. Si no es válido, se devuelve tal cual. */
export function formatPeriodo(periodo: string | null | undefined): string {
  if (!periodo) return "—"
  if (periodo.length < 6) return periodo
  return `${periodo.slice(0, 4)}/${periodo.slice(4, 6)}`
}

/** Fecha ISO → fecha local es-PE (`18/11/2026`). Ausente o inválida → guión. */
export function formatFecha(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-PE")
}

/** Fecha ISO → fecha y hora local es-PE. Ausente o inválida → guión. */
export function formatFechaHora(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-PE")
}
