import { formatMoney } from "@/shared/lib/format"
import { cn } from "@/shared/lib/utils"

/**
 * Celda monetaria: símbolo de moneda + importe formateado (miles + 2 decimales)
 * en monoespaciada con numerales tabulares, para que las columnas de importes
 * alineen y se lean como un balance. Un valor ausente se muestra como guión, no
 * como "0" engañoso; los negativos se destacan en color destructivo (convención
 * contable). La alineación a la derecha la aplica la columna (`meta.align`).
 */
export function MoneyCell({
  amount,
  currency = "PEN",
}: {
  amount: string | number | null | undefined
  currency?: string
}) {
  const formatted = formatMoney(amount)
  if (formatted === null) {
    return <span className="text-muted-foreground">—</span>
  }
  const simbolo = currency === "USD" ? "US$" : "S/"
  const negativo = formatted.startsWith("-")
  return (
    <span className={cn("font-mono tabular-nums", negativo && "text-destructive")}>
      {simbolo} {formatted}
    </span>
  )
}
