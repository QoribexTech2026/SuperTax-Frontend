import { Download, ExternalLink, RotateCcw } from "lucide-react"
import { Link } from "react-router-dom"

import { StatusBadge } from "@/features/sire/StatusBadge"
import { formatFechaHora, formatPeriodo } from "@/shared/lib/format"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Badge } from "@/shared/ui/badge"
import { Button, buttonVariants } from "@/shared/ui/button"
import { Drawer } from "@/shared/ui/drawer"
import { MoneyCell } from "@/shared/ui/money-cell"
import { StatCard } from "@/shared/ui/stat-card"

import type { ReconciliationJob } from "@/shared/types"

const ESCENARIOS: { key: keyof ReconciliationJob; label: string }[] = [
  { key: "escenario_a_count", label: "Esc. A" },
  { key: "escenario_b_count", label: "Esc. B" },
  { key: "escenario_c_count", label: "Esc. C" },
  { key: "escenario_d_count", label: "Esc. D" },
]

const CSVS: { has: keyof ReconciliationJob; escenario: "a" | "b" | "c" | "d" }[] = [
  { has: "has_csv_a", escenario: "a" },
  { has: "has_csv_b", escenario: "b" },
  { has: "has_csv_c", escenario: "c" },
  { has: "has_csv_d", escenario: "d" },
]

function Fila({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm">{children}</span>
    </div>
  )
}

/**
 * Vista rápida de una conciliación en un Drawer lateral (modelo híbrido): resume
 * el job con los datos que ya trae la lista —sin fetch ni logs— y enlaza a la
 * página completa `/sire/jobs/:id` (deep-link con streaming en vivo y reanudar).
 */
export function JobQuickView({
  job,
  onClose,
  onResume,
  onReporte,
  onCsv,
  resumePending,
}: {
  job: ReconciliationJob
  onClose: () => void
  onResume: (id: number) => void
  onReporte: (id: number) => void
  onCsv: (id: number, escenario: "a" | "b" | "c" | "d") => void
  resumePending: boolean
}) {
  const completado = job.status === "completado"
  return (
    <Drawer
      open
      onClose={onClose}
      title={`Conciliación #${job.id}`}
      className="max-w-md"
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/sire/jobs/${job.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ExternalLink className="size-4" />
            Abrir detalle completo
          </Link>
          {job.has_report ? (
            <Button size="sm" onClick={() => onReporte(job.id)}>
              <Download className="size-4" />
              Reporte
            </Button>
          ) : null}
          {job.can_resume ? (
            <Button size="sm" variant="outline" disabled={resumePending} onClick={() => onResume(job.id)}>
              <RotateCcw className="size-4" />
              Reanudar
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <StatusBadge status={job.status} />
          <span className="font-medium tabular-nums">{formatPeriodo(job.periodo)}</span>
          <span className="capitalize text-muted-foreground">· {job.tipo_libro}</span>
        </div>

        <div className="divide-y">
          <Fila label="Archivo">
            <span className="break-all">{job.empresa_filename ?? "—"}</span>
          </Fila>
          <Fila label="Creado">{formatFechaHora(job.created_at)}</Fila>
          <Fila label="Completado">{formatFechaHora(job.completed_at)}</Fila>
          {completado ? (
            <>
              <Fila label="Diferencia IGV total">
                <MoneyCell amount={job.igv_diferencia_total} />
              </Fila>
              <Fila label="Alertas">
                {job.tiene_alertas_rojas ? (
                  <Badge tone="danger">Con alertas rojas</Badge>
                ) : (
                  <Badge tone="success">Sin alertas</Badge>
                )}
              </Fila>
            </>
          ) : null}
        </div>

        {job.status === "error" && job.error_message ? (
          <Alert variant="destructive">
            <AlertDescription>{job.error_message}</AlertDescription>
          </Alert>
        ) : null}

        {completado ? (
          <div className="grid grid-cols-4 gap-2">
            {ESCENARIOS.map(({ key, label }) => (
              <StatCard key={key} label={label} value={(job[key] as number | null) ?? 0} />
            ))}
          </div>
        ) : null}

        {completado && CSVS.some(({ has }) => job[has]) ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">CSV:</span>
            {CSVS.filter(({ has }) => job[has]).map(({ escenario }) => (
              <Button
                key={escenario}
                size="sm"
                variant="outline"
                onClick={() => onCsv(job.id, escenario)}
              >
                <Download className="size-4" />
                {escenario.toUpperCase()}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </Drawer>
  )
}
